"use client";

import { useEffect, useMemo, useState } from "react";
import { loadRecords, isUnresolvedIssue, type RecordsData } from "../../../lib/data/records";
import { loadImageSlots } from "../../../lib/data/siteContent";
import { resolveRecordCoverUrl } from "../../../lib/data/media";
import type { ImageSlots } from "../../../lib/supabase/types";
import type { RecordItem } from "../../../types";

export type RecordsFilterLabel = "すべて" | "写真" | "音声" | "作業" | "水管理";

function matchesFilter(record: RecordItem, filter: RecordsFilterLabel): boolean {
  switch (filter) {
    case "写真":
      return record.media === "photo";
    case "音声":
      return record.media === "audio";
    case "作業":
      return record.category === "作業";
    case "水管理":
      return record.category === "水管理";
    default:
      return true;
  }
}

export type RecordsListOptions = {
  pointFilter?: string | null;
  fieldFilter?: string | null;
  statusFilter?: string | null;
  filterChip: RecordsFilterLabel;
  query: string;
};

export type RecordsListGroup = { date: string; items: RecordItem[] };

export type RecordsList = {
  mode: RecordsData["mode"] | "loading";
  records: RecordItem[];
  groups: RecordsListGroup[];
  /** 実写があればそれを、写真記録で実写未登録ならカテゴリ別の既定実写を解決済みで返す */
  thumbUrls: Record<string, string>;
  categoryCounts: { cat: RecordItem["category"]; count: number }[];
};

/**
 * /records のデータ取得を1本化するフック。
 * フィルタリング・日付グルーピング・カテゴリ集計はuseMemoで行い、
 * レンダー毎の再計算（以前の実装の問題）を解消する。
 */
export function useRecordsList(opts: RecordsListOptions): RecordsList {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [mode, setMode] = useState<RecordsData["mode"] | "loading">("loading");
  const [rawThumbUrls, setRawThumbUrls] = useState<Record<string, string>>({});
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});

  useEffect(() => {
    // 未対応（status=open）導線では古い未対応が最新100件の外に出ることがあるため全件取得する
    // （ホームのバナーは全件をサーバ集計しており、件数と一覧を一致させる）
    loadRecords(opts.statusFilter === "open" ? { all: true } : undefined).then((data) => {
      setRecords(data.records);
      setMode(data.mode);
      setRawThumbUrls(data.thumbUrls);
    });
  }, [opts.statusFilter]);

  useEffect(() => {
    loadImageSlots().then(setImageSlots);
  }, []);

  // 写真記録で実写が未登録の場合はカテゴリ別の既定実写を補う
  const thumbUrls = useMemo(() => {
    const merged = { ...rawThumbUrls };
    for (const record of records) {
      if (record.media === "photo" && !merged[record.id]) {
        const fallback = resolveRecordCoverUrl(undefined, record.category, imageSlots);
        if (fallback) merged[record.id] = fallback;
      }
    }
    return merged;
  }, [rawThumbUrls, records, imageSlots]);

  const visibleRecords = useMemo(() => {
    return records.filter((record) => {
      if (opts.pointFilter && record.pointId !== opts.pointFilter) return false;
      if (opts.fieldFilter && record.fieldId !== opts.fieldFilter) return false;
      if (opts.statusFilter === "open" && !isUnresolvedIssue(record)) return false;
      if (!matchesFilter(record, opts.filterChip)) return false;
      const q = opts.query.trim();
      if (!q) return true;
      return record.title.includes(q) || record.fieldName.includes(q);
    });
  }, [records, opts.pointFilter, opts.fieldFilter, opts.statusFilter, opts.filterChip, opts.query]);

  const groups = useMemo(() => {
    // 日付ごとにグループ化（日付降順で並んでいる前提）。Mapの挿入順で表示順を維持する。
    const itemsByDate = new Map<string, RecordItem[]>();
    for (const record of visibleRecords) {
      const items = itemsByDate.get(record.date);
      if (items) items.push(record);
      else itemsByDate.set(record.date, [record]);
    }
    return [...itemsByDate].map(([date, items]) => ({ date, items }));
  }, [visibleRecords]);

  const categoryCounts = useMemo(() => {
    const order: RecordItem["category"][] = ["水管理", "作業", "異常", "音声"];
    return order
      .map((cat) => ({ cat, count: visibleRecords.filter((r) => r.category === cat).length }))
      .filter((c) => c.count > 0);
  }, [visibleRecords]);

  return { mode, records, groups, thumbUrls, categoryCounts };
}
