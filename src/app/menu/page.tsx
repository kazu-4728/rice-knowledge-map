import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import AccountSection from "../../features/auth/AccountSection";
import InviteButton from "../../features/auth/InviteButton";
import {
  IconChevronRight,
  IconFieldGrid,
  IconPinFill,
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
        <AccountSection />

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
            メンバー一覧は準備中です。招待は下のボタンから今すぐ使えます
          </p>
          <InviteButton />
        </section>

        {/* 固定ポイント管理 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconPinFill className="h-6 w-6 text-green-700" />
              <h2 className="text-base font-bold text-gray-900">固定ポイント管理</h2>
            </div>
            <ComingSoonBadge />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            入水口・出水口・異常箇所のピン登録は今後のアップデートで使えるようになります
          </p>
        </section>

        {/* 田んぼ一覧 */}
        <Link
          href="/fields"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconFieldGrid className="h-6 w-6 shrink-0 text-green-700" />
          <span className="flex-1 text-base font-bold text-gray-900">田んぼ一覧</span>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>
      </div>
    </AppShell>
  );
}
