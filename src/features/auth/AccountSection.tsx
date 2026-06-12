"use client";

import Link from "next/link";
import { useAuth } from "./useAuth";
import { IconCheck, IconUserFill } from "../../components/ui/icons";

type Props = {
  /** ログイン後に戻すパス（例 "/invite"）。省略時はトップ */
  redirectPath?: string;
};

/** アカウントカード。ログイン状態の表示と /login への誘導 */
export default function AccountSection({ redirectPath }: Props = {}) {
  const { configured, loading, session, signOut } = useAuth();

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">アカウント情報を読み込み中…</p>
      </section>
    );
  }

  if (!configured) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <IconUserFill className="h-6 w-6 text-gray-400" />
          <div>
            <p className="text-sm font-bold text-gray-900">デモモード</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Supabase未設定のためサンプルデータを表示しています
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (session) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
            <IconUserFill className="h-5 w-5 text-green-700" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              ログイン中
              <IconCheck className="h-4 w-4 text-green-600" strokeWidth={2.4} />
            </p>
            <p className="truncate text-xs text-gray-500">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>
      </section>
    );
  }

  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-gray-900">ログインしていません</p>
      <p className="mt-0.5 text-xs text-gray-500">
        ログインすると田んぼや記録が保存され、家族と共有されます
      </p>
      <Link
        href={loginHref}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-green-700 py-3.5 text-base font-bold text-white transition-colors hover:bg-green-800"
      >
        ログインする
      </Link>
    </section>
  );
}
