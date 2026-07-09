"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/layout/AppShell";
import SiteContentEditor from "../../../features/menu/SiteContentEditor";
import ImageSlotsEditor from "../../../features/menu/ImageSlotsEditor";
import LandingPreview from "../../../features/menu/LandingPreview";
import { IconChevronRight } from "../../../components/ui/icons";
import { getMyRole, ensureGroupId } from "../../../lib/data/farm";

export default function SiteSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [showLandingPreview, setShowLandingPreview] = useState(false);

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

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowLandingPreview((v) => !v)}
            className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800"
          >
            ランディングを確認
            <IconChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showLandingPreview ? "rotate-90" : ""}`} />
          </button>
          <Link
            href="/map?story=1"
            className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800"
          >
            今日の田んぼを確認
            <IconChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
        {showLandingPreview && <LandingPreview />}

        <h2 className="mb-1 mt-6 text-base font-bold text-gray-900">ランディングページのヒーロースライド</h2>
        <p className="mb-4 text-xs text-gray-500">
          ログイン前に表示されるランディングページ（トップ画面）の写真・文章を編集できます。ここでの変更は「ランディングを確認」から見られます。
        </p>
        <SiteContentEditor />

        <h2 className="mb-1 mt-6 text-base font-bold text-gray-900">各画面のカバー写真</h2>
        <p className="mb-3 text-xs text-gray-500">
          ホーム・トーク・田んぼ・カレンダー・記録の一覧で、写真が未登録のときに使う既定の写真を差し替えられます。
        </p>
        <ImageSlotsEditor />
      </div>
    </AppShell>
  );
}
