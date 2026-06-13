"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import SiteContentEditor from "../../../features/menu/SiteContentEditor";
import { getMyRole, ensureGroupId } from "../../../lib/data/farm";

export default function SiteSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

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
        <p className="mb-4 text-xs text-gray-500">
          ホーム画面のヒーロースライドを編集できます。写真を差し替えたり文章を変更して家族に合わせたトップページを作れます。
        </p>
        <SiteContentEditor />
      </div>
    </AppShell>
  );
}
