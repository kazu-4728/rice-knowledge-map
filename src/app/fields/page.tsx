"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { loadFarmData, updateFieldPhoto } from "../../lib/data/farm";
import { getSupabase } from "../../lib/supabase/client";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconCamera, IconChevronRight, IconFieldGrid, IconPlus } from "../../components/ui/icons";
import { compressImage } from "../../lib/utils/imageCompress";

type FieldItem = {
  id: string;
  groupId: string;
  name: string;
  color: string;
  areaSqm: number | null;
  photoPath: string | null;
};

async function uploadFieldPhoto(groupId: string, fieldId: string, file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const blob = await compressImage(file);
  const path = `groups/${groupId}/fields/${fieldId}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) { console.warn("[fields] upload failed", error); return null; }
  return path;
}

export default function FieldsPage() {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "anon" | "error">("loading");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadFarmData().then(async (data) => {
      setMode(data.mode);
      const items: FieldItem[] = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        groupId: f.properties?.group_id ?? data.groupId ?? "",
        name: String(f.properties?.name ?? ""),
        color: String(f.properties?.color ?? "#22C55E"),
        areaSqm: typeof f.properties?.area_sqm === "number" ? f.properties.area_sqm : null,
        photoPath: f.properties?.photo_path ?? null,
      }));
      setFields(items);

      // batch signed URLs for fields with photos
      const paths = items.flatMap((f) => f.photoPath ? [f.photoPath] : []);
      if (paths.length > 0) {
        const sb = getSupabase();
        if (sb) {
          const { data: signed } = await sb.storage.from("images").createSignedUrls(paths, 3600);
          const map: Record<string, string> = {};
          signed?.forEach((s, i) => { if (s.signedUrl && !s.error) map[paths[i]] = s.signedUrl; });
          const urlMap: Record<string, string> = {};
          items.forEach((f) => { if (f.photoPath && map[f.photoPath]) urlMap[f.id] = map[f.photoPath]; });
          setPhotoUrls(urlMap);
        }
      }
    });
  }, []);

  const handlePhotoSelect = async (field: FieldItem, file: File) => {
    if (!field.groupId) return;
    const path = await uploadFieldPhoto(field.groupId, field.id, file);
    if (!path) return;
    const saved = await updateFieldPhoto(field.id, path);
    if (!saved) return;
    // revoke previous blob URL to avoid memory growth
    const prevUrl = photoUrls[field.id];
    if (prevUrl?.startsWith("blob:")) URL.revokeObjectURL(prevUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrls((prev) => ({ ...prev, [field.id]: url }));
    setFields((prev) => prev.map((f) => f.id === field.id ? { ...f, photoPath: path } : f));
  };

  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
    return `${sqm.toFixed(0)}㎡`;
  };

  return (
    <AppShell>
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <IconFieldGrid className="h-6 w-6 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-900">田んぼ一覧</h1>
          </div>
          {mode !== "loading" && (
            <span className="text-sm text-gray-500">{fields.length}枚</span>
          )}
        </div>

        {mode === "anon" && (
          <Link
            href="/login?redirect=%2Ffields"
            className="block rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <p className="text-sm font-bold text-gray-900">ログインすると田んぼ一覧が表示されます</p>
            <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
          </Link>
        )}

        {mode === "error" && (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">田んぼを読み込めませんでした</p>
            <p className="mt-1 text-xs text-gray-500">通信環境を確認して開き直してください</p>
          </div>
        )}

        {mode === "loading" && (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {(mode === "live" || mode === "demo") && fields.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">まだ田んぼが登録されていません</p>
            <p className="mt-1 text-xs text-gray-500">マップで田んぼの輪郭をなぞって登録できます</p>
          </div>
        )}

        {(mode === "live" || mode === "demo") && fields.length > 0 && (
          <div className="space-y-2.5">
            {fields.map((field) => (
              <div key={field.id} className="relative rounded-2xl bg-white shadow-sm overflow-hidden">
                <Link
                  href={`/records?field=${encodeURIComponent(field.id)}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                    <RemotePhoto
                      src={photoUrls[field.id]}
                      alt={field.name}
                      className="h-full w-full object-cover"
                      fallbackVariant="field"
                    />
                    {!photoUrls[field.id] && (
                      <span
                        className="absolute inset-0 opacity-45"
                        style={{ background: field.color }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">
                      {field.name}
                      {formatArea(field.areaSqm) && (
                        <span className="ml-2 text-sm font-medium text-gray-500">{formatArea(field.areaSqm)}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">記録を見る</p>
                  </div>
                  <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
                </Link>
                {field.groupId && (
                  <>
                    <button
                      onClick={() => fileInputRefs.current[field.id]?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs font-semibold text-white"
                      aria-label="写真を変更"
                    >
                      <IconCamera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[field.id] = el; }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(field, f); e.currentTarget.value = ""; }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <Link
          href="/map"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-600 bg-white py-4 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
        >
          <IconPlus className="h-5 w-5" strokeWidth={2.2} />
          田んぼを追加（マップで描く）
        </Link>
      </div>
    </AppShell>
  );
}
