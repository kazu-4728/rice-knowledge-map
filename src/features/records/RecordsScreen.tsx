"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRecords } from "../../lib/data/records";
import { recentRecords } from "../../data/dummy";
import type { RecordItem } from "../../types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import {
  IconCamera,
  IconChevronRight,
  IconDrop,
  IconDropFill,
  IconMic,
  IconPin,
  IconPinFill,
  IconSearch,
  IconSprout,
  IconWarningFill,
} from "../../components/ui/icons";

const filterChips = [
  { label: "すべて", Icon: null },
  { label: "写真", Icon: IconCamera },
  { label: "音声", Icon: IconMic },
  { label: "作業", Icon: IconSprout },
  { label: "水管理", Icon: IconDrop },
] as const;

type FilterLabel = (typeof filterChips)[number]["label"];

function matchesFilter(record: RecordItem, filter: FilterLabel): boolean {
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

const categoryChip: Record<RecordItem["category"], string> = {
  水管理: "bg-blue-50 text-blue-600",
  作業: "bg-green-50 text-green-700",
  異常: "bg-orange-50 text-orange-600",
  音声: "bg-green-50 text-green-700",
};

function TitleIcon({ record }: { record: RecordItem }) {
  if (record.category === "異常") return <IconWarningFill className="h-4.5 w-4.5 shrink-0 text-amber-500" />;
  if (record.category === "作業") return <IconSprout className="h-4.5 w-4.5 shrink-0 text-green-600" />;
  if (record.media === "audio") return <IconMic className="h-4.5 w-4.5 shrink-0 text-green-700" />;
  return <IconDropFill className="h-4.5 w-4.5 shrink-0 text-sky-500" />;
}

const thumbVariant = (record: RecordItem) =>
  record.category === "作業" ? ("grass" as const) : record.category === "異常" ? ("sprout" as const) : ("water" as const);

export default function RecordsScreen() {
  const [records, setRecords] = useState<RecordItem[]>(recentRecords);
  const [filter, setFilter] = useState<FilterLabel>("すべて");
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadRecords().then((data) => setRecords(data.records));
  }, []);

  // フィルタチップ + キーワード（タイトル・圃場名の部分一致）で絞り込む
  const visibleRecords = records.filter((record) => {
    if (!matchesFilter(record, filter)) return false;
    const q = query.trim();
    if (!q) return true;
    return record.title.includes(q) || record.fieldName.includes(q);
  });

  // 日付ごとにグループ化（日付降順で並んでいる前提）
  const groups: { date: string; items: RecordItem[] }[] = [];
  for (const record of visibleRecords) {
    const group = groups.find((g) => g.date === record.date);
    if (group) group.items.push(record);
    else groups.push({ date: record.date, items: [record] });
  }

  return (
    <div className="px-3 pb-6 pt-3">
      {/* フィルターチップ */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
        {filterChips.map(({ label, Icon }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filter === label
                ? "bg-green-700 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* 検索バー */}
      <div className="mt-3">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <IconSearch className="h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードで検索（圃場名・作業内容など）"
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
        </label>
      </div>

      {/* 絞り込み結果が空のとき */}
      {groups.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">該当する記録がありません</p>
          <p className="mt-1 text-xs text-gray-500">条件を変えて試してください</p>
        </div>
      )}

      {/* 日付グループ */}
      {groups.map((group) => (
        <section key={group.date} className="mt-4">
          <h2 className="px-1 text-sm font-bold text-gray-800">{group.date}</h2>
          <div className="mt-2 space-y-2">
            {group.items.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="flex items-center gap-2.5 rounded-2xl bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50"
              >
                <span className="w-11 shrink-0 text-sm font-semibold text-gray-700">{record.time}</span>
                <RecordThumb
                  media={record.media}
                  variant={thumbVariant(record)}
                  duration={record.audioDuration}
                  className="h-16 w-20 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <TitleIcon record={record} />
                    <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <IconPin className="h-3.5 w-3.5" />
                    {record.fieldName}
                    {record.fieldArea && `（${record.fieldArea}）`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${categoryChip[record.category]}`}>
                    {record.category}
                  </span>
                  <span className="flex items-center text-gray-400">
                    <IconPinFill className="h-5 w-5 text-green-700" />
                    <IconChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
