"use client";

import { useState } from "react";
import Link from "next/link";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconChevronRight } from "../../components/ui/icons";
import type { HomeBannerDef } from "./homeBanners";

/**
 * ホームの機能バナー1件（Issue #72確定事項9）。
 * 横長レイアウト（左: 実写／中央: タイトル+概要／右端: ページ遷移ボタン）。
 * バナー本体のタップで詳細（3カラムの箇条書き）を開閉し、
 * 遷移操作は右端の丸ボタンに分離する。
 */
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
  const { Icon } = def;

  const toggle = () => setOpen((v) => !v);

  const goButtonClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-white shadow-[0_4px_12px_-4px_rgba(21,93,56,0.7)] transition-colors hover:bg-green-800 active:scale-95";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]">
      <div className="flex items-stretch">
        {/* 開閉トグル（実写＋タイトル+概要のみをラップ。遷移/共有は兄弟要素に分離） */}
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${def.title}の詳細を${open ? "閉じる" : "開く"}`}
          onClick={toggle}
          className="flex min-w-0 flex-1 items-stretch text-left"
        >
          {/* 実写（バナー左端・行の高さいっぱい） */}
          <div className="relative w-28 shrink-0 self-stretch sm:w-44">
            <RemotePhoto src={imageUrl} alt="" className="absolute inset-0 h-full w-full" fallbackVariant="field" />
          </div>

          {/* タイトル+概要 */}
          <div className="min-w-0 flex-1 px-3.5 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5.5 w-5.5 shrink-0 text-green-700" />
              <h3 className="min-w-0 font-heading text-[17px] font-bold leading-snug tracking-tight text-green-900 sm:text-lg">
                {def.title}
              </h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{def.summary}</p>
          </div>
        </button>

        {/* 右端: ページ遷移（丸ボタン）と開閉インジケーター（トグルの兄弟要素） */}
        <div className="flex flex-col items-center justify-center gap-1.5 pr-3">
          {def.action.type === "link" ? (
            <Link href={def.action.href} aria-label={`${def.title}のページへ進む`} className={goButtonClass}>
              <IconChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onShare}
              aria-label={`${def.title}を共有する`}
              className={goButtonClass}
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          )}
          <IconChevronRight
            aria-hidden
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
          />
        </div>
      </div>

      {/* 展開時の詳細（できること／使うタイミング／その後どうなる?） */}
      {open && (
        <div className="mx-3 mb-3 rounded-xl border border-emerald-100 bg-[#f6f9f3] p-3 sm:mx-4 sm:mb-4">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {def.detail.map((col) => (
              <div key={col.label} className="min-w-0">
                <p className="text-[11px] font-bold text-green-900 sm:text-xs">{col.label}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {col.items.map((t) => (
                    <li key={t} className="flex gap-1.5 text-[10px] leading-snug text-gray-600 sm:text-xs">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
