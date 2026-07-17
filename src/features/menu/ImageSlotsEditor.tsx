"use client";

import { useEffect, useRef, useState } from "react";
import { loadImageSlots, saveImageSlots, type ImageSlot, type ImageSlots } from "../../lib/data/siteContent";
import { getSupabase } from "../../lib/supabase/client";
import { ensureGroupId } from "../../lib/data/farm";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconCamera, IconCheck } from "../../components/ui/icons";
import { compressImage } from "../../lib/utils/imageCompress";

type SlotKey =
  | "home"
  | "talk"
  | "fieldDefault"
  | "authedHero"
  | "calendar.spring"
  | "calendar.summer"
  | "calendar.autumn"
  | "calendar.winter"
  | "recordsCategory.水管理"
  | "recordsCategory.作業"
  | "recordsCategory.異常"
  | "recordsCategory.音声"
  | "homeBanners.map"
  | "homeBanners.talk"
  | "homeBanners.family"
  | "homeBanners.story"
  | "homeBanners.line";

const SLOT_LABELS: { key: SlotKey; label: string }[] = [
  { key: "home", label: "ホームのヒーロー" },
  { key: "talk", label: "トークのカバー" },
  { key: "fieldDefault", label: "田んぼの既定カバー（写真未登録時）" },
  { key: "authedHero", label: "ホームのヒーロー（ログイン後）" },
  { key: "calendar.spring", label: "カレンダー（春）" },
  { key: "calendar.summer", label: "カレンダー（夏）" },
  { key: "calendar.autumn", label: "カレンダー（秋）" },
  { key: "calendar.winter", label: "カレンダー（冬）" },
  { key: "recordsCategory.水管理", label: "記録の既定カバー（水管理）" },
  { key: "recordsCategory.作業", label: "記録の既定カバー（作業）" },
  { key: "recordsCategory.異常", label: "記録の既定カバー（異常）" },
  { key: "recordsCategory.音声", label: "記録の既定カバー（音声）" },
  { key: "homeBanners.map", label: "ホームのバナー（マップ）" },
  { key: "homeBanners.talk", label: "ホームのバナー（今日の記録を残す）" },
  { key: "homeBanners.family", label: "ホームのバナー（みんなの記録）" },
  { key: "homeBanners.story", label: "ホームのバナー（各場所の記録）" },
  { key: "homeBanners.line", label: "ホームのバナー（共有する）" },
];

function getSlot(slots: ImageSlots, key: SlotKey): ImageSlot | undefined {
  if (key.startsWith("calendar.")) {
    const season = key.split(".")[1] as keyof NonNullable<ImageSlots["calendar"]>;
    return slots.calendar?.[season];
  }
  if (key.startsWith("recordsCategory.")) {
    const cat = key.split(".")[1] as keyof NonNullable<ImageSlots["recordsCategory"]>;
    return slots.recordsCategory?.[cat];
  }
  if (key.startsWith("homeBanners.")) {
    const banner = key.split(".")[1] as keyof NonNullable<ImageSlots["homeBanners"]>;
    return slots.homeBanners?.[banner];
  }
  return slots[key as "home" | "talk" | "fieldDefault" | "authedHero"];
}

function setSlot(slots: ImageSlots, key: SlotKey, slot: ImageSlot): ImageSlots {
  if (key.startsWith("calendar.")) {
    const season = key.split(".")[1] as keyof NonNullable<ImageSlots["calendar"]>;
    return { ...slots, calendar: { ...slots.calendar, [season]: slot } };
  }
  if (key.startsWith("recordsCategory.")) {
    const cat = key.split(".")[1] as keyof NonNullable<ImageSlots["recordsCategory"]>;
    return { ...slots, recordsCategory: { ...slots.recordsCategory, [cat]: slot } };
  }
  if (key.startsWith("homeBanners.")) {
    const banner = key.split(".")[1] as keyof NonNullable<ImageSlots["homeBanners"]>;
    return { ...slots, homeBanners: { ...slots.homeBanners, [banner]: slot } };
  }
  return { ...slots, [key]: slot };
}

async function uploadSlotImage(groupId: string, file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const blob = await compressImage(file);
  const path = `groups/${groupId}/site/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) {
    console.warn("[imageSlots] upload failed", error);
    return null;
  }
  return path;
}

/** ホーム/トーク/田んぼ既定/カレンダー/記録カテゴリの差し替え可能カバー画像を編集する */
export default function ImageSlotsEditor() {
  const [slots, setSlots] = useState<ImageSlots>({});
  const [groupId, setGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadImageSlots(true).then(setSlots);
    ensureGroupId().then(setGroupId);
  }, []);

  const handleImageSelect = async (key: SlotKey, file: File) => {
    if (!groupId) return;
    const path = await uploadSlotImage(groupId, file);
    if (path) {
      setSlots((prev) =>
        setSlot(prev, key, { image_path: path, image_url: URL.createObjectURL(file) })
      );
    }
  };

  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    setMessage(null);
    // blob: URLはローカルプレビュー専用のため保存しない（image_pathがあれば次回読み込み時に署名URLへ変換される）
    const strip = (s: ImageSlot | undefined): ImageSlot | undefined =>
      s?.image_url?.startsWith("blob:") ? { ...s, image_url: undefined } : s;
    const slotsToSave: ImageSlots = {
      home: strip(slots.home),
      talk: strip(slots.talk),
      fieldDefault: strip(slots.fieldDefault),
      calendar: slots.calendar
        ? {
            spring: strip(slots.calendar.spring),
            summer: strip(slots.calendar.summer),
            autumn: strip(slots.calendar.autumn),
            winter: strip(slots.calendar.winter),
          }
        : undefined,
      recordsCategory: slots.recordsCategory
        ? {
            水管理: strip(slots.recordsCategory.水管理),
            作業: strip(slots.recordsCategory.作業),
            異常: strip(slots.recordsCategory.異常),
            音声: strip(slots.recordsCategory.音声),
          }
        : undefined,
      homeBanners: slots.homeBanners
        ? {
            map: strip(slots.homeBanners.map),
            talk: strip(slots.homeBanners.talk),
            family: strip(slots.homeBanners.family),
            story: strip(slots.homeBanners.story),
            line: strip(slots.homeBanners.line),
          }
        : undefined,
    };
    const { error } = await saveImageSlots(groupId, slotsToSave);
    setMessage(error ? `保存に失敗しました: ${error}` : "保存しました");
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {SLOT_LABELS.map(({ key, label }) => {
          const slot = getSlot(slots, key);
          return (
            <div key={key} className="rounded-xl border border-gray-200 bg-white p-2">
              <div className="relative h-20 overflow-hidden rounded-lg">
                <RemotePhoto src={slot?.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => fileInputRefs.current[key]?.click()}
                  className="absolute bottom-1 right-1 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-1 text-[10px] font-semibold text-white"
                >
                  <IconCamera className="h-3 w-3" />
                  変更
                </button>
                <input
                  ref={(el) => { fileInputRefs.current[key] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(key, f); }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-bold text-gray-700">{label}</p>
            </div>
          );
        })}
      </div>

      {message && (
        <p className={`text-sm ${message.includes("失敗") ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !groupId}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        <IconCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
        {saving ? "保存中…" : "変更を保存する"}
      </button>
    </div>
  );
}
