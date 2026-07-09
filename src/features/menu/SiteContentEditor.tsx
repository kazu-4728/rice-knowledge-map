"use client";

import { useEffect, useRef, useState } from "react";
import { loadSiteContent, saveSiteContent, DEFAULT_SLIDES, type HeroSlide } from "../../lib/data/siteContent";
import { getSupabase } from "../../lib/supabase/client";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconCamera, IconCheck, IconPlus } from "../../components/ui/icons";
import { compressImage } from "../../lib/utils/imageCompress";

async function uploadSiteImage(groupId: string, file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const blob = await compressImage(file);
  const path = `groups/${groupId}/site/${crypto.randomUUID()}.jpg`;

  const { error } = await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) {
    console.warn("[siteContent] upload failed", error);
    return null;
  }

  return path;
}

export default function SiteContentEditor({
  onSlidesChange,
}: {
  /** 保存前の編集中の内容も含めて、最新のslidesを親へ通知する（プレビュー表示用） */
  onSlidesChange?: (slides: HeroSlide[]) => void;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadSiteContent().then((result) => {
      setSlides(result.slides);
      setGroupId(result.groupId);
    });
  }, []);

  useEffect(() => {
    onSlidesChange?.(slides);
  }, [slides, onSlidesChange]);

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleImageSelect = async (index: number, file: File) => {
    if (!groupId) return;
    const path = await uploadSiteImage(groupId, file);
    if (path) {
      // ローカルプレビュー用にURLも保持する
      updateSlide(index, { image_path: path, image_url: URL.createObjectURL(await compressImage(file)) });
    }
  };

  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    setMessage(null);
    // blob: URLはローカルプレビュー専用のため保存しない
    const slidesToSave = slides.map((s) =>
      s.image_url?.startsWith("blob:") ? { ...s, image_url: undefined } : s
    );
    const { error } = await saveSiteContent(groupId, slidesToSave);
    setMessage(error ? `保存に失敗しました: ${error}` : "保存しました");
    setSaving(false);
  };

  const addSlide = () => {
    setSlides((prev) => [...prev, { title: "新しいスライド", body: "" }]);
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="relative h-32 overflow-hidden rounded-xl">
            <RemotePhoto
              src={slide.image_url}
              alt=""
              className="h-full w-full object-cover"
              fallbackVariant={i % 2 === 0 ? "field" : "water"}
            />
            <button
              onClick={() => fileInputRefs.current[i]?.click()}
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white"
            >
              <IconCamera className="h-3.5 w-3.5" />
              写真を変更
            </button>
            <input
              ref={(el) => { fileInputRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(i, f); }}
            />
          </div>
          <div className="mt-2 space-y-1.5">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => updateSlide(i, { title: e.target.value })}
              placeholder="スライドタイトル"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-green-600"
            />
            <textarea
              value={slide.body}
              onChange={(e) => updateSlide(i, { body: e.target.value })}
              placeholder="説明文"
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-green-600"
            />
          </div>
          {slides.length > 1 && (
            <button
              onClick={() => removeSlide(i)}
              className="mt-1.5 text-xs text-red-500"
            >
              このスライドを削除
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addSlide}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-600 bg-white py-3 text-sm font-bold text-green-700"
      >
        <IconPlus className="h-4 w-4" strokeWidth={2.2} />
        スライドを追加
      </button>

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
