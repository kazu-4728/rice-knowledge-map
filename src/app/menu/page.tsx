import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import AccountSection from "../../features/auth/AccountSection";
import InviteButton from "../../features/auth/InviteButton";
import { members, pointStats } from "../../data/dummy";
import {
  IconBell,
  IconChevronRight,
  IconCloudCheck,
  IconDocDown,
  IconDropFill,
  IconFieldGrid,
  IconGear,
  IconPinFill,
  IconUserFill,
  IconUsers,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

const roleChip: Record<string, string> = {
  管理者: "bg-green-100 text-green-800",
  編集者: "bg-blue-100 text-blue-700",
  閲覧者: "bg-gray-100 text-gray-600",
};

const settingsItems = [
  { Icon: IconBell, label: "通知設定" },
  { Icon: IconDocDown, label: "データ出力" },
  { Icon: IconGear, label: "アプリ設定" },
];

export default function MenuPage() {
  return (
    <AppShell>
      <div className="space-y-3 px-3 pb-6 pt-3">
        <h1 className="px-1 text-2xl font-bold text-gray-900">メニュー</h1>

        {/* アカウント / ログイン */}
        <AccountSection />

        {/* 同期ステータス */}
        <button className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50">
          <IconCloudCheck className="h-9 w-9 shrink-0 text-sky-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">同期ステータス</p>
            <p className="mt-0.5 text-xs text-gray-600">すべてのデータは最新です</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">最終バックアップ</p>
            <p className="mt-0.5 text-xs font-semibold text-gray-700">2025年5月24日 08:30</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
        </button>

        {/* 家族・作業者 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconUsers className="h-6 w-6 text-green-700" />
              <h2 className="text-base font-bold text-gray-900">家族・作業者</h2>
            </div>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              {members.length}人
              <IconChevronRight className="h-4 w-4 text-gray-400" />
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {members.map((member) => (
              <li key={member.name}>
                <button className="flex w-full items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <IconUserFill className="h-5 w-5 text-green-700" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                    {member.name}
                  </span>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${roleChip[member.role]}`}>
                    {member.role}
                  </span>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
          <InviteButton />
        </section>

        {/* 固定ポイント管理 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <button className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <IconPinFill className="h-6 w-6 text-green-700" />
              <h2 className="text-base font-bold text-gray-900">固定ポイント管理</h2>
            </div>
            <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
          </button>
          <div className="mt-3 grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 py-3">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600">入水口</span>
              <span className="flex items-center gap-1.5">
                <IconDropFill className="h-6 w-6 text-sky-500" />
                <span className="text-2xl font-bold text-gray-900">{pointStats.inlet}</span>
                <span className="self-end pb-1 text-xs text-gray-500">件</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600">出水口</span>
              <span className="flex items-center gap-1.5">
                <IconWaves className="h-6 w-6 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{pointStats.outlet}</span>
                <span className="self-end pb-1 text-xs text-gray-500">件</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600">注意箇所</span>
              <span className="flex items-center gap-1.5">
                <IconWarningFill className="h-6 w-6 text-amber-500" />
                <span className="text-2xl font-bold text-gray-900">{pointStats.caution}</span>
                <span className="self-end pb-1 text-xs text-gray-500">件</span>
              </span>
            </div>
          </div>
        </section>

        {/* 田んぼ一覧 */}
        <Link
          href="/fields"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconFieldGrid className="h-6 w-6 shrink-0 text-green-700" />
          <span className="flex-1 text-base font-bold text-gray-900">田んぼ一覧</span>
          <span className="text-sm text-gray-500">4枚</span>
          <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
        </Link>

        {/* 設定 */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {settingsItems.map(({ Icon, label }, i) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                i > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <Icon className="h-6 w-6 shrink-0 text-green-700" />
              <span className="flex-1 text-base font-semibold text-gray-900">{label}</span>
              <IconChevronRight className="h-4.5 w-4.5 text-gray-400" />
            </button>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
