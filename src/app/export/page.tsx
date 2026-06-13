"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import { loadRecords } from "../../lib/data/records";
import { loadFarmData } from "../../lib/data/farm";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { RecordItem } from "../../types";
import { IconChevronRight } from "../../components/ui/icons";

type FieldOption = { id: string; name: string };

export default function ExportPage() {
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [printing, setPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([loadFarmData(), loadRecords()]).then(([farm, rec]) => {
      setFields(farm.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
      })));
      setRecords(rec.records);
      setThumbUrls(rec.thumbUrls);
    });
  }, []);

  const filtered = records.filter((r) => {
    const matchField = selectedFieldId === "all" || r.fieldId === selectedFieldId;
    const matchYear = r.date?.startsWith(String(year));
    return matchField && matchYear;
  });

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const grouped: Record<string, RecordItem[]> = {};
  filtered.forEach((r) => {
    const month = r.date?.slice(0, 7) ?? "不明";
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(r);
  });

  const fieldName = selectedFieldId === "all"
    ? "全田んぼ"
    : fields.find((f) => f.id === selectedFieldId)?.name ?? "不明";

  return (
    <AppShell backDynamic backLabel="戻る">
      <div className="space-y-4 px-3 pb-8 pt-3 print:hidden">
        <h1 className="text-xl font-bold text-gray-900">記録エクスポート</h1>

        <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">田んぼ</label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
            >
              <option value="all">全て</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">年</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
            >
              {[0,1,2,3].map((i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}年</option>;
              })}
            </select>
          </div>
          <p className="text-xs text-gray-500">{filtered.length}件の記録</p>
          <button
            onClick={handlePrint}
            disabled={filtered.length === 0 || printing}
            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white disabled:bg-gray-300 active:scale-95 transition-transform"
          >
            {printing ? "準備中…" : "PDFとして印刷・保存"}
          </button>
        </div>

        {/* プレビュー */}
        {filtered.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-900 mb-3">プレビュー</p>
            {Object.entries(grouped).sort().map(([month, items]) => (
              <div key={month} className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
                  {month.replace("-", "年")}月
                </p>
                <ul className="space-y-2">
                  {items.map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <RecordThumb
                        media={r.media}
                        variant={r.category === "作業" ? "grass" : r.category === "異常" ? "sprout" : "water"}
                        thumbUrl={thumbUrls[r.id]}
                        className="h-10 w-14 shrink-0 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.date} {r.time} · {r.fieldName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 印刷用レイアウト（print: クラスで表示） */}
      <div className="hidden print:block p-8" ref={reportRef}>
        <h1 className="text-2xl font-bold mb-1">{fieldName} 作業記録</h1>
        <p className="text-sm text-gray-500 mb-6">{year}年 · {filtered.length}件</p>
        {Object.entries(grouped).sort().map(([month, items]) => (
          <div key={month} className="mb-6 break-inside-avoid">
            <h2 className="text-base font-bold border-b pb-1 mb-3">
              {month.replace("-", "年")}月
            </h2>
            {items.map((r) => (
              <div key={r.id} className="flex gap-3 mb-3">
                <div className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">
                  {r.date}<br />{r.time}
                </div>
                <div>
                  <p className="text-sm font-bold">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.fieldName} · {r.category}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
