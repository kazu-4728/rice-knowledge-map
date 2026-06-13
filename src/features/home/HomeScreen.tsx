"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRecords } from "../../lib/data/records";
import { loadFarmData } from "../../lib/data/farm";
import { getSupabase } from "../../lib/supabase/client";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import type { RecordItem } from "../../types";
import FAB from "../../components/ui/FAB";
import {
  IconCamera,
  IconChevronRight,
  IconCommentFill,
  IconFieldGrid,
  IconMap,
  IconMic,
  IconPin,
  IconPinFill,
  IconPlus,
} from "../../components/ui/icons";

type FieldItem = {
  id: string;
  groupId: string;
  name: string;
  color: string;
  areaSqm: number | null;
  photoPath: string | null;
};

const features = [
  { icon: <IconCamera className="h-4.5 w-4.5 text-green-700" />, title: "写真・音声で記録", desc: "田んぼの様子をすぐに保存。音声入力にも対応。" },
  { icon: <IconMap className="h-4.5 w-4.5 text-green-700" />, title: "空中写真マップ", desc: "国土地理院の実際の空中写真で田んぼを確認・管理。" },
  { icon: <IconPinFill className="h-4.5 w-4.5 text-green-700" />, title: "固定ポイント管理", desc: "入水口・出水口・異常箇所をピンで登録・共有。" },
  { icon: <IconCommentFill className="h-4.5 w-4.5 text-green-700" />, title: "家族でコメント", desc: "記録にコメントを付けて対応完了を家族に知らせる。" },
  { icon: <IconMic className="h-4.5 w-4.5 text-green-700" />, title: "音声メモ", desc: "両手がふさがっているときも声で記録できる。" },
  { icon: <IconFieldGrid className="h-4.5 w-4.5 text-green-700" />, title: "田んぼ一覧管理", desc: "複数の田んぼをカバー写真付きで一目で把握。" },
  { icon: <IconCommentFill className="h-4.5 w-4.5 text-green-700" />, title: "世代間の知恵継承", desc: "今年の記録が来年の判断を助ける。農家の知恵をデジタルで次世代へ。" },
];

