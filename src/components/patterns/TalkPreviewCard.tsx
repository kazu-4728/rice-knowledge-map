"use client";

import type { TalkMessage } from "../../lib/data/talk";
import { MemberAvatar } from "../ui/avatar";
import { IconChat, IconWarningFill } from "../ui/icons";
import { cn } from "@/lib/utils";

/**
 * ランディングの TalkMockup（吹き出しUIの縮小版）の実データ化。
 * /talk の折りたたみヒーローで「今日の会話の温度」を可視化する。
 */
export function TalkPreviewCard({
  latestMessages,
  todayCount,
  attentionFieldName,
  className,
}: {
  latestMessages: TalkMessage[];
  todayCount: number;
  attentionFieldName?: string | null;
  className?: string;
}) {
  const preview = latestMessages.slice(0, 2);

  return (
    <div className={cn("rounded-2xl bg-white/70 p-3", className)}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <IconChat className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold text-gray-900">
          今日は{todayCount}件のやり取り
        </p>
        {attentionFieldName && (
          <span className="ml-auto flex animate-float-y items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <IconWarningFill className="h-3 w-3" />
            {attentionFieldName}
          </span>
        )}
      </div>
      {preview.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {preview.map((m) => (
            <li key={m.key} className="flex items-center gap-2">
              <MemberAvatar name={m.author} className="h-6 w-6 shrink-0 text-[10px]" />
              <p className="min-w-0 flex-1 truncate text-xs text-gray-600">
                {m.text ?? m.title ?? ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
