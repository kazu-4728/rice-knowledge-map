"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRecords } from "../../lib/data/records";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconMap,
  IconMic,
  IconPin,
} from "../../components/ui/icons";

export default function HomeScreen() {
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRecords().then((data) => {
      setRecentRecords(data.records.slice(0, 4));
      setThumbUrls(data.thumbUrls);
    });
  }, []);

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      {/* 記録導線（主役） */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-base font-bold text-gray-900">きょうの様子を記録しましょう</p>
        <div className="mt-3 flex gap-3">
          <Link
            href="/records/new"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            <IconCamera className="h-5 w-5" />
            写真で記録
          </Link>
          <Link
            href="/records/new?type=audio"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
          >
            <IconMic className="h-5 w-5" />
            音声メモ
          </Link>
        </div>
        <Link
          href="/map"
          className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-bold text-green-800 transition-colors hover:bg-green-100"
        >
          <IconMap className="h-5 w-5" />
          マップを開く
        </Link>
      </section>

      {/* 最近の記録 */}
      {recentRecords.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">最近の記録</h2>
            <Link href="/records" className="flex items-center text-sm font-semibold text-green-700">
              すべて見る
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-2">
            {recentRecords.map((record, i) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <RecordThumb
                    media={record.media}
                    variant={record.category === "作業" ? "grass" : "water"}
                    duration={record.audioDuration}
                    thumbUrl={thumbUrls[record.id]}
                    className="h-14 w-[4.5rem] shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <IconPin className="h-3.5 w-3.5" />
                      {record.fieldName}
                      {record.fieldArea ? `（${record.fieldArea}）・` : "・"}
                      {record.time}
                    </p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
