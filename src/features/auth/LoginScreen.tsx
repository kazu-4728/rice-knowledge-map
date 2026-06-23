"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./useAuth";
import { IconCheck, LogoRice } from "../../components/ui/icons";

// Googleログインは Supabase 側のプロバイダ設定（Google CloudのOAuthクライアント）が
// 必要なため、設定が済むまでボタンを出さない（壊れたボタンを見せない）
const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "1";

/** アプリ内パス（"/"始まり・"//"等の外部URL形式は不可）のみ許可する */
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/map";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/map";
  return raw;
}

function LoginScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirect(searchParams.get("redirect"));
  const { configured, loading, session, signInWithGoogle, signInWithEmail } = useAuth();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(!GOOGLE_LOGIN_ENABLED);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // ログイン済みなら元の画面へ戻す
  useEffect(() => {
    if (!loading && session) router.replace(redirect);
  }, [loading, session, redirect, router]);

  const handleGoogle = async () => {
    setBusy(true);
    setMessage(null);
    const { error } = await signInWithGoogle(redirect === "/" ? undefined : redirect);
    if (error) {
      setMessage(`Googleログインに失敗しました: ${error}`);
      setBusy(false);
    }
    // 成功時はGoogleへ画面遷移するためここでは何もしない
  };

  const handleEmail = async () => {
    if (!email.includes("@")) {
      setMessage("メールアドレスを入力してください");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await signInWithEmail(email, redirect === "/" ? undefined : redirect);
    if (error) {
      setMessage(`送信に失敗しました: ${error}`);
    } else {
      setEmailSent(true);
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md md:max-w-lg flex-col items-center bg-gray-100 px-4 pt-14">
      <LogoRice className="h-16 w-16" />
      <h1 className="mt-3 text-xl font-bold text-green-700">みらい稲作管理</h1>
      <p className="mt-1 text-sm text-gray-600">家族で使う田んぼの記録アプリ</p>

      <div className="mt-8 w-full space-y-3">
        {!configured && !loading && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">デモモードで動作中です</p>
            <p className="mt-1 text-xs text-gray-500">
              この環境ではログインできません（サンプルデータを表示しています）
            </p>
          </div>
        )}

        {configured && !session && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-base font-bold text-gray-900">ログイン</p>
            <p className="mt-1 text-sm text-gray-600">
              ログインすると、田んぼや記録が保存され、家族と共有されます
            </p>

            {GOOGLE_LOGIN_ENABLED && (
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-4 text-base font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
              >
                Googleでログイン
              </button>
            )}

            {GOOGLE_LOGIN_ENABLED && !showEmail && (
              <button
                onClick={() => setShowEmail(true)}
                className="mt-3 w-full py-2 text-center text-sm font-semibold text-green-700"
              >
                Googleを使わない方はこちら（メールでログイン）
              </button>
            )}

            {showEmail && !emailSent && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-gray-900">メールでログイン</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3.5 text-base text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
                />
                <button
                  onClick={handleEmail}
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-green-700 bg-white py-3.5 text-base font-bold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                >
                  ログイン用リンクを送る
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  ホーム画面に追加したアプリをお使いの場合は、Googleログインがおすすめです
                  （メールのリンクはブラウザで開くため、アプリ側のログインにならないことがあります）
                </p>
              </div>
            )}

            {emailSent && (
              <div className="mt-4 rounded-xl bg-green-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-green-800">
                  <IconCheck className="h-4.5 w-4.5" strokeWidth={2.4} />
                  ログイン用リンクをメールに送りました
                </p>
                <p className="mt-1 text-xs text-green-800">
                  {email} に届いたリンクをタップしてください
                </p>
              </div>
            )}

            {message && <p className="mt-3 text-sm text-amber-700">{message}</p>}
          </div>
        )}

        {configured && session && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">ログイン済みです</p>
            <p className="mt-1 truncate text-xs text-gray-500">{session.user.email}</p>
          </div>
        )}

        <Link href="/" className="block py-2 text-center text-sm font-semibold text-gray-500">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}

/** ログイン専用画面（/login）。?redirect= でログイン後の戻り先を指定できる */
export default function LoginScreen() {
  return (
    <Suspense fallback={null}>
      <LoginScreenInner />
    </Suspense>
  );
}