export default function HomeScreen() {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [fieldsMode, setFieldsMode] = useState<"loading" | "live" | "demo" | "anon" | "error">("loading");
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    loadFarmData().then(async (data) => {
      setFieldsMode(data.mode);
      const items: FieldItem[] = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        groupId: f.properties?.group_id ?? data.groupId ?? "",
        name: String(f.properties?.name ?? ""),
        color: String(f.properties?.color ?? "#22C55E"),
        areaSqm: typeof f.properties?.area_sqm === "number" ? f.properties.area_sqm : null,
        photoPath: f.properties?.photo_path ?? null,
      }));
      setFields(items);

      const paths = items.flatMap((f) => f.photoPath ? [f.photoPath] : []);
      if (paths.length > 0) {
        const sb = getSupabase();
        if (sb) {
          const { data: signed } = await sb.storage.from("images").createSignedUrls(paths, 3600);
          const map: Record<string, string> = {};
          signed?.forEach((s, i) => { if (s.signedUrl && !s.error) map[paths[i]] = s.signedUrl; });
          const urlMap: Record<string, string> = {};
          items.forEach((f) => { if (f.photoPath && map[f.photoPath]) urlMap[f.id] = map[f.photoPath]; });
          setPhotoUrls(urlMap);
        }
      }
    });

    loadRecords().then((data) => {
      setRecentRecords(data.records.slice(0, 5));
      setThumbUrls(data.thumbUrls);
    });
  }, []);

  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
    return `${sqm.toFixed(0)}㎡`;
  };

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      {/* 田んぼ一覧（主役） */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <IconFieldGrid className="h-6 w-6 text-green-700" />
          <h1 className="text-2xl font-bold text-gray-900">田んぼ一覧</h1>
        </div>
        {fieldsMode !== "loading" && (
          <span className="text-sm text-gray-500">{fields.length}枚</span>
        )}
      </div>

      {fieldsMode === "anon" && (
        <Link href="/login?redirect=%2Fhome" className="block rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">ログインすると田んぼ一覧が表示されます</p>
          <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
        </Link>
      )}

      {fieldsMode === "loading" && (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      )}

      {fieldsMode === "error" && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">田んぼを読み込めませんでした</p>
          <p className="mt-1 text-xs text-gray-500">通信環境を確認して開き直してください</p>
        </div>
      )}

      {(fieldsMode === "live" || fieldsMode === "demo") && fields.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-900">まだ田んぼが登録されていません</p>
          <p className="mt-1 text-xs text-gray-500">マップで田んぼの輪郭をなぞって登録できます</p>
        </div>
      )}

      {(fieldsMode === "live" || fieldsMode === "demo") && fields.length > 0 && (
        <div className="space-y-2.5">
          {fields.map((field) => (
            <Link
              key={field.id}
              href={`/fields/${encodeURIComponent(field.id)}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                <RemotePhoto
                  src={photoUrls[field.id]}
                  alt={field.name}
                  className="h-full w-full object-cover"
                  fallbackVariant="field"
                />
                {!photoUrls[field.id] && (
                  <span className="absolute inset-0 opacity-45" style={{ background: field.color }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-gray-900">
                  {field.name}
                  {formatArea(field.areaSqm) && (
                    <span className="ml-2 text-sm font-medium text-gray-500">{formatArea(field.areaSqm)}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">タップして詳細を見る</p>
              </div>
              <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
            </Link>
          ))}
        </div>
      )}

      {/* 田んぼを追加 */}
      <Link
        href="/map"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-600 bg-white py-4 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
      >
        <IconPlus className="h-5 w-5" strokeWidth={2.2} />
        田んぼを追加（マップで描く）
      </Link>

      {/* 記録導線 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-base font-bold text-gray-900">きょうの様子を記録する</p>
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
      </section>

      {/* 最近の記録（折りたたみ） */}
      {recentRecords.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setRecordsOpen((v) => !v)}
            className="flex w-full items-center justify-between p-4"
          >
            <h2 className="text-base font-bold text-gray-900">最近の記録</h2>
            <div className="flex items-center gap-1 text-sm text-green-700">
              {recordsOpen ? "閉じる" : "開く"}
              <IconChevronRight className={`h-4 w-4 transition-transform ${recordsOpen ? "rotate-90" : ""}`} />
            </div>
          </button>
          {recordsOpen && (
            <>
              <ul className="px-4 pb-2">
                {recentRecords.map((record, i) => (
                  <li key={record.id}>
                    <Link
                      href={`/records/${record.id}`}
                      className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                    >
                      <RecordThumb
                        media={record.media}
                        variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
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
              <div className="border-t border-gray-100 p-3">
                <Link href="/records" className="flex items-center justify-center gap-1 text-sm font-semibold text-green-700">
                  すべての記録を見る
                  <IconChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </section>
      )}

      {/* このアプリでできること（折りたたみ） */}
      <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="flex w-full items-center justify-between p-4"
        >
          <h2 className="text-base font-bold text-gray-900">このアプリでできること</h2>
          <div className="flex items-center gap-1 text-sm text-green-700">
            {guideOpen ? "閉じる" : "開く"}
            <IconChevronRight className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-90" : ""}`} />
          </div>
        </button>
        {guideOpen && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-500 mb-3">
              家族みんなで田んぼの記録を共有し、稲作の知恵を次の世代へ引き継ぐアプリです。
            </p>
            <ul className="space-y-3">
              {features.map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/guide" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-green-700">
              詳しい使い方を見る
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* FAB */}
      <FAB
        actions={[
          {
            href: "/records/new",
            icon: <IconCamera className="h-6 w-6 text-white" />,
            label: "写真で記録",
            color: "bg-green-600",
          },
          {
            href: "/records/new?type=audio",
            icon: <IconMic className="h-6 w-6 text-white" />,
            label: "音声メモ",
            color: "bg-teal-600",
          },
        ]}
      />
    </div>
  );
}
