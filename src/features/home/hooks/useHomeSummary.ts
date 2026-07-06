"use client";

import { useEffect, useState } from "react";
import { loadFieldAttention, type FieldAttentionSummary } from "../../../lib/data/fieldAttention";
import { loadRecords, type RecordsData } from "../../../lib/data/records";
import { loadImageSlots } from "../../../lib/data/siteContent";
import { resolveHomeHeroUrl } from "../../../lib/data/media";
import type { RecordItem } from "../../../types";

export type HomeSummary = {
  attention: FieldAttentionSummary | null;
  recentRecords: RecordItem[];
  thumbUrls: Record<string, string>;
  recordsMode: RecordsData["mode"] | "loading";
  loaded: boolean;
  loadError: boolean;
  isAnon: boolean;
  heroImageUrl: string;
};

/** /home のデータ取得を1本化するフック。集計・整形のみを担当し、DOM/UI状態は持たない */
export function useHomeSummary(): HomeSummary {
  const [attention, setAttention] = useState<FieldAttentionSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [recordsMode, setRecordsMode] = useState<RecordsData["mode"] | "loading">("loading");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isAnon, setIsAnon] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(() => resolveHomeHeroUrl({}));

  useEffect(() => {
    loadFieldAttention()
      .then((summary) => {
        setAttention(summary);
        if (summary.mode === "anon") setIsAnon(true);
        if (summary.mode === "error") setLoadError(true);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });

    loadRecords().then((data) => {
      setRecordsMode(data.mode);
      setRecentRecords(data.records.slice(0, 8));
      setThumbUrls(data.thumbUrls);
    });

    loadImageSlots().then((slots) => setHeroImageUrl(resolveHomeHeroUrl(slots)));
  }, []);

  return { attention, recentRecords, thumbUrls, recordsMode, loaded, loadError, isAnon, heroImageUrl };
}
