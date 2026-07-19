"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadTalkTimeline, type TalkMessage } from "../../../lib/data/talk";
import { loadFarmData } from "../../../lib/data/farm";

export type RecordsFieldChip = { id: string; name: string };

export type RecordsTimeline = {
  mode: "loading" | "live" | "demo" | "anon" | "error";
  messages: TalkMessage[];
  hasMore: boolean;
  fields: RecordsFieldChip[];
  loadingOlder: boolean;
  reload: (fieldId: string | null) => Promise<void>;
  loadOlder: () => Promise<void>;
  /**
   * 新着メッセージ到着時に最下部へスクロールすべきかのシグナル。
   * reload時=true（最新を見せる）、loadOlder時=false（見ていた位置を維持）。
   * 実際のscrollTop操作はコンポーネント側（DOM副作用）が担当する。
   */
  stickToBottomRef: React.RefObject<boolean>;
};

/**
 * /records（記録タイムライン）のデータ取得を1本化するフック。
 * スクロールDOM操作（listRef.scrollTop等）はコンポーネント側に残す責務分離を維持する。
 */
export function useRecordsTimeline(filterId: string | null): RecordsTimeline {
  const [mode, setMode] = useState<RecordsTimeline["mode"]>("loading");
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [fields, setFields] = useState<RecordsFieldChip[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const stickToBottomRef = useRef(true);
  // フィルタ切替の連打で古いレスポンスが後から届いて上書きするのを防ぐ（レース対策）
  const reloadTokenRef = useRef(0);

  const reload = useCallback(async (fieldId: string | null) => {
    const token = ++reloadTokenRef.current;
    const data = await loadTalkTimeline(fieldId ? { fieldId } : undefined);
    if (token !== reloadTokenRef.current) return;
    if (data.mode === "anon" || data.mode === "error") {
      setMode(data.mode);
      return;
    }
    setMode(data.mode);
    setMessages(data.messages);
    setHasMore(data.hasMore);
    stickToBottomRef.current = true;
  }, []);

  useEffect(() => {
    setMode("loading");
    reload(filterId);
  }, [filterId, reload]);

  useEffect(() => {
    loadFarmData().then((farm) => {
      if (farm.mode === "error") return;
      setFields(
        farm.fieldsGeoJSON.features.map((f) => ({
          id: String(f.id ?? f.properties?.id ?? ""),
          name: String(f.properties?.name ?? "名前のない田んぼ"),
        }))
      );
    });
  }, []);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    // reload と同じトークンを共有する。応答が届くまでの間に田んぼチップが切り替わった場合、
    // 古い絞り込みの結果が現在の絞り込みへ混入するのを防ぐ
    const token = ++reloadTokenRef.current;
    const data = await loadTalkTimeline({
      fieldId: filterId ?? undefined,
      before: messages[0].atISO,
    });
    if (token === reloadTokenRef.current && (data.mode === "live" || data.mode === "demo")) {
      stickToBottomRef.current = false;
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.key));
        return [...data.messages.filter((m) => !seen.has(m.key)), ...prev];
      });
      setHasMore(data.hasMore);
    }
    setLoadingOlder(false);
  }, [loadingOlder, messages, filterId]);

  return { mode, messages, hasMore, fields, loadingOlder, reload, loadOlder, stickToBottomRef };
}
