"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadFarmData, updateFieldPhoto } from "../../lib/data/farm";
import { loadRecords } from "../../lib/data/records";
import { getSupabase } from "../../lib/supabase/client";
import { compressImage } from "../../lib/utils/imageCompress";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { FieldPoint, RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconMic,
  IconPinFill,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

const POINT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  inlet: { label: "入水口", icon: <IconDropFill className="h-4 w-4 text-sky-500" />, color: "bg-sky-50" },
  outlet: { label: "出水口", icon: <IconWaves className="h-4 w-4 text-blue-500" />, color: "bg-blue-50" },
  weed: { label: "雑草", icon: <IconSprout className="h-4 w-4 text-green-600" />, color: "bg-green-50" },
  caution: { label: "異常", icon: <IconWarningFill className="h-4 w-4 text-amber-500" />, color: "bg-amber-50" },
};

async function uploadFieldPhoto(groupId: string, fieldId: string, file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const blob = await compressImage(file);
  const path = `groups/${groupId}/fields/${fieldId}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) { console.warn("[field-detail] upload failed", error); return null; }
  return path;
}

type Props = { fieldId: string };

export default function FieldDetailScreen({ fieldId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldName, setFieldName] = useState("");
  const [fieldColor, setFieldColor] = useState("#22C55E");
  const [fieldGroupId, setFieldGroupId] = useState("");
  const [areaSqm, setAreaSqm] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadFarmData(), loadRecords()]).then(async ([farm, rec]) => {
      const feature = farm.fieldsGeoJSON.features.find(
        (f) => String(f.id ?? f.properties?.id ?? "") === fieldId
      );
      if (feature) {
        setFieldName(String(feature.properties?.name ?? ""));
        setFieldColor(String(feature.properties?.color ?? "#22C55E"));
        setFieldGroupId(String(feature.properties?.group_id ?? farm.groupId ?? ""));
        setAreaSqm(typeof feature.properties?.area_sqm === "number" ? feature.properties.area_sqm : null);
        const pPath: string | null = feature.properties?.photo_path ?? null;

        if (pPath) {
          const sb = getSupabase();
          if (sb) {
            const { data } = await sb.storage.from("images").createSignedUrls([pPath], 3600);
            if (data?.[0]?.signedUrl && !data[0].error) setPhotoUrl(data[0].signedUrl);
          }
        }
      }

      const fieldPoints = farm.points.filter((p) => p.fieldId === fieldId);
      setPoints(fieldPoints);

      const fieldRecords = rec.records.filter((r) => r.fieldId === fieldId);
      setRecords(fieldRecords);
      setThumbUrls(rec.thumbUrls);
      setLoading(false);
    });
  }, [fieldId]);

  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
    return `${sqm.toFixed(0)}㎡`;
  };

  const handlePhotoSelect = async (file: File) => {
    if (!fieldGroupId) return;
    const path = await uploadFieldPhoto(fieldGroupId, fieldId, file);
    if (!path) return;
    const saved = await updateFieldPhoto(fieldId, path);
    if (!saved) return;
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  };

  if (loading) {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      {/* カバー写真 */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm" style={{ height: "52vw", maxHeight: 260, minHeight: 160 }}>
        <RemotePhoto
          src={photoUrl ?? undefined}
          alt={fieldName}
          className="h-full w-full object-cover"
          fallbackVariant="field"
        />
        {!photoUrl && (
          <span className="absolute inset-0 opacity-40" style={{ background: fieldColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-white drop-shadow">{fieldName || "名前のない田んぼ"}</h1>
          {areaSqm !== null && (
            <p className="mt-0.5 text-sm text-white/80">{formatArea(areaSqm)}</p>
          )}
        </div>
        {fieldGroupId && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-semibold text-white"
            aria-label="写真を変更"
          >
            <IconCamera className="h-3.5 w-3.5" />
            写真を変更
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); e.currentTarget.value = ""; }}
        />
      </div>

      {/* 記録する */}
      <div className="flex gap-3">
        <Link
          href={`/records/new?field=${encodeURIComponent(fieldId)}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          <IconCamera className="h-4.5 w-4.5" />
          写真で記録
        </Link>
        <Link
          href={`/records/new?type=audio&field=${encodeURIComponent(fieldId)}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
        >
          <IconMic className="h-4.5 w-4.5" />
          音声メモ
        </Link>
      </div>

      <Link
        href={`/records?field=${encodeURIComponent(fieldId)}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
      >
        この田んぼの記録一覧を見る
        <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
      </Link>

      {/* ピン一覧 */}
      {points.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <IconPinFill className="h-5 w-5 text-green-700" />
            <h2 className="text-sm font-bold text-gray-900">登録ポイント</h2>
            <span className="ml-auto text-xs text-gray-400">{points.length}件</span>
          </div>
          <ul className="space-y-2">
            {points.map((point) => {
              const meta = POINT_TYPE_LABELS[point.type] ?? POINT_TYPE_LABELS["caution"];
              return (
                <li key={point.id}>
                  <Link
                    href={`/records/new?field=${encodeURIComponent(fieldId)}&point=${encodeURIComponent(point.id)}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 transition-colors hover:bg-gray-50"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{point.name || meta.label}</p>
                      <p className="text-xs text-gray-400">{meta.label}</p>
                    </div>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* この田んぼの最近の記録 */}
      {records.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">最近の記録</h2>
            <Link href={`/records?field=${encodeURIComponent(fieldId)}`} className="flex items-center text-xs font-semibold text-green-700">
              すべて見る <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul>
            {records.slice(0, 5).map((record, i) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <RecordThumb
                    media={record.media}
                    variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
                    duration={record.audioDuration}
                    thumbUrl={thumbUrls[record.id]}
                    className="h-12 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{record.date} {record.time}</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {records.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">まだ記録がありません</p>
          <p className="mt-1 text-xs text-gray-400">上のボタンから最初の記録を作りましょう</p>
        </div>
      )}
    </div>
  );
}
