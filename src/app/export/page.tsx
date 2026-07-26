"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import { loadFarmData } from "../../lib/data/farm";
import { loadImageSlots } from "../../lib/data/siteContent";
import { resolveRecordCoverUrl } from "../../lib/data/media";
import { loadExportRecords, type ExportRecord, type ExportRecordsData } from "../../lib/data/exportData";
import { buildRecordsCsv } from "../../lib/utils/exportCsv";
import { downloadBlob } from "../../lib/utils/download";
import type { ImageSlots } from "../../lib/supabase/types";

type FieldOption = { id: string; name: string };

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return {
    date: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${youbi}）`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export default function ExportPage() {
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [data, setData] = useState<ExportRecordsData | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [printing, setPrinting] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});

  useEffect(() => {
    loadImageSlots().then(setImageSlots);
    loadFarmData().then((farm) => {
      setFields(farm.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
      })));
    });
  }, []);

  // 年・田んぼの絞り込みが変わるたびにサーバー側で絞り込んで取得し直す
  // （記録に紐づく全写真の署名URLを発行するため、一覧全件を毎回取得すると重い）
  useEffect(() => {
    setData(null);
    setMessage(null);
    loadExportRecords({ year, fieldId: selectedFieldId === "all" ? undefined : selectedFieldId }).then(setData);
  }, [year, selectedFieldId]);

  const records = data?.records ?? [];

  const grouped: Record<string, ExportRecord[]> = {};
  records.forEach((r) => {
    const d = new Date(r.recordedAtISO);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(r);
  });
  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    return y && m ? `${y}年${Number(m)}月` : ym;
  };

  const fieldName = selectedFieldId === "all"
    ? "全田んぼ"
    : fields.find((f) => f.id === selectedFieldId)?.name ?? "不明";

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const handleCsv = () => {
    const csv = buildRecordsCsv(records);
    // Excelでの文字化けを防ぐためUTF-8 BOMを付与する
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `記録_${fieldName}_${year}.csv`);
  };

  const handleZip = async () => {
    if (zipping) return;
    setMessage(null);
    setZipping(true);
    setZipProgress({ done: 0, total: records.reduce((n, r) => n + r.photos.length, 0) });
    try {
      // jszip/piexifjsはZIP作成時にしか使わないため動的importにする
      const { buildRecordsZip } = await import("../../lib/utils/exportZip");
      const result = await buildRecordsZip(records, (done, total) => setZipProgress({ done, total }));
      downloadBlob(result.blob, `記録_${fieldName}_${year}.zip`);
      if (result.failedCount > 0) {
        setMessage(`${result.failedCount}枚の写真を取得できずZIPから除外しました（他は正常に出力されています）`);
      }
    } catch (err) {
      console.warn("[export] zip build failed", err);
      setMessage("ZIPの作成に失敗しました。通信環境を確認してもう一度お試しください");
    } finally {
      setZipping(false);
      setZipProgress(null);
    }
  };

  return (
    <AppShell>
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
          <p className="text-xs text-gray-500">
            {data === null ? "読み込み中…" : `${records.length}件の記録`}
          </p>

          {data?.mode === "anon" && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">ログインするとエクスポートできます</p>
          )}
          {data?.mode === "demo" && (
            <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
              Supabase未設定のためエクスポートは利用できません
            </p>
          )}
          {data?.mode === "error" && (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
              読み込みに失敗しました。通信環境を確認してもう一度開いてください
            </p>
          )}

          <button
            onClick={handlePrint}
            disabled={records.length === 0 || printing}
            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white disabled:bg-gray-300 active:scale-95 transition-transform"
          >
            {printing ? "準備中…" : "PDFとして印刷・保存"}
          </button>
          <p className="text-center text-[11px] text-gray-400">写真＋日時・田んぼ・状況を1件ずつまとめたレイアウトで印刷します</p>

          <div className="flex gap-2">
            <button
              onClick={handleCsv}
              disabled={records.length === 0}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 disabled:opacity-50 active:scale-95 transition-transform"
            >
              CSVダウンロード
            </button>
            <button
              onClick={handleZip}
              disabled={records.length === 0 || zipping}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {zipping
                ? zipProgress && zipProgress.total > 0
                  ? `作成中… ${zipProgress.done}/${zipProgress.total}`
                  : "作成中…"
                : "ZIPダウンロード"}
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400">
            CSV: 構造化データのみ（画像なし）・ZIP: 写真＋位置情報等をEXIFに書き戻した画像＋JSONメタデータ
          </p>

          {message && <p className="text-xs text-amber-700">{message}</p>}
        </div>

        {/* プレビュー */}
        {records.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-900 mb-3">プレビュー</p>
            {Object.entries(grouped).sort().map(([month, items]) => (
              <div key={month} className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
                  {formatMonth(month)}
                </p>
                <ul className="space-y-2">
                  {items.map((r) => {
                    const { date, time } = formatDateTime(r.recordedAtISO);
                    const coverUrl = r.photos[0]?.url ?? resolveRecordCoverUrl(undefined, r.category, imageSlots);
                    return (
                      <li key={r.id} className="flex items-center gap-3">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverUrl} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="h-10 w-14 shrink-0 rounded-lg bg-gray-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{r.title}</p>
                          <p className="text-xs text-gray-400">{date} {time} · {r.fieldName}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 印刷用レイアウト（print: クラスで表示） */}
      <div className="hidden print:block p-8">
        <h1 className="text-2xl font-bold mb-1">{fieldName} 作業記録</h1>
        <p className="text-sm text-gray-500 mb-6">{year}年 · {records.length}件</p>
        {Object.entries(grouped).sort().map(([month, items]) => (
          <div key={month} className="mb-6">
            <h2 className="text-base font-bold border-b pb-1 mb-3 break-after-avoid">
              {formatMonth(month)}
            </h2>
            {items.map((r) => {
              const { date, time } = formatDateTime(r.recordedAtISO);
              const coverUrl = r.photos[0]?.url;
              return (
                <div key={r.id} className="flex gap-3 mb-4 break-inside-avoid">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="h-24 w-32 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-24 w-32 shrink-0 rounded bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-xs text-gray-500">
                      {date} {time} · {r.fieldName}
                      {r.pointTypeLabel && ` · ${r.pointTypeLabel}`}
                      {` · ${r.statusLabel}`}
                    </p>
                    {r.latitude !== null && r.longitude !== null && (
                      <p className="text-xs text-gray-400">{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</p>
                    )}
                    {(r.summary || r.note) && (
                      <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">{r.summary || r.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
