"use client";

import type { TalkMessage } from "../../lib/data/talk";
import { MemberAvatar } from "../ui/avatar";
import { RemotePhoto } from "../ui/RemotePhoto";
import { IconChat, IconWarningFill } from "../ui/icons";
import { cn } from "@/lib/utils";

/**
 * ランディングの TalkMockup（吹き出しUIの縮小版）の実データ化。
 * /talk の折りたたみヒーローで最近の会話の温度を可視化する。
 * coverImageUrl でグループ/田んぼの実写をカバーにし、白いチャットUIだけで終わらせない。
 */
export function TalkPreviewCard({
  latestMessages,
  todayCount,
  attentionFieldName,
  coverImageUrl,
  className,
}: {
  latestMessages: TalkMessage[];
  todayCount: number;
  attentionFieldName?: string | null;
  coverImageUrl?: string;
  className?: string;
}) {
  const preview = latestMessages.slice(0, 2);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-3", className)}>
      {coverImageUrl && (
        <>
          <RemotePhoto
            src={coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackVariant="water"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/60" />
        </>
      )}
      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              coverImageUrl ? "bg-white/20 text-white" : "bg-flow-green-soft text-flow-green"
            )}
          >
            <IconChat className="h-4 w-4" />
          </span>
          <p className={cn("text-sm font-bold", coverImageUrl ? "text-white" : "text-gray-900")}>
            最近のやり取り {todayCount}件
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
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs",
                    coverImageUrl ? "text-white/90" : "text-gray-600"
                  )}
                >
                  {m.text ?? m.title ?? ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
