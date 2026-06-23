"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../../lib/supabase/client";

type AuthState = {
  /** Supabase環境変数が設定されているか（falseならデモモード） */
  configured: boolean;
  /** セッション読込中 */
  loading: boolean;
  session: Session | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    configured: false,
    loading: true,
    session: null,
  });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setState({ configured: false, loading: false, session: null });
      return;
    }

    sb.auth.getSession().then(({ data }) => {
      setState({ configured: true, loading: false, session: data.session });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setState({ configured: true, loading: false, session });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /** redirectPath: ログイン後に戻すパス（例 "/invite"）。省略時はトップ */
  const signInWithGoogle = async (redirectPath?: string) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase未設定です" };
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectPath ?? ""}` },
    });
    return { error: error?.message ?? null };
  };

  const signInWithEmail = async (email: string, redirectPath?: string) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase未設定です" };
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${redirectPath ?? ""}` },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await getSupabase()?.auth.signOut();
    window.location.href = "/login";
  };

  return { ...state, signInWithGoogle, signInWithEmail, signOut };
}
