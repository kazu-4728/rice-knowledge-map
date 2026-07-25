"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import InviteButton from "../auth/InviteButton";
import { MemberAvatar } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  loadGroupMembers,
  updateMemberRole,
  type GroupMembersData,
  type MemberRole,
} from "../../lib/data/members";
import { IconUsers } from "../../components/ui/icons";

const ROLE_ORDER: MemberRole[] = ["owner", "editor", "viewer"];

const ROLE_BADGE: Record<MemberRole, string> = {
  owner: "bg-green-100 text-green-800",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

/**
 * 家族・権限管理（メンバー一覧・権限の確認と変更・招待の発行）。
 * farm_group_members のRLSは以前から owner のみ更新可だったが、操作する画面が無かった。
 */
export default function FamilyMembersScreen() {
  const [data, setData] = useState<GroupMembersData | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const reload = useCallback(async () => {
    const result = await loadGroupMembers();
    setData(result);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGroupMembers().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
  }, []);

  if (!data) {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (data.mode === "anon") {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-900">ログインしていません</p>
          <p className="mt-0.5 text-xs text-gray-500">ログインすると家族・作業者の一覧と権限を確認できます</p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/menu/family")}`}
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-green-700 py-3.5 text-base font-bold text-white transition-colors hover:bg-green-800"
          >
            ログインする
          </Link>
        </section>
      </div>
    );
  }

  if (data.mode === "demo") {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-900">デモモード</p>
          <p className="mt-0.5 text-xs text-gray-500">Supabase未設定のため、家族・権限の管理は利用できません</p>
        </section>
      </div>
    );
  }

  if (data.mode === "error") {
    return (
      <div className="space-y-3 px-3 pb-6 pt-3">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            メンバー情報を読み込めませんでした。通信環境を確認してもう一度開いてください
          </p>
        </section>
      </div>
    );
  }

  const isOwner = data.myRole === "owner";
  const ownerCount = data.members.filter((m) => m.role === "owner").length;

  const handleRoleChange = async (userId: string, nextRole: MemberRole) => {
    if (!data.groupId || busyUserId) return;
    setMessage(null);
    setBusyUserId(userId);
    const result = await updateMemberRole(data.groupId, userId, nextRole);
    if (result.status === "saved") {
      await reload();
      setMessage({ text: `権限を「${ROLE_LABELS[nextRole]}」に変更しました`, isError: false });
    } else if (result.status === "last_owner") {
      setMessage({
        text: "管理者が1人だけのため、この人の権限は変更できません。先に別の家族を管理者にしてください",
        isError: true,
      });
    } else if (result.status === "denied") {
      setMessage({ text: "権限を変更できませんでした（変更できるのは管理者だけです）", isError: true });
    } else if (result.status === "demo") {
      setMessage({ text: "デモモードでは変更できません", isError: true });
    } else {
      setMessage({ text: `権限の変更に失敗しました: ${result.message}`, isError: true });
    }
    setBusyUserId(null);
  };

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <IconUsers className="h-6 w-6 text-green-700" />
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-gray-900">家族・作業者</h1>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {data.groupName || "わが家の田んぼ"}・{data.members.length}人
            </p>
          </div>
        </div>
        {data.members.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            まだグループがありません。記録や田んぼを保存すると自動で作られ、ここに表示されます
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {data.members.map((m) => {
              // 制約3: 最後の管理者を降格するとグループの誰も権限変更・招待ができなくなるため、UIで止める
              const isLastOwner = m.role === "owner" && ownerCount <= 1;
              return (
                <li key={m.userId} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <MemberAvatar name={m.isMe ? "あなた" : m.displayName} className="h-9 w-9 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {m.displayName}
                        {m.isMe && <span className="ml-1 text-xs font-semibold text-gray-500">（あなた）</span>}
                      </p>
                      {m.joinedAt && <p className="mt-0.5 text-xs text-gray-400">{m.joinedAt}から</p>}
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${ROLE_BADGE[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  </div>

                  {isOwner && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
                      {ROLE_ORDER.map((r) => {
                        const active = m.role === r;
                        const blocked = isLastOwner && r !== "owner";
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRoleChange(m.userId, r)}
                            disabled={active || blocked || busyUserId !== null}
                            aria-pressed={active}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                              active
                                ? "bg-green-700 text-white"
                                : blocked
                                  ? "border border-gray-100 bg-white text-gray-300"
                                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            }`}
                          >
                            {busyUserId === m.userId && !active ? "変更中…" : ROLE_LABELS[r]}
                          </button>
                        );
                      })}
                      {isLastOwner && (
                        <p className="w-full text-xs text-gray-500">
                          管理者が1人だけのため変更できません（先に別の家族を管理者にしてください）
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {message && (
          <p className={`mt-3 text-xs font-semibold ${message.isError ? "text-red-600" : "text-green-700"}`}>
            {message.text}
          </p>
        )}
        {!isOwner && data.members.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">権限の変更と招待の発行ができるのは管理者だけです</p>
        )}
      </section>

      {/* 権限の説明（変更する前に何が変わるか分かるようにする） */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">権限でできること</h2>
        <ul className="mt-2 space-y-1.5">
          {ROLE_ORDER.map((r) => (
            <li key={r} className="flex gap-2 text-xs text-gray-600">
              <span className={`h-fit shrink-0 rounded-md px-2 py-0.5 font-bold ${ROLE_BADGE[r]}`}>
                {ROLE_LABELS[r]}
              </span>
              <span className="min-w-0 flex-1">{ROLE_DESCRIPTIONS[r]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 招待（発行は管理者のみ。RLSでも owner に限定されている） */}
      {isOwner && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">家族を招待する</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            発行したURLをLINEなどで送ると、受け取った人がこのグループに参加できます
          </p>
          <InviteButton />
        </section>
      )}
    </div>
  );
}
