"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "../../components/ui/drawer";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { useToast } from "../../components/ui/Toast";
import { loadFieldAttention, type FieldAttentionSummary } from "../../lib/data/fieldAttention";
import { shareFieldStory } from "../../lib/utils/share";
import { IconChevronRight, IconClose, IconShare } from "../../components/ui/icons";

type FieldRow = {
  id: string;
  name: string;
  status: "normal" | "needs_check" | "issue";
  hasAttention: boolean;
};

function toRows(summary: FieldAttentionSummary): FieldRow[] {
  const attentionById = new Map(summary.attentionFields.map((f) => [f.id, f]));
  return summary.fields.map((f) => {
    const a = attentionById.get(f.id);
    const status = a && a.issueCount > 0 ? "issue" : a && a.needsCheckCount > 0 ? "needs_check" : "normal";
    return { id: f.id, name: f.name || "名前のない田んぼ", status, hasAttention: !!a };
  });
}

/**
 * ホームのLINE共有バナーから開く田んぼ選択シート（Issue #72）。
 * 選んだ田んぼを、各場所の記録と同じ共有導線（shareFieldStory・PR #71）で
 * OSの共有シートへ渡す。データはシートを開いたときに遅延取得する。
 */
export function HomeShareSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<FieldAttentionSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || summary) return;
    let cancelled = false;
    setFailed(false);
    loadFieldAttention()
      .then((s) => {
        if (cancelled) return;
        if (s.mode === "error") setFailed(true);
        else setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, summary]);

  const handleShare = async (row: FieldRow) => {
    const url = `${window.location.origin}/fields/${encodeURIComponent(row.id)}`;
    const statusLabel = row.hasAttention ? "気になるところがあります" : "順調に育っています";
    const result = await shareFieldStory({ fieldName: row.name, statusLabel, url });
    if (result === "copied") showToast("リンクをコピーしました。LINEなどに貼り付けて共有できます");
    else if (result === "failed") showToast("共有に失敗しました", "error");
    if (result === "shared" || result === "copied") onClose();
  };

  const rows = summary && summary.mode !== "anon" ? toRows(summary) : [];

  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next) onClose(); }} direction="bottom" shouldScaleBackground={false}>
      <DrawerContent
        direction="bottom"
        className="max-h-[75dvh] rounded-t-3xl bg-white p-0 shadow-2xl"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <DrawerTitle className="text-base font-bold text-gray-900">どの田んぼを共有しますか?</DrawerTitle>
          <DrawerClose
            aria-label="閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IconClose className="h-5 w-5" />
          </DrawerClose>
        </div>
        <p className="px-5 pb-3 text-xs text-gray-500">
          LINEなど、アプリの外にいる人へ送ります（仲間にはすでに「記録タイムライン」で見えています）
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {failed && (
            <p className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-500">
              田んぼを読み込めませんでした。通信環境を確認してください
            </p>
          )}

          {!failed && !summary && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {summary?.mode === "anon" && (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-sm font-bold text-gray-900">ログインすると田んぼを共有できます</p>
              <Link
                href="/login?redirect=%2F"
                className="mt-3 inline-block rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white"
              >
                ログイン
              </Link>
            </div>
          )}

          {summary && summary.mode !== "anon" && rows.length === 0 && (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-sm font-bold text-gray-900">まだ田んぼが登録されていません</p>
              <p className="mt-1 text-xs text-gray-500">マップで田んぼを登録すると、ここから共有できます</p>
              <Link
                href="/map?register=1"
                className="mt-3 inline-flex items-center gap-1 rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white"
              >
                田んぼを登録する
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => handleShare(row)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3.5 text-left transition-colors active:bg-gray-100"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">{row.name}</span>
                  <StatusBadge status={row.status} label={row.hasAttention ? undefined : "順調"} />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
                    <IconShare className="h-4.5 w-4.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
