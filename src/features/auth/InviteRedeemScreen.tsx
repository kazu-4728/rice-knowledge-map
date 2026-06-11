"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../lib/supabase/client";
import { useAuth } from "./useAuth";
import AccountSection from "./AccountSection";
import { IconCheck, IconUsers, IconWarningFill, LogoRice } from "../../components/ui/icons";

const PENDING_KEY = "rkm_pending_invite_token";

type RedeemState = "idle" | "need_login" | "redeeming" | "done" | "error" | "no_token";

/**
 * 招待URL（/invite#トークン）の引き換え画面。
 * 未ログインの場合はトークンを保持したままログインさせ、ログイン後に引き換える。
 */
export default function InviteRedeemScreen() {
  const { configured, loading, session } = useAuth();
  const [state, setState] = useState<RedeemState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (loading) return;

    // URLハッシュのトークンを保存（ログインリダイレクトで消えるため）
    const hashToken = window.location.hash.replace(/^#/, "");
    if (hashToken) {
      localStorage.setItem(PENDING_KEY, hashToken);
      // 画面リロードや共有時にトークンが残らないようにする
      history.replaceState(null, "", window.location.pathname);
    }
    const token = hashToken || localStorage.getItem(PENDING_KEY);

    if (!token) {
      setState("no_token");
      return;
    }
    if (!configured) {
      setState("error");
      setErrorMessage("アプリがSupabaseに接続されていません");
      return;
    }
    if (!session) {
      setState("need_login");
      return;
    }

    setState("redeeming");
    getSupabase()!
      .rpc("redeem_group_invite", { p_token: token })
      .then(({ error }) => {
        if (error) {
          setState("error");
          setErrorMessage("招待が無効か、有効期限が切れています");
        } else {
          localStorage.removeItem(PENDING_KEY);
          setState("done");
        }
      });
  }, [configured, loading, session]);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center bg-gray-100 px-4 pt-16">
      <LogoRice className="h-16 w-16" />
      <h1 className="mt-3 text-xl font-bold text-green-700">みらい稲作管理</h1>
      <p className="mt-1 text-sm text-gray-600">家族グループへの招待</p>

      <div className="mt-6 w-full space-y-3">
        {(state === "idle" || state === "redeeming") && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-gray-600">招待を確認しています…</p>
          </div>
        )}

        {state === "no_token" && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">招待トークンが見つかりません</p>
            <p className="mt-1 text-xs text-gray-500">
              家族から送られた招待URLをそのまま開いてください
            </p>
          </div>
        )}

        {state === "need_login" && (
          <>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <IconUsers className="mx-auto h-8 w-8 text-green-700" />
              <p className="mt-2 text-sm font-bold text-gray-900">
                ログインすると家族グループに参加できます
              </p>
            </div>
            <AccountSection redirectPath="/invite" />
          </>
        )}

        {state === "done" && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <IconCheck className="h-6 w-6 text-green-700" strokeWidth={2.4} />
            </span>
            <p className="mt-3 text-base font-bold text-gray-900">参加しました！</p>
            <p className="mt-1 text-xs text-gray-500">家族の田んぼと記録が見られるようになりました</p>
            <Link
              href="/map"
              className="mt-4 block w-full rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
            >
              マップを開く
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <IconWarningFill className="mx-auto h-8 w-8 text-amber-500" />
            <p className="mt-2 text-sm font-bold text-gray-900">参加できませんでした</p>
            <p className="mt-1 text-xs text-gray-500">{errorMessage}</p>
            <Link href="/" className="mt-4 block text-sm font-semibold text-green-700">
              ホームへ戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
