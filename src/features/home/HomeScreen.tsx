"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { excludePointBackedIssues, loadOpenIssueRecords, loadRecords } from "../../lib/data/records";
import { loadFarmData } from "../../lib/data/farm";
import type { FieldPoint } from "../../types";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import type { RecordItem } from "../../types";
import { getSeasonPhase } from "../../lib/season";
import SeasonTimelineBar from "../../components/ui/SeasonTimelineBar";
import SectionHeading from "../../components/ui/SectionHeading";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  IconCamera,
  IconChevronRight,
  IconFieldGrid,
  IconMap,
  IconChat,
  IconPin,
  IconWarningFill,
} from "../../components/ui/icons";

type FieldSummary = { id: string; name: string };
type AttentionField = { id: string; name: string; issueCount: number; needsCheckCount: number };

export default function HomeScreen() {
  const [fields, setFields] = useState<FieldSummary[]>([]);
  const [attentionFields, setAttentionFields] = useState<AttentionField[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [openIssueCount, setOpenIssueCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [recordsMode, setRecordsMode] = useState<"loading" | "demo" | "anon" | "live" | "error">("loading");
  const [loadError, setLoadError] = useState(false);
  const [isAnon, setIsAnon] = useState(false);

  useEffect(() => {
    // ピンの異常/要確認 + ピン変更を伴わない「記録のみ」の異常をマージする
    // （MapSummarySheetと同じ考え方。田んぼ単位の内訳とバナー件数の食い違いを防ぐ）
    Promise.all([loadFarmData(), loadOpenIssueRecords()]).then(([data, { records: issueRecords, count }]) => {
      if (data.mode === "anon") setIsAnon(true);
      if (data.mode === "error") setLoadError(true);
      setOpenIssueCount(count);

      const items = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
      }));
      setFields(items);

      const fieldNameMap = new Map(items.map((f) => [f.id, f.name]));
      const attnMap = new Map<string, { issueCount: number; needsCheckCount: number }>();
      data.points.forEach((p: FieldPoint) => {
        if (p.status !== "issue" && p.status !== "needs_check") return;
        if (!p.fieldId) return;
        const entry = attnMap.get(p.fieldId) ?? { issueCount: 0, needsCheckCount: 0 };
        if (p.status === "issue") entry.issueCount++;
        else entry.needsCheckCount++;
        attnMap.set(p.fieldId, entry);
      });
      // ピンに紐付いた異常記録はピン側で数え済みのため、「記録のみ」の異常だけを加算する
      excludePointBackedIssues(issueRecords, data.points).forEach(({ fieldId, isIssue }) => {
        if (!fieldId) return;
        const entry = attnMap.get(fieldId) ?? { issueCount: 0, needsCheckCount: 0 };
        if (isIssue) entry.issueCount++;
        else entry.needsCheckCount++;
        attnMap.set(fieldId, entry);
      });
      const attnFields: AttentionField[] = [];
      attnMap.forEach((counts, fid) => {
        attnFields.push({ id: fid, name: fieldNameMap.get(fid) ?? "", ...counts });
      });
      attnFields.sort((a, b) => (b.issueCount + b.needsCheckCount) - (a.issueCount + a.needsCheckCount));
      setAttentionFields(attnFields);

      setLoaded(true);
    }).catch(() => {
      setLoadError(true);
      setLoaded(true);
    });

    loadRecords().then((data) => {
      setRecordsMode(data.mode);
      setRecentRecords(data.records.slice(0, 8));
      setThumbUrls(data.thumbUrls);
    });
  }, []);

  const season = useMemo(() => getSeasonPhase(), []);
  const totalCounts = useMemo(() => {
    let issue = 0;
    let needsCheck = 0;
    attentionFields.forEach((f) => {
      issue += f.issueCount;
      needsCheck += f.needsCheckCount;
    });
    return { issue, needsCheck };
  }, [attentionFields]);

  return (
    <div className="space-y-4 px-3 pb-8 pt-3">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">管理</h1>
        <p className="mt-0.5 text-sm text-gray-500">田んぼ全体を見わたす場所</p>
      </div>

      {/* 農事暦シーズンエンジン: 今の時期と年間の位置づけ */}
      <section className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-4xl leading-none">{season.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-gray-900">{season.label}</p>
            <p className="mt-0.5 text-sm text-gray-600">{season.hint}</p>
          </div>
        </div>
        <Button asChild variant="primary" className="mt-3 w-full">
          <Link href="/records/new?returnTo=%2Fhome">
            {season.action}
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <div className="mt-4">
          <SeasonTimelineBar />
        </div>
      </section>

      {/* 未対応の異常（未ログイン時は実データが取得できていないため出さない） */}
      {!isAnon && openIssueCount !== null && openIssueCount > 0 && (
        <Link href="/records?status=open" className="block active:scale-98 transition-transform">
          <Card accent="open" className="flex items-center gap-3 bg-amber-50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <IconWarningFill className="h-5 w-5 text-amber-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-800">
                未対応の異常が{openIssueCount}件あります
              </p>
              <p className="mt-0.5 text-xs text-amber-600">タップして確認・対応する</p>
            </div>
            <StatusBadge status="open" label={`${openIssueCount}件`} />
            <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-amber-400" />
          </Card>
        </Link>
      )}
      {!isAnon && openIssueCount === 0 && totalCounts.issue === 0 && totalCounts.needsCheck === 0 && (
        <Card accent="normal" className="flex items-center gap-2 bg-green-50 p-4">
          <StatusBadge status="normal" />
          <p className="text-sm font-semibold text-green-700">未対応の異常はありません</p>
        </Card>
      )}
      {!isAnon && !loadError && openIssueCount === null && (
        <Skeleton className="h-14 w-full rounded-2xl" />
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

      {/* 信号色の統計サマリー（見わたす場所らしく、全体の量感を大きく見せる） */}
      {loaded && !isAnon && !loadError && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
            <p className="text-3xl font-bold leading-none text-gray-900">{fields.length}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-gray-500">田んぼ</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
            <p className={`text-3xl font-bold leading-none ${totalCounts.issue > 0 ? "text-red-600" : "text-gray-300"}`}>
              {totalCounts.issue}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-gray-500">異常</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
            <p className={`text-3xl font-bold leading-none ${totalCounts.needsCheck > 0 ? "text-amber-600" : "text-gray-300"}`}>
              {totalCounts.needsCheck}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-gray-500">要確認</p>
          </div>
        </div>
      )}

      {/* 要注意の田んぼ */}
      {attentionFields.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm">
          <SectionHeading tone="alert" className="p-4 pb-2">要注意の田んぼ</SectionHeading>
          <ul className="px-4 pb-3">
            {attentionFields.map((af, i) => (
              <li key={af.id}>
                <Link
                  href={`/fields/${encodeURIComponent(af.id)}`}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <IconWarningFill className="h-4 w-4 text-amber-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{af.name || "名前のない田んぼ"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {af.issueCount > 0 && <StatusBadge status="issue" label={`異常${af.issueCount}`} />}
                      {af.needsCheckCount > 0 && <StatusBadge status="needs_check" label={`要確認${af.needsCheckCount}`} />}
                    </div>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* クイックアクション（緑塗り=最優先/緑枠=第二/グレー枠=第三、の3層を維持） */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Button asChild variant="primary">
          <Link href="/records/new?returnTo=%2Fhome">
            <IconCamera className="h-5 w-5" />
            写真で記録
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/talk">
            <IconChat className="h-5 w-5" />
            トーク
          </Link>
        </Button>
        <Button asChild variant="tertiary">
          <Link href="/map">
            <IconMap className="h-5 w-5 text-green-700" />
            マップ
          </Link>
        </Button>
        <Button asChild variant="tertiary">
          <Link href="/fields">
            <IconFieldGrid className="h-5 w-5 text-green-700" />
            田んぼ
          </Link>
        </Button>
      </div>

      {/* 管理メニュー（ナビ4系統化に伴い、二次導線をここに集約） */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { href: "/calendar", label: "カレンダー" },
          { href: "/export", label: "エクスポート" },
          { href: "/guide", label: "使い方" },
        ].map(({ href, label }) => (
          <Button key={href} asChild variant="tertiary" className="border-0 shadow-sm">
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>

      {/* 最近の記録 */}
      <section className="rounded-2xl bg-white shadow-sm">
        <SectionHeading
          className="p-4 pb-2"
          trailing={
            <Link
              href="/records"
              className="flex items-center gap-0.5 text-sm font-semibold text-green-700"
            >
              すべて
              <IconChevronRight className="h-4 w-4" />
            </Link>
          }
        >
          最近の記録
        </SectionHeading>
        {recentRecords.length === 0 ? (
          recordsMode === "loading" ? (
            <div className="space-y-2 px-4 pb-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <p className="px-4 pb-4 text-sm text-gray-400">
              {recordsMode === "anon"
                ? "ログインすると記録が表示されます"
                : recordsMode === "error"
                  ? "記録を読み込めませんでした"
                  : "まだ記録がありません"}
            </p>
          )
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
          <SectionHeading
            className="p-4 pb-2"
            trailing={
              <Link
                href="/fields"
                className="flex items-center gap-0.5 text-sm font-semibold text-green-700"
              >
                一覧
                <IconChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            田んぼ
          </SectionHeading>
          {!loaded ? (
            <div className="space-y-2 px-4 pb-4">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-6 w-full rounded" />
            </div>
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
