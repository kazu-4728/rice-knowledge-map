"use client";

import { useState } from "react";
import { getSupabase } from "../../lib/supabase/client";
import { ensureGroupId } from "../../lib/data/farm";
import { IconCheck, IconPlus } from "../../components/ui/icons";

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 家族を招待するURLを発行する（owner専用・有効期限7日・editor権限） */
export default function InviteButton() {
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    // 再発行時に前回の結果が残らないよう必ず初期化する
    setMessage(null);
    setInviteUrl(null);
    setCopied(false);

    const sb = getSupabase();
    if (!sb) {
      setMessage("デモモードでは招待URLを発行できません");
      return;
    }
    setBusy(true);
    try {
      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setMessage("ログインすると招待URLを発行できます");
        return;
      }

      const groupId = await ensureGroupId();
      if (!groupId) {
        setMessage("グループの取得に失敗しました");
        return;
      }

      // トークンは平文をURLにのみ載せ、DBにはsha256ハッシュだけ保存する
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await sb.from("farm_group_invites").insert({
        group_id: groupId,
        token_hash: tokenHash,
        role: "editor",
        expires_at: expiresAt,
        created_by: user.id,
      });
      if (error) {
        // RLS: owner以外は発行不可
        setMessage("招待URLを発行できませんでした（発行は管理者のみ）");
        return;
      }

      const url = `${window.location.origin}/invite#${token}`;
      setInviteUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleInvite}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
      >
        <IconPlus className="h-4.5 w-4.5" strokeWidth={2.2} />
        家族を招待（URLを発行）
      </button>

      {inviteUrl && (
        <div className="mt-2 rounded-xl bg-green-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-green-800">
            <IconCheck className="h-4 w-4" strokeWidth={2.4} />
            招待URLを発行しました（7日間有効・編集者権限）
            {copied && "・コピー済み"}
          </p>
          <p className="mt-1.5 break-all rounded-lg bg-white px-2 py-1.5 text-[11px] text-gray-700">
            {inviteUrl}
          </p>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-amber-700">{message}</p>}
    </div>
  );
}
