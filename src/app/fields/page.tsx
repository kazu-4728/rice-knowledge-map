"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { loadFarmData, updateFieldPhoto } from "../../lib/data/farm";
import { getSupabase } from "../../lib/supabase/client";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { IconCamera, IconFieldGrid, IconPlus } from "../../components/ui/icons";
import { compressImage } from "../../lib/utils/imageCompress";
import { formatAreaSqm } from "../../lib/utils/geo";
import { useAreaUnit } from "../../lib/hooks/useAreaUnit";

type FieldItem = {
  id: string;
  groupId: string;
  name: string;
  color: string;
  areaSqm: number | null;
  photoPath: string | null;
};

type FieldStatus = {
  issueCount: number;
  needsCheckCount: number;
  lastRecordDate: string | null;
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
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldStatus>>({});
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "anon" | "error">("loading");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.getSession().then(async ({ data: sess }) => {
        if (!sess.session) return;
        type DateRow = { field_id: string; recorded_at: string };
        const PAGE = 1000;
        const allRows: DateRow[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data: page } = await sb.from("records")
            .select("field_id, recorded_at")
            .not("field_id", "is", null)
            .order("recorded_at", { ascending: false })
            .range(from, from + PAGE - 1);
          if (!page || page.length === 0) break;
          allRows.push(...(page as DateRow[]));
          if (page.length < PAGE) break;
        }
        const lastMap: Record<string, string> = {};
        for (const r of allRows) {
          if (r.field_id && !lastMap[r.field_id]) {
            const d = new Date(r.recorded_at);
            const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
            lastMap[r.field_id] = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${youbi}）`;
          }
        }
        setFieldStatuses((prev) => {
          const next = { ...prev };
          for (const [fid, date] of Object.entries(lastMap)) {
            next[fid] = { ...next[fid], issueCount: next[fid]?.issueCount ?? 0, needsCheckCount: next[fid]?.needsCheckCount ?? 0, lastRecordDate: date };
          }
          return next;
        });
      });
    }

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

      const statusMap: Record<string, FieldStatus> = {};
      for (const p of data.points) {
        if (!p.fieldId) continue;
        if (!statusMap[p.fieldId]) statusMap[p.fieldId] = { issueCount: 0, needsCheckCount: 0, lastRecordDate: null };
        if (p.status === "issue") statusMap[p.fieldId].issueCount++;
        else if (p.status === "needs_check") statusMap[p.fieldId].needsCheckCount++;
      }
      setFieldStatuses((prev) => {
        const next = { ...prev };
        for (const [fid, s] of Object.entries(statusMap)) {
          next[fid] = { ...next[fid], lastRecordDate: next[fid]?.lastRecordDate ?? null, issueCount: s.issueCount, needsCheckCount: s.needsCheckCount };
        }
        return next;
      });

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

  const [areaUnit, cycleAreaUnit] = useAreaUnit();
  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    return formatAreaSqm(sqm, areaUnit);
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => {
              const fs = fieldStatuses[field.id];
              const hasAttention = fs && (fs.issueCount > 0 || fs.needsCheckCount > 0);
              return (
              <div
                key={field.id}
                className={`relative overflow-hidden rounded-2xl bg-white shadow-sm transition-transform active:scale-[0.99] ${
                  hasAttention ? "ring-2 ring-amber-300" : ""
                }`}
              >
                <Link href={`/fields/${encodeURIComponent(field.id)}`} className="block">
                  {/* 写真が主役のヒーロー部（Googleマップの場所カード風） */}
                  <div className="relative h-36">
                    <RemotePhoto
                      src={photoUrls[field.id]}
                      alt={field.name}
                      className="h-full w-full object-cover"
                      fallbackVariant="field"
                    />
                    {!photoUrls[field.id] && (
                      <span className="absolute inset-0 opacity-40" style={{ background: field.color }} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />

                    {/* 状態バッジ（写真の上・信号色） */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {fs?.issueCount ? <StatusBadge status="issue" label={`異常${fs.issueCount}`} /> : null}
                      {fs?.needsCheckCount ? <StatusBadge status="needs_check" label={`要確認${fs.needsCheckCount}`} /> : null}
                      {!hasAttention && fs?.lastRecordDate ? <StatusBadge status="normal" label="順調" /> : null}
                    </div>

                    {/* 田んぼ名と面積（写真の上） */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="truncate text-lg font-bold text-white drop-shadow">
                        {field.name || "名前のない田んぼ"}
                      </p>
                    </div>
                  </div>

                  {/* 情報行 */}
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    {formatArea(field.areaSqm) && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleAreaUnit(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); cycleAreaUnit(); } }}
                        className="shrink-0 border-b border-dotted border-gray-300 text-sm font-bold text-gray-700 active:opacity-60"
                      >
                        {formatArea(field.areaSqm)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-right text-xs text-gray-400">
                      {fs?.lastRecordDate ? `最終記録 ${fs.lastRecordDate}` : "記録なし"}
                    </span>
                  </div>
                </Link>
                {field.groupId && (
                  <>
                    <button
                      onClick={() => fileInputRefs.current[field.id]?.click()}
                      className="absolute right-2 top-24 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm"
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
            );
            })}
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
