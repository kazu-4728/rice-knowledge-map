import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import AccountSection from "../../features/auth/AccountSection";
import InviteButton from "../../features/auth/InviteButton";
import {
  IconCalendar,
  IconChevronRight,
  IconFieldGrid,
  IconPinFill,
  IconSprout,
  IconUsers,
} from "../../components/ui/icons";

function ComingSoonBadge() {
  return (
    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
      準備中
    </span>
  );
}

export default function MenuPage() {
  return (
    <AppShell>
      <div className="space-y-3 px-3 pb-6 pt-3">
        <h1 className="px-1 text-2xl font-bold text-gray-900">メニュー</h1>

        {/* アカウント / ログイン */}
        <AccountSection redirectPath="/menu" />

        {/* 使い方 */}
        <Link
          href="/guide"
          className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 shadow-sm transition-colors hover:bg-green-100"
        >
          <IconSprout className="h-6 w-6 shrink-0 text-green-700" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-green-800">使い方ガイド</p>
            <p className="mt-0.5 text-xs text-green-700">アプリの機能と操作方法を確認できます</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-green-600" />
        </Link>

        {/* 家族・作業者 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconUsers className="h-6 w-6 text-green-700" />
              <h2 className="text-base font-bold text-gray-900">家族・作業者</h2>
            </div>
            <ComingSoonBadge />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            メンバー一覧は準備中です。招待URLを発行して家族をアプリに招待できます
          </p>
          <InviteButton />
        </section>

        {/* 固定ポイント管理 */}
        <Link
          href="/map"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconPinFill className="h-6 w-6 shrink-0 text-green-700" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">固定ポイント管理</p>
            <p className="mt-0.5 text-xs text-gray-500">入水口・出水口・異常箇所のピンをマップで登録・編集</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
        </Link>

        {/* 田んぼ一覧 */}
        <Link
          href="/fields"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconFieldGrid className="h-6 w-6 shrink-0 text-green-700" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">田んぼ一覧</p>
            <p className="mt-0.5 text-xs text-gray-500">登録した田んぼの一覧と記録を確認できます</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>

        {/* 記録エクスポート */}
        <Link
          href="/export"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconCalendar className="h-6 w-6 shrink-0 text-green-700" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">記録エクスポート</p>
            <p className="mt-0.5 text-xs text-gray-500">年次・田んぼ別の記録をPDFに出力できます</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>

        {/* サイト設定（オーナー向け — 実際のロール確認はsiteページ側で行う） */}
        <Link
          href="/menu/site"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-green-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">サイト設定</p>
            <p className="mt-0.5 text-xs text-gray-500">ヒーロー写真・テキストの編集（オーナーのみ）</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>
      </div>
    </AppShell>
  );
}
