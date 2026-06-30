"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadRecords } from "../../lib/data/records";
import { loadFarmData } from "../../lib/data/farm";
import { getSupabase } from "../../lib/supabase/client";

import type { FieldPoint, RecordItem } from "../../types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { Badge } from "../../components/ui/badge";
import {
  IconChevronRight,
  IconFieldGrid,
  IconPin,
  IconWarningFill,
} from "../../components/ui/icons";

type AttentionField = {
  id: string;
  name: string;
  issueCount: number;
  needsCheckCount: number;
};

type Props = {
  visible: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

export default function MapSummarySheet({ visible, onExpandChange }: Props) {
  const [fieldCount, setFieldCount] = useState(0);
  const [attentionFields, setAttentionFields] = useState<AttentionField[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      sb.from("farm_group_members").select("group_id").limit(1).then(({ data: members }) => {
        if (!members || members.length === 0) return;
        sb.from("records")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "needs_check"])
          .or("record_type.eq.issue,ai_category.in.(caution,levee_damage,poor_drainage)")
          .then(({ count }) => setOpenIssueCount(count ?? 0));
      });
    }

    loadFarmData().then((data) => {
      const items = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
      }));
      setFieldCount(items.length);

      const fieldNameMap = new Map(items.map((f) => [f.id, f.name]));
      const attnMap = new Map<
        string,
        { issueCount: number; needsCheckCount: number }
      >();
      data.points.forEach((p: FieldPoint) => {
        if (p.status !== "issue" && p.status !== "needs_check") return;
        if (!p.fieldId) return;
        const entry = attnMap.get(p.fieldId) ?? {
          issueCount: 0,
          needsCheckCount: 0,
        };
        if (p.status === "issue") entry.issueCount++;
        else entry.needsCheckCount++;
        attnMap.set(p.fieldId, entry);
      });
      const attnFields: AttentionField[] = [];
      attnMap.forEach((counts, fid) => {
        attnFields.push({
          id: fid,
          name: fieldNameMap.get(fid) ?? "",
          ...counts,
        });
      });
      attnFields.sort(
        (a, b) =>
          b.issueCount + b.needsCheckCount - (a.issueCount + a.needsCheckCount)
      );
      setAttentionFields(attnFields);
      setLoaded(true);
    });

    loadRecords({ limit: 5 }).then((data) => {
      setRecentRecords(data.records);
      setThumbUrls(data.thumbUrls);
    });
  }, []);

  const toggleExpand = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      onExpandChange?.(next);
      return next;
    });
  }, [onExpandChange]);

  useEffect(() => {
    if (!visible) {
      setExpanded(false);
      onExpandChange?.(false);
    }
  }, [visible, onExpandChange]);

  if (!visible || !loaded) return null;

  const issueLabel =
    openIssueCount !== null && openIssueCount > 0
      ? `注意 ${openIssueCount}件`
      : null;

  return (
    <div
      ref={sheetRef}
      className={`absolute inset-x-0 bottom-0 z-10 pointer-events-none transition-transform duration-300 ease-out ${
        expanded ? "translate-y-0" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <div
          className={`flex flex-col rounded-t-2xl bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ${
            expanded ? "max-h-[60vh]" : "max-h-[4.5rem]"
          } overflow-hidden`}
        >
          {/* ピークヘッダー（常時表示） */}
          <button
            onClick={toggleExpand}
            className="flex w-full items-center gap-3 px-4 py-3"
          >
            <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-gray-300" />
          </button>
          <div
            onClick={toggleExpand}
            className="flex cursor-pointer items-center gap-3 px-4 pb-3 -mt-1"
          >
            <IconFieldGrid className="h-5 w-5 shrink-0 text-green-700" />
            <span className="text-sm font-bold text-gray-900">
              マイ田んぼ {fieldCount}枚
            </span>
            {issueLabel && (
              <Badge variant="warning" className="text-[11px]">
                {issueLabel}
              </Badge>
            )}
            <IconChevronRight
              className={`ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                expanded ? "-rotate-90" : "rotate-90"
              }`}
            />
          </div>

          {/* 展開コンテンツ */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {/* 要注意の田んぼ */}
            {attentionFields.length > 0 && (
              <section className="mb-3">
                <div className="flex items-center gap-1.5 pb-2">
                  <IconWarningFill className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-gray-700">
                    要注意の田んぼ
                  </h3>
                </div>
                <ul className="space-y-1">
                  {attentionFields.slice(0, 3).map((af) => (
                    <li key={af.id}>
                      <Link
                        href={`/fields/${encodeURIComponent(af.id)}`}
                        className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 transition-colors active:bg-amber-100"
                      >
                        <IconWarningFill className="h-4 w-4 shrink-0 text-amber-500" />
                        <span className="flex-1 truncate text-sm font-semibold text-gray-900">
                          {af.name || "名前のない田んぼ"}
                        </span>
                        <span className="text-xs text-amber-600">
                          {[
                            af.issueCount > 0
                              ? `異常${af.issueCount}`
                              : null,
                            af.needsCheckCount > 0
                              ? `要確認${af.needsCheckCount}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join("・")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 最近の記録 */}
            {recentRecords.length > 0 && (
              <section>
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-bold text-gray-700">
                    最近の記録
                  </h3>
                  <Link
                    href="/records"
                    className="flex items-center gap-0.5 text-xs font-semibold text-green-700"
                  >
                    すべて
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="space-y-1">
                  {recentRecords.map((record) => (
                    <li key={record.id}>
                      <Link
                        href={`/records/${record.id}`}
                        className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors active:bg-gray-50"
                      >
                        <RecordThumb
                          media={record.media}
                          variant={
                            record.category === "作業"
                              ? "grass"
                              : record.category === "異常"
                                ? "sprout"
                                : "water"
                          }
                          duration={record.audioDuration}
                          thumbUrl={thumbUrls[record.id]}
                          className="h-10 w-14 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {record.title}
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-gray-500">
                            <IconPin className="h-3 w-3" />
                            {record.fieldName}
                            <span className="text-gray-300">|</span>
                            {record.time}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* クイックリンク */}
            <div className="mt-3 flex gap-2">
              <Link
                href="/home"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors active:bg-gray-50"
              >
                状況を見る
              </Link>
              <Link
                href="/fields"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors active:bg-gray-50"
              >
                田んぼ一覧
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
