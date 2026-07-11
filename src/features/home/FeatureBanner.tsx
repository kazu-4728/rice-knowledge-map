"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconChevronRight } from "../../components/ui/icons";
import type { HomeBannerDef } from "./homeBanners";

/** ホーム機能バナー1件（Issue #72確定事項9）。説明の開閉と遷移操作を分離する */
export function FeatureBanner({
  def,
  imageUrl,
  onShare,
}: {
  def: HomeBannerDef;
  imageUrl: string | undefined;
  /** action.type === "share" のときに呼ばれる */
  onShare: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]">
      <div className="relative h-36 sm:h-44">
        <RemotePhoto src={imageUrl} alt="" className="h-full w-full object-cover" fallbackVariant="field" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-lg font-bold text-white drop-shadow">{def.title}</p>
          <p className="mt-0.5 text-xs text-white/85 drop-shadow">{def.summary}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1 py-1 text-sm font-bold text-green-700"
        >
          <IconChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
          {open ? "詳細を閉じる" : "詳しく見る"}
        </button>

        {def.action.type === "link" ? (
          <Link
            href={def.action.href}
            aria-label={`${def.title}へ進む`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-white transition-colors hover:bg-green-800"
          >
            <IconChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onShare}
            aria-label={def.title}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-white transition-colors hover:bg-green-800"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 px-4 py-4 sm:grid-cols-3">
          {def.detail.map((d) => (
            <div key={d.label}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">{d.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{d.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
