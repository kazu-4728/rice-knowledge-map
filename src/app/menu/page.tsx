import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import AccountSection from "../../features/auth/AccountSection";
import InviteButton from "../../features/auth/InviteButton";
import { SUB_NAV_ITEMS } from "../../components/layout/navItems";
import {
  IconChevronRight,
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
    <AppShell backDynamic backLabel="戻る">
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="px-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-px w-6 bg-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Settings</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900">設定・管理</h1>
        </div>

        {/* アカウント / ログイン */}
        <AccountSection redirectPath="/menu" />

        {/* 家族・作業者 */}
        <section className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_-14px_rgba(16,40,28,0.18)]">
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

        {/* 記録・田んぼ・カレンダー等への二次導線（ナビ再設計に伴いここへ集約） */}
        <section className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_-14px_rgba(16,40,28,0.18)]">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">その他のメニュー</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {SUB_NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 px-2 py-3.5 text-xs font-bold text-gray-700 transition-colors active:bg-gray-100"
              >
                <Icon className="h-6 w-6 shrink-0 text-emerald-700" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* サイト設定 */}
        <Link
          href="/menu/site"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-14px_rgba(16,40,28,0.18)] transition-colors hover:bg-gray-50"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-green-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">サイト設定</p>
            <p className="mt-0.5 text-xs text-gray-500">
              ヒーロー写真・テキストの編集（オーナーのみ）
            </p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>
      </div>
    </AppShell>
  );
}
