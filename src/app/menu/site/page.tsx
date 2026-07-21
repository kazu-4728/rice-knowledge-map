"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import SiteContentEditor from "../../../features/menu/SiteContentEditor";
import ImageSlotsEditor from "../../../features/menu/ImageSlotsEditor";
import LandingPreview from "../../../features/menu/LandingPreview";
import { IconChevronRight } from "../../../components/ui/icons";
import { getMyRole, ensureGroupId } from "../../../lib/data/farm";
import { DEFAULT_SLIDES, type HeroSlide } from "../../../lib/data/siteContent";

export default function SiteSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [showLandingPreview, setShowLandingPreview] = useState(false);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);

  useEffect(() => {
    (async () => {
      const groupId = await ensureGroupId();
      if (!groupId) { setAllowed(false); return; }
      const role = await getMyRole(groupId);
      setAllowed(role === "owner");
    })();
  }, []);

  if (allowed === null) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-gray-400">読み込み中…</p>
        </div>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell>
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-gray-600">この設定はオーナーのみ編集できます。</p>
          <button onClick={() => router.back()} className="text-sm font-bold text-green-700">
            戻る
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backHref="/menu" backLabel="メニュー">
      <div className="px-3 pb-8 pt-3">
        <h1 className="mb-1 text-lg font-bold text-gray-900">サイト設定</h1>
        <p className="mb-3 text-xs text-gray-500">
          設定した画像が実際にどう見えるか、その場で確認できます。
        </p>

        {/* ログイン中は通常の導線でLPを見られないため、確認手段はここに集約する。
            「実際の画面で確認」は ?lp=preview でLP全体（バナー・使い方含む）を表示する */}
        <div className="mb-2">
          <button
            onClick={() => setShowLandingPreview((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800"
          >
            ヒーローをその場で確認
            <IconChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showLandingPreview ? "rotate-90" : ""}`} />
          </button>
        </div>
        {showLandingPreview && <LandingPreview slides={heroSlides} />}
        <Link
          href="/?lp=preview"
          className="mb-6 mt-2 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-green-700"
        >
          ランディング全体を実際の画面で確認
          <IconChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <h2 className="mb-1 mt-6 text-base font-bold text-gray-900">ランディングのヒーロースライド</h2>
        <p className="mb-4 text-xs text-gray-500">
          未ログインの人が最初に見るランディング（紹介ページ）の写真・文章を編集できます。ログイン後のホームには表示されません。保存前の編集中の内容も上の「ヒーローをその場で確認」にそのまま反映されます。
        </p>
        <SiteContentEditor onSlidesChange={setHeroSlides} />

        <h2 className="mb-1 mt-6 text-base font-bold text-gray-900">各画面のカバー写真</h2>
        <p className="mb-3 text-xs text-gray-500">
          田んぼ・記録・カレンダー・ランディングのバナーで、写真が未登録のときに使う既定の実写を差し替えられます。
        </p>
        <ImageSlotsEditor />
      </div>
    </AppShell>
  );
}
