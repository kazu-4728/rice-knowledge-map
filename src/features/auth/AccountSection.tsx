"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./useAuth";
import { loadMyDisplayName, updateMyDisplayName } from "../../lib/data/profile";
import { MemberAvatar } from "../../components/ui/avatar";
import { IconCheck, IconPencil, IconUserFill } from "../../components/ui/icons";

type Props = {
  /** ログイン後に戻すパス（例 "/invite"）。省略時はトップ */
  redirectPath?: string;
};

/** アカウントカード。ログイン状態の表示・表示名の変更・/login への誘導 */
export default function AccountSection({ redirectPath }: Props = {}) {
  const { configured, loading, session, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!session) return;
    loadMyDisplayName().then((name) => setDisplayName(name));
  }, [session]);

  const startEdit = () => {
    setDraft(displayName ?? "");
    setMessage(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const { error } = await updateMyDisplayName(draft);
    setSaving(false);
    if (error) {
      setMessage({ text: error, isError: true });
      return;
    }
    setDisplayName(draft.trim());
    setEditing(false);
    setMessage({ text: "表示名を変更しました", isError: false });
  };

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
          {/* タイムラインと同じアバター表示にして「家族にこう見える」を一致させる */}
          {displayName ? (
            <MemberAvatar name={displayName} className="h-10 w-10 text-base" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <IconUserFill className="h-5 w-5 text-green-700" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <span className="truncate">{displayName || "名前未設定"}</span>
              <IconCheck className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2.4} />
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

        {/* 表示名の変更。記録・記録タイムラインで「誰の投稿か」を示す名前 */}
        {editing ? (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                maxLength={20}
                placeholder="例: お父さん / 太郎"
                autoFocus
                className="h-10 min-w-0 flex-1 rounded-xl border border-gray-300 px-3 text-[16px] text-gray-900 focus:border-green-600 focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 shrink-0 rounded-xl bg-green-700 px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="h-10 shrink-0 rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-600"
              >
                やめる
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              「記録タイムライン」や記録で表示される名前です（20文字まで）
            </p>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2.5 text-sm font-semibold text-gray-700 transition-colors active:bg-gray-100"
          >
            <IconPencil className="h-4 w-4" />
            表示名を変更する
          </button>
        )}
        {message && (
          <p className={`mt-2 text-xs font-semibold ${message.isError ? "text-red-600" : "text-green-700"}`}>
            {message.text}
          </p>
        )}
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
