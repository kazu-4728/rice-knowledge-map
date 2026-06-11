"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";
import { IconCheck, IconUserFill } from "../../components/ui/icons";

// Googleログインは Supabase 側のプロバイダ設定（Google CloudのOAuthクライアント）が
// 必要なため、設定が済むまでボタンを出さない（壊れたボタンを見せない）
const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "1";

type Props = {
  /** ログイン後に戻すパス（例 "/invite"）。省略時はトップ */
  redirectPath?: string;
};

/** メニュー画面のアカウントカード。ログイン状態の表示とGoogle/メールログイン導線 */
export default function AccountSection({ redirectPath }: Props = {}) {
  const { configured, loading, session, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle(redirectPath);
    if (error) setMessage(`Googleログインに失敗: ${error}`);
    setBusy(false);
  };

  const handleEmail = async () => {
    if (!email.includes("@")) {
      setMessage("メールアドレスを入力してください");
      return;
    }
    setBusy(true);
    const { error } = await signInWithEmail(email, redirectPath);
    setMessage(error ? `送信に失敗: ${error}` : "ログイン用リンクをメールに送りました");
    setBusy(false);
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-gray-900">ログイン</p>
      <p className="mt-0.5 text-xs text-gray-500">
        ログインすると田んぼや記録が家族と共有されます
      </p>

      {GOOGLE_LOGIN_ENABLED && (
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
        >
          Googleでログイン
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレスでログイン"
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
        />
        <button
          onClick={handleEmail}
          disabled={busy}
          className="shrink-0 rounded-xl border border-green-700 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-50"
        >
          送信
        </button>
      </div>

      {message && <p className="mt-2 text-xs text-amber-700">{message}</p>}
    </section>
  );
}
