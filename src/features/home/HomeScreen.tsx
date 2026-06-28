"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRecords } from "../../lib/data/records";
import { loadFarmData, ensureGroupId } from "../../lib/data/farm";
import { getSupabase } from "../../lib/supabase/client";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { RecordItem } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconFieldGrid,
  IconMap,
  IconMic,
  IconPin,
  IconWarningFill,
} from "../../components/ui/icons";

type FieldSummary = { id: string; name: string };

export default function HomeScreen() {
  const [fields, setFields] = useState<FieldSummary[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [recordsMode, setRecordsMode] = useState<"loading" | "demo" | "anon" | "live" | "error">("loading");
  const [loadError, setLoadError] = useState(false);
  const [isAnon, setIsAnon] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      ensureGroupId().then(async (groupId) => {
        if (!groupId) return;
        const { count } = await sb
          .from("records")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "needs_check"])
          .or("record_type.eq.issue,ai_category.in.(caution,levee_damage,poor_drainage)");
        setOpenIssueCount(count ?? 0);
      });
    }

    loadFarmData().then((data) => {
      if (data.mode === "anon") setIsAnon(true);
      if (data.mode === "error") setLoadError(true);
      const items = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
      }));
      setFields(items);
      setLoaded(true);
    });

    loadRecords().then((data) => {
      setRecordsMode(data.mode);
      setRecentRecords(data.records.slice(0, 8));
      setThumbUrls(data.thumbUrls);
    });
  }, []);

  return (
    <div className="space-y-4 px-3 pb-8 pt-3">
      <h1 className="px-1 text-2xl font-bold text-gray-900">状況</h1>

      {/* 未対応の異常 */}
      {openIssueCount !== null && openIssueCount > 0 && (
        <Link
          href="/records?status=open"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-transform active:scale-98"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <IconWarningFill className="h-5 w-5 text-amber-600" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-800">
              未対応の異常が{openIssueCount}件あります
            </p>
            <p className="mt-0.5 text-xs text-amber-600">タップして確認・対応する</p>
          </div>
          <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-amber-400" />
        </Link>
      )}
      {openIssueCount === 0 && (
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">未対応の異常はありません</p>
        </div>
      )}

      {/* ログイン促進 */}
      {isAnon && (
        <Link
          href="/login?redirect=%2Fhome"
          className="block rounded-2xl bg-white p-5 text-center shadow-sm"
        >
          <p className="text-sm font-bold text-gray-900">
            ログインするとすべての情報が表示されます
          </p>
          <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
        </Link>
      )}

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Link
          href="/records/new?returnTo=%2Fhome"
          className="flex items-center justify-center gap-2 rounded-2xl bg-green-700 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-800"
        >
          <IconCamera className="h-5 w-5" />
          写真で記録
        </Link>
        <Link
          href="/records/new?type=audio&returnTo=%2Fhome"
          className="flex items-center justify-center gap-2 rounded-2xl border border-green-700 bg-white py-3.5 text-sm font-bold text-green-700 shadow-sm transition-colors hover:bg-green-50"
        >
          <IconMic className="h-5 w-5" />
          音声メモ
        </Link>
        <Link
          href="/map"
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconMap className="h-5 w-5 text-green-700" />
          マップ
        </Link>
        <Link
          href="/fields"
          className="flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <IconFieldGrid className="h-5 w-5 text-green-700" />
          田んぼ
        </Link>
      </div>

      {/* 最近の記録 */}
      <section className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-base font-bold text-gray-900">最近の記録</h2>
          <Link
            href="/records"
            className="flex items-center gap-0.5 text-sm font-semibold text-green-700"
          >
            すべて
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {recentRecords.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-gray-400">
            {recordsMode === "loading"
              ? "読み込み中…"
              : recordsMode === "anon"
                ? "ログインすると記録が表示されます"
                : recordsMode === "error"
                  ? "記録を読み込めませんでした"
                  : "まだ記録がありません"}
          </p>
        ) : (
          <ul className="px-4 pb-3">
            {recentRecords.map((record, i) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
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
                    className="h-12 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {record.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
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
        )}
      </section>

      {/* 田んぼ概要 */}
      {isAnon ? (
        <section className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">
            ログインすると田んぼ情報が表示されます
          </p>
          <Link
            href="/login?redirect=%2Fhome"
            className="mt-1 inline-block text-sm font-bold text-green-700"
          >
            タップしてログイン
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-base font-bold text-gray-900">田んぼ</h2>
            <Link
              href="/fields"
              className="flex items-center gap-0.5 text-sm font-semibold text-green-700"
            >
              一覧
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {!loaded ? (
            <p className="px-4 pb-4 text-sm text-gray-400">読み込み中…</p>
          ) : loadError ? (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-500">
                田んぼを読み込めませんでした。通信環境を確認して開き直してください。
              </p>
            </div>
          ) : fields.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-400">
                まだ田んぼが登録されていません
              </p>
              <Link
                href="/map"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700"
              >
                マップで登録する
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600">
                登録済み: <span className="font-bold">{fields.length}枚</span>
              </p>
              <ul className="mt-2 space-y-1">
                {fields.slice(0, 5).map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/fields/${encodeURIComponent(f.id)}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-green-600" />
                      <span className="truncate">{f.name || "名前のない田んぼ"}</span>
                    </Link>
                  </li>
                ))}
                {fields.length > 5 && (
                  <li className="px-2 text-xs text-gray-400">
                    ほか{fields.length - 5}枚
                  </li>
                )}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
