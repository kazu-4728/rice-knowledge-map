"use client";

import { useState } from "react";
import Link from "next/link";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconChevronRight } from "../../components/ui/icons";
import { ScreenSequence, type ScreenStep } from "./ScreenSequence";
import type { HomeBannerDef } from "./homeBanners";

/**
 * ホームの機能バナー1件。
 * モバイルは写真上・テキスト下の縦積み（幅320pxでも文字が縦割れしない）、
 * sm以上は写真左の横並び。バナー本体のタップで詳細を開閉し、
 * 遷移/共有はラベル付きボタンに分離する（押した先が名前で分かるようにする）。
 * 詳細には箇条書きに加えて、アプリ実画面のステップ再生（screens）を表示できる。
 */
export function FeatureBanner({
  def,
  imageUrl,
  onShare,
  step,
  screens,
}: {
  def: HomeBannerDef;
  imageUrl: string | undefined;
  /** action.type === "share" のときに呼ばれる */
  onShare: () => void;
  /** 利用の流れの順番（1始まり）。写真の左上にバッジ表示 */
  step?: number;
  /** 展開時に見せるアプリ実画面のステップ列（未指定なら箇条書きのみ） */
  screens?: ScreenStep[];
}) {
  const [open, setOpen] = useState(false);
  const { Icon } = def;

  const actionButtonClass =
    "inline-flex items-center justify-center gap-1 rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(21,93,56,0.7)] transition-colors hover:bg-green-800 active:scale-95";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]">
      {/* 開閉トグル（写真+タイトル+概要。遷移/共有ボタンは外に分離） */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${def.title}の詳細を${open ? "閉じる" : "開く"}`}
        onClick={() => setOpen((v) => !v)}
        className="block w-full text-left"
      >
        <div className="sm:flex sm:items-stretch">
          {/* 実写（モバイル: 上部いっぱい／sm+: 左カラム） */}
          <div className="relative h-32 w-full shrink-0 sm:h-auto sm:w-44 sm:self-stretch">
            <RemotePhoto src={imageUrl} alt="" className="absolute inset-0 h-full w-full" fallbackVariant="field" />
            {step !== undefined && (
              <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-700/95 text-xs font-bold text-white shadow-md">
                {step}
              </span>
            )}
          </div>

          {/* タイトル+概要 */}
          <div className="min-w-0 flex-1 px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5.5 w-5.5 shrink-0 text-green-700" />
              <h3 className="min-w-0 font-heading text-[17px] font-bold leading-snug tracking-tight text-green-900 sm:text-lg">
                {def.title}
              </h3>
              <IconChevronRight
                aria-hidden
                className={`ml-auto h-4.5 w-4.5 shrink-0 text-gray-400 transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{def.summary}</p>
          </div>
        </div>
      </button>

      {/* 展開時の詳細: アプリ実画面のステップ再生 + できること／使うタイミング／その後どうなる? */}
      {open && (
        <div className="mx-3 mb-1 rounded-xl border border-emerald-100 bg-[#f6f9f3] p-3 sm:mx-4">
          {screens && screens.length > 0 && <ScreenSequence steps={screens} className="mb-3" />}
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {def.detail.map((col) => (
              <div key={col.label} className="min-w-0">
                <p className="text-xs font-bold text-green-900">{col.label}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {col.items.map((t) => (
                    <li key={t} className="flex gap-1.5 text-xs leading-snug text-gray-600">
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

      {/* 遷移/共有（ラベル付きボタン） */}
      <div className="flex justify-end px-4 pb-3.5 pt-2 sm:px-5">
        {def.action.type === "link" ? (
          <Link href={def.action.href} className={actionButtonClass}>
            {def.actionLabel}
            <IconChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button type="button" onClick={onShare} className={actionButtonClass}>
            {def.actionLabel}
            <IconChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
