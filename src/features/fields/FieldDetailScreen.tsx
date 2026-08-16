"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { loadPointMedia, addPointPhoto } from "../../lib/data/pointMedia";
import { getMyRole, saveFieldPoint } from "../../lib/data/farm";
import PointPhotoSection from "../map/PointPhotoSection";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FieldMiniMap } from "../../components/map/FieldMiniMap";
import { consumeJustSaved } from "../records/recordDraft";
import { formatAreaSqm } from "../../lib/utils/geo";
import { resolveRecordCoverUrl } from "../../lib/data/media";
import { useAreaUnit } from "../../lib/hooks/useAreaUnit";
import { useToast } from "../../components/ui/Toast";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import PhotoCompareSlider from "../../components/ui/PhotoCompareSlider";
import { CATEGORY_BADGE } from "../../components/ui/categoryStyles";
import StatusBadge, { type StatusKey } from "../../components/ui/StatusBadge";
import SectionHeading from "../../components/ui/SectionHeading";
import { useFieldDetail, type ObservationPhoto } from "./hooks/useFieldDetail";
import FieldKnowledgeBrowser from "./FieldKnowledgeBrowser";
import { useAuth } from "../auth/useAuth";
import { shareFieldStory } from "../../lib/utils/share";
import type { FieldPoint, FieldPointType, RecordItem } from "../../types";
import { POINT_TYPE_META } from "../map/pointTypeMeta";
import { PIN_COLORS, TYPE_LABELS } from "../map/mapPins";
import type { GeoJSON } from "geojson";
import {
  IconCamera,
  IconChevronRight,
  IconClose,
  IconFieldGrid,
  IconMic,
  IconShare,
} from "../../components/ui/icons";

/** ポイント種別の表示（ラベル・アイコンは mapPins.ts / pointTypeMeta.ts が元データ） */
function pointTypeView(type: FieldPointType | string | undefined) {
  const meta = POINT_TYPE_META[(type ?? "caution") as FieldPointType] ?? POINT_TYPE_META.caution;
  return {
    label: meta.label,
    icon: <meta.Icon className={`h-4 w-4 ${meta.color}`} />,
    color: meta.bg,
  };
}

/** カテゴリ別要約セクションで使う1件分のカード（要約表示・展開後表示の両方で共通利用） */
function RecordCard({
  record,
  thumbUrl,
  fallbackUrl,
}: {
  record: RecordItem;
  thumbUrl: string | undefined;
  fallbackUrl: string | undefined;
}) {
  const statusBadge = STATUS_BADGE[record.status];
  return (
    <Link href={`/records/${record.id}`} className="block active:scale-98 transition-transform">
      <Card className="overflow-hidden">
        <div className="relative h-40">
          <RecordThumb
            media={record.media}
            variant={record.category === "作業" ? "grass" : record.category === "異常" ? "sprout" : "water"}
            duration={record.audioDuration}
            thumbUrl={thumbUrl}
            fallbackUrl={fallbackUrl}
            className="h-full w-full"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className={`absolute left-3 top-3 ${CATEGORY_BADGE[record.category]}`}>
            {record.category}
          </Badge>
          {statusBadge && (
            <Badge className={`absolute right-3 top-3 ${statusBadge.cls}`}>
              {statusBadge.label}
            </Badge>
          )}
        </div>
        <CardContent className="px-4 py-3">
          <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
          <p className="mt-0.5 text-xs text-gray-400">{record.date} {record.time}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * カテゴリ内「すべて見る」で一度に描画する件数。
 * 記録数が数百〜数千件になる田んぼでも、展開時に一括で全件描画してモバイルが固まらないよう
 * 段階的に読み込む（レビュー指摘: 2026-08-12）
 */
const RECORDS_PAGE_SIZE = 20;

/** ピンの状態バッジ */
const POINT_STATUS_META: Record<FieldPoint["status"], { label: string; cls: string }> = {
  issue: { label: "異常", cls: "bg-red-100 text-red-700" },
  needs_check: { label: "要確認", cls: "bg-amber-100 text-amber-700" },
  normal: { label: "正常", cls: "bg-green-50 text-green-700" },
  resolved: { label: "解決済み", cls: "bg-blue-50 text-blue-600" },
};

/** 未対応・要確認のみ写真上に対応状況バッジを出す（解決済み/経過観察は既定状態のため出さない） */
const STATUS_BADGE: Partial<Record<string, { label: string; cls: string }>> = {
  open: { label: "未対応", cls: "border-transparent bg-red-600 text-white" },
  needs_check: { label: "要確認", cls: "border-transparent bg-amber-500 text-white" },
};

/**
 * 定点観測タイムマシン（田んぼOS レイヤー5）の1グループ分。
 * 「基準（以前）」写真を固定し、スライダーで比較対象（今）を時系列に動かして見比べる。
 * 写真を主役にするため、操作説明はスライダー側の視覚ヒント（パルス）に譲り最小限にする。
 */
function ObservationGroup({
  label,
  icon,
  photos,
}: {
  label: string;
  icon: ReactNode;
  photos: ObservationPhoto[];
}) {
  const [baseIndex, setBaseIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(photos.length - 1);

  const safeBaseIndex = Math.min(baseIndex, photos.length - 1);
  const safeCompareIndex = Math.min(compareIndex, photos.length - 1);

  useEffect(() => {
    if (baseIndex > photos.length - 1) setBaseIndex(Math.max(0, photos.length - 1));
    if (compareIndex > photos.length - 1) setCompareIndex(Math.max(0, photos.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  if (photos.length === 1) {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 p-3 pb-2">
          {icon}
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <span className="ml-auto text-xs text-gray-400">1枚</span>
        </div>
        <Link href={`/records/${photos[0].id}`} className="block aspect-square overflow-hidden">
          <RemotePhoto src={photos[0].url} alt={label} className="h-full w-full object-cover" fallbackVariant="field" />
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-2 p-3 pb-2">
        {icon}
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <span className="ml-auto text-xs text-gray-400">{photos.length}枚</span>
      </div>

      <PhotoCompareSlider
        beforeUrl={photos[safeBaseIndex].url}
        afterUrl={photos[safeCompareIndex].url}
        beforeLabel={photos[safeBaseIndex].shortDate}
        afterLabel={photos[safeCompareIndex].shortDate}
        className="rounded-none"
      />

      <div className="p-3">
        {/* 比較対象（今）を時系列に動かすスライダー */}
        <input
          type="range"
          min={0}
          max={photos.length - 1}
          value={safeCompareIndex}
          onChange={(e) => setCompareIndex(Number(e.target.value))}
          className="w-full accent-green-700"
          aria-label={`${label}の写真を時系列で比較する`}
        />

        <div className="mt-1.5 flex items-center justify-between text-xs">
          <Link href={`/records/${photos[safeBaseIndex].id}`} className="font-semibold text-green-700">
            「以前」の記録を見る
          </Link>
          <Link href={`/records/${photos[safeCompareIndex].id}`} className="font-semibold text-green-700">
            「今」の記録を見る
          </Link>
        </div>

        {/* 基準（以前）の写真はフィルムストリップからタップして選び直せる */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setBaseIndex(i)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ${
                i === safeBaseIndex ? "ring-2 ring-green-600" : ""
              }`}
              aria-label={`${p.date}の写真を基準にする`}
              aria-pressed={i === safeBaseIndex}
            >
              <RemotePhoto src={p.url} alt={p.date} className="h-full w-full object-cover" fallbackVariant="field" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 固定ポイント（入水口・出水口・機材入口など）の詳細シート。
 * カードをタップした場でこの田んぼのページ内のまま写真・一言メモ・状態を見せる
 * （2026-08-11オーナー指摘: タップで画像や詳細が見えるイメージだったのに、
 * 一覧の行から地図へ飛ぶだけになっていた）。
 */
function PointDetailSheet({
  point,
  onClose,
  fieldId,
  editable,
  onPhotoChange,
}: {
  point: FieldPoint;
  onClose: () => void;
  fieldId: string;
  editable: boolean;
  onPhotoChange: () => void;
}) {
  const meta = pointTypeView(point.type);
  const status = POINT_STATUS_META[point.status];
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-label={`${point.name || meta.label}の詳細`}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-gray-900">{point.name || meta.label}</p>
            <p className="text-xs text-gray-400">{meta.label}・最終記録 {point.lastRecord}</p>
          </div>
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${status.cls}`}>
            {status.label}
          </span>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IconClose className="h-4.5 w-4.5" />
          </button>
        </div>

        {point.memo && (
          <p className="mt-4 rounded-xl bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-700">
            {point.memo}
          </p>
        )}

        <div className="mt-4">
          <PointPhotoSection pointId={point.id} editable={editable} onChange={onPhotoChange} />
        </div>

        <Link
          href={`/map?field=${encodeURIComponent(fieldId)}&point=${encodeURIComponent(point.id)}`}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          地図で見る・編集する
          <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/**
 * 固定枠（入水口・出水口・機材搬入口）の登録シート。
 * この田んぼのページ内から出ずに、埋め込みミニマップをタップして位置を指定し、
 * 一言メモ・写真とあわせてその場で保存する（2026-08-11オーナー指摘:
 * 「画面遷移せずに登録出来るようにすると言ったはず」への対応。/mapへは遷移しない）。
 */
function RegisterPointSheet({
  pointType,
  fieldId,
  boundary,
  onClose,
  onSaved,
}: {
  pointType: FieldPointType;
  fieldId: string;
  boundary: GeoJSON.Polygon | null;
  onClose: () => void;
  /**
   * 保存成功時に呼ばれる。point はこの田んぼのpoints一覧へそのまま追加できる形。
   * note.type: "success" は問題なく完了したことが伝わる文言（デモ環境で写真が保存されない場合など、
   * 失敗ではないケースに使う）、"error" は実際に写真の保存に失敗した場合に使う。
   */
  onSaved: (point: FieldPoint, note: { message: string; type: "success" | "error" }) => void;
}) {
  const meta = pointTypeView(pointType);
  const label = TYPE_LABELS[pointType];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lngLat, setLngLat] = useState<[number, number] | null>(null);
  const [memo, setMemo] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プレビュー用のObject URLはファイル差し替え・アンマウント時に必ず解放する
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleSave = async () => {
    if (!lngLat) return;
    setSaving(true);
    setError(null);
    const { status, id } = await saveFieldPoint({
      fieldId,
      pointType,
      name: label,
      latitude: lngLat[1],
      longitude: lngLat[0],
      memo: memo.trim() || undefined,
    });

    if (status === "error") {
      setSaving(false);
      setError("保存に失敗しました。権限または通信環境を確認してもう一度お試しください");
      return;
    }

    if (status === "demo") {
      // Supabase未設定のデモ環境ではDBに保存されないため、ローカルにだけ反映する
      // （2026-08-12レビュー指摘: 保存後にサーバーへ再取得すると、静的なダミーデータに
      //   戻って登録した枠が消えて見えていた）。
      // 写真が保存されないのは仕様上の既定動作であり失敗ではないため、MapCanvas.tsxの
      // デモ保存時と同じトーンで「問題ない」ことが伝わる案内にする（オーナー指摘: 2026-08-12
      // 「失敗した」という表示はユーザーを不安にさせる）。
      const localPoint: FieldPoint = {
        id: `local-${crypto.randomUUID()}`,
        fieldId,
        name: label,
        type: pointType,
        status: "normal",
        lastRecord: "記録なし",
        lngLat,
        memo: memo.trim() || null,
      };
      setSaving(false);
      onSaved(localPoint, {
        message: photoFile
          ? `${label}をローカルに登録しました（デモ環境のため写真は保存されません。ログインすると保存できます）`
          : `${label}をローカルに登録しました（ログインすると共有されます）`,
        type: "success",
      });
      return;
    }

    // status === "saved"
    let photoFailed = false;
    if (id && photoFile) {
      const photoResult = await addPointPhoto(id, photoFile);
      photoFailed = photoResult !== "saved";
    }
    const dbPoint: FieldPoint = {
      id: id ?? `local-${crypto.randomUUID()}`,
      fieldId,
      name: label,
      type: pointType,
      status: "normal",
      lastRecord: "記録なし",
      lngLat,
      memo: memo.trim() || null,
    };
    setSaving(false);
    onSaved(
      dbPoint,
      photoFailed
        ? { message: "地点は登録しましたが、写真の保存に失敗しました", type: "error" }
        : { message: `${label}を登録しました`, type: "success" }
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-label={`${label}を登録`}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
            {meta.icon}
          </span>
          <h2 className="text-base font-bold text-gray-900">{label}を登録</h2>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">位置</label>
            <FieldMiniMap
              href={`/map?field=${encodeURIComponent(fieldId)}`}
              boundary={boundary}
              pickable
              onPick={setLngLat}
              markers={lngLat ? [{ lngLat, chipLabel: `ここに${label}`, color: PIN_COLORS[pointType] }] : []}
              className="mt-1 h-44 w-full rounded-xl"
            />
            {!lngLat && <p className="mt-1 text-xs text-gray-400">地図をタップして位置を指定してください</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">一言メモ（任意）</label>
              <VoiceInputButton onText={(t) => setMemo((prev) => prev ? prev + " " + t : t)} />
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: ゲートが重いので二人で開ける"
              rows={2}
              className="mt-1 w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">写真（任意）</label>
            {photoPreview ? (
              <div className="relative mt-1 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- ローカルプレビュー（Object URL）のため next/image を使わない */}
                <img src={photoPreview} alt="添付する写真" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  aria-label="写真の添付を取り消す"
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <IconCamera className="h-4.5 w-4.5 text-green-700" />
                写真を付ける（撮影・写真アプリから選択）
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!lngLat || saving}
            className="flex-1 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-40"
          >
            {saving ? "保存中…" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = { fieldId: string };

/**
 * 田んぼ詳細（/fields/[id]）。
 * 2026-08-09オーナー指摘: 他の田んぼへの切替チップ・タブ切替は「この田んぼだけの詳細」を
 * 分かりにくくするため廃止し、上から
 * 「カバー写真 → この田んぼの台帳（変わらない情報） → 記録アクション →
 *    この田んぼの記録（変化する情報） → 定点観測」の縦一列構成にする。
 * 2026-08-11オーナー指摘（UIUXブラッシュアップ）: 台帳は名前・色・状態が分かる1行に圧縮し、
 * 記録はカテゴリごとの要約+「すべて見る」にする。台帳・記録どちらもこのページの外には出さず、
 * 他の田んぼの情報と混同しないことを最優先にする。
 */
export default function FieldDetailScreen({ fieldId }: Props) {
  const { showToast } = useToast();
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const highlightPointId = searchParams.get("point");
  /**
   * カテゴリ別要約セクションで表示中の件数（カテゴリ名→件数。未展開は1件）。
   * 「すべて見る」を押しても全件は一度に描画せず、RECORDS_PAGE_SIZE件ずつ段階的に増やす
   */
  const [visibleRecordCounts, setVisibleRecordCounts] = useState<Record<string, number>>({});
  /** タップ中の固定ポイント（詳細シートを開く。マップからの?point=遷移でも自動で開く） */
  const [openPoint, setOpenPoint] = useState<FieldPoint | null>(null);
  /** 登録中の固定枠の種別（入水口/出水口/機材搬入口のいずれか。登録シートを開く） */
  const [registeringType, setRegisteringType] = useState<FieldPointType | null>(null);
  const [canEditPointPhotos, setCanEditPointPhotos] = useState(false);

  const {
    loading,
    notFound,
    field,
    points,
    records,
    thumbUrls,
    attention,
    openRecords,
    observationGroups,
    categoryCounts,
    lastRecord,
    handlePhotoSelect,
    coverImageUrl,
    imageSlots,
    addPoint,
  } = useFieldDetail(fieldId);

  useEffect(() => {
    let cancelled = false;
    if (!field.groupId) {
      setCanEditPointPhotos(false);
      return;
    }
    void getMyRole(field.groupId).then((role) => {
      if (!cancelled) setCanEditPointPhotos(role === "owner" || role === "editor");
    });
    return () => { cancelled = true; };
  }, [field.groupId]);

  // 記録保存直後にこの画面へ戻ってきた場合はトーストを出す
  useEffect(() => {
    if (consumeJustSaved()) showToast("記録を保存しました");
  }, [showToast]);

  // ホーム・マップからの「見くらべる」導線（?tab=photos）は、タブ廃止後は
  // 定点観測セクションまで自動スクロールする形で互換を保つ
  useEffect(() => {
    if (searchParams.get("tab") !== "photos" || loading) return;
    document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams, loading]);

  // ポイントの台帳写真（先頭1枚）をアイコンの代わりに出す
  const [pointThumbs, setPointThumbs] = useState<Record<string, string>>({});
  const loadPointThumbMap = useCallback(async (): Promise<Record<string, string>> => {
    if (points.length === 0) return {};
    const { byPoint, urls } = await loadPointMedia(points.map((point) => point.id));
    const thumbs: Record<string, string> = {};
    for (const [pointId, items] of Object.entries(byPoint)) {
      const first = items[0];
      if (first && urls[first.storagePath]) thumbs[pointId] = urls[first.storagePath];
    }
    return thumbs;
  }, [points]);

  const refreshPointThumbs = useCallback(async () => {
    setPointThumbs(await loadPointThumbMap());
  }, [loadPointThumbMap]);

  useEffect(() => {
    let cancelled = false;
    void loadPointThumbMap().then((thumbs) => {
      if (!cancelled) setPointThumbs(thumbs);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPointThumbMap]);

  // マップの「田んぼの詳細」から?point=付きで来た場合、その地点の詳細シートを自動で開く
  useEffect(() => {
    if (!highlightPointId) return;
    const target = points.find((p) => p.id === highlightPointId);
    if (target) setOpenPoint(target);
  }, [highlightPointId, points]);

  const [areaUnit, cycleAreaUnit] = useAreaUnit();
  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    return formatAreaSqm(sqm, areaUnit);
  };

  if (loading) {
    return (
      <div className="min-h-full space-y-3 bg-flow-cream px-3 pb-6 pt-3">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-16 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-flow-cream px-6 pt-20 text-center">
        <p className="text-base font-bold text-gray-900">田んぼが見つかりません</p>
        <p className="text-sm text-gray-500">
          {session
            ? "削除されたか、アクセス権限がない可能性があります。"
            : "ログインしていないため表示できない可能性があります。ログインするとこのページの田んぼを確認できます。"}
        </p>
        {!session ? (
          <Link
            href={`/login?redirect=${encodeURIComponent(`/fields/${fieldId}`)}`}
            className="rounded-xl bg-flow-green px-6 py-3 text-sm font-bold text-white"
          >
            ログインする
          </Link>
        ) : (
          <Link href="/map" className="rounded-xl bg-flow-green px-6 py-3 text-sm font-bold text-white">
            マップに戻る
          </Link>
        )}
        {!session && (
          <Link href="/map" className="text-sm font-semibold text-gray-500 underline-offset-2 hover:underline">
            マップに戻る
          </Link>
        )}
      </div>
    );
  }

  const lastRecordLabel = lastRecord
    ? `${new Date(lastRecord.recordedAt).getMonth() + 1}/${new Date(lastRecord.recordedAt).getDate()}`
    : "—";
  const hasAttention = attention.length > 0 || openRecords.length > 0;
  const pointById = new Map(points.map((p) => [p.id, p]));
  // 状態チップ（色のアクセントは状態チップのみに絞る田んぼOSデザイン原則）
  const overallStatus: StatusKey =
    attention.some((p) => p.status === "issue") || openRecords.some((r) => r.status === "open")
      ? "issue"
      : attention.length > 0 || openRecords.length > 0
        ? "needs_check"
        : "normal";
  const attentionCount = attention.length + openRecords.length;

  const handleShare = async () => {
    const url = `${window.location.origin}/fields/${encodeURIComponent(fieldId)}`;
    const statusLabel = hasAttention ? "気になるところがあります" : "順調に育っています";
    const result = await shareFieldStory({ fieldName: field.name || "名前のない田んぼ", statusLabel, url });
    if (result === "copied") showToast("リンクをコピーしました。LINEなどに貼り付けて共有できます");
    else if (result === "failed") showToast("共有に失敗しました", "error");
  };

  return (
    <div className="min-h-full space-y-5 bg-flow-cream px-3 pb-6 pt-3">
      <div className="space-y-1.5 rounded-2xl bg-white px-3.5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: field.color }}
            aria-hidden="true"
          />
          <h1 className="min-w-0 truncate font-heading text-base font-bold text-gray-900">
            {field.name || "名前のない田んぼ"}
          </h1>
          {field.areaSqm !== null && (
            <button
              onClick={cycleAreaUnit}
              className="shrink-0 border-b border-dotted border-gray-300 text-xs text-gray-500 active:opacity-70"
            >
              {formatArea(field.areaSqm)}
            </button>
          )}
          <span className="flex-1" />
          {points.length > 0 && (
            <StatusBadge
              status={overallStatus}
              label={
                overallStatus === "normal"
                  ? "順調"
                  : overallStatus === "issue"
                    ? `要対応 ${attentionCount}件`
                    : `要確認 ${attentionCount}件`
              }
              className="shrink-0"
            />
          )}
        </div>

        {/* 今の状態が分かる最小限の数値だけ、小さく添える（色や箱で強調しない） */}
        <p className="pl-4.5 text-xs text-gray-500">
          記録 {records.length}件
          {openRecords.length > 0 && <span className="font-bold text-red-500"> ・ 未対応 {openRecords.length}件</span>}
          {lastRecord && <span> ・ 最終記録 {lastRecordLabel}</span>}
        </p>
      </div>

      <FieldKnowledgeBrowser
        fieldId={fieldId}
        fieldName={field.name || "名前のない田んぼ"}
        boundary={field.boundary}
        coverImageUrl={coverImageUrl}
        points={points}
        pointThumbs={pointThumbs}
        records={records}
        initialPointId={highlightPointId}
        onRegisterPoint={setRegisteringType}
        onEditPoint={setOpenPoint}
        onCoverPhotoSelect={handlePhotoSelect}
      />

      {openPoint && (
        <PointDetailSheet
          point={openPoint}
          fieldId={fieldId}
          editable={canEditPointPhotos}
          onPhotoChange={() => { void refreshPointThumbs(); }}
          onClose={() => setOpenPoint(null)}
        />
      )}

      {registeringType && (
        <RegisterPointSheet
          pointType={registeringType}
          fieldId={fieldId}
          boundary={field.boundary}
          onClose={() => setRegisteringType(null)}
          onSaved={(point, note) => {
            setRegisteringType(null);
            addPoint(point);
            showToast(note.message, note.type === "error" ? "error" : undefined);
          }}
        />
      )}

      {/* ── 記録アクション ── */}
      <section className="flex gap-2.5">
        <Button asChild variant="primary" className="flex-1">
          <Link href={`/records/new?field=${encodeURIComponent(fieldId)}&returnTo=${encodeURIComponent(`/fields/${fieldId}`)}`}>
            <IconCamera className="h-4.5 w-4.5" />
            写真で記録
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1">
          <Link href={`/records/new?type=audio&field=${encodeURIComponent(fieldId)}&returnTo=${encodeURIComponent(`/fields/${fieldId}`)}`}>
            <IconMic className="h-4.5 w-4.5" />
            音声メモ
          </Link>
        </Button>
      </section>

      {/* アプリ外への手動共有（Issue #70・段階1: リンク+テキストのみ） */}
      <div>
        <Button variant="secondary" className="w-full" onClick={handleShare}>
          <IconShare className="h-4 w-4" />
          共有する
        </Button>
        <p className="mt-1.5 text-center text-xs text-gray-500">
          LINEなど、アプリの外にいる人へ送ります（仲間にはすでに「記録タイムライン」で見えています）
        </p>
      </div>

      {/* ── この田んぼの記録（変化する情報）。カテゴリごとに直近1件だけ見せ、
          残りは「すべて見る」で同じ田んぼの中のまま展開する（別ページには出さない） ── */}
      <div className="space-y-1">
        <SectionHeading trailing={<span className="text-xs font-semibold text-gray-400">{records.length}件</span>}>
          この田んぼの記録
        </SectionHeading>
        <p className="px-1 text-xs text-gray-400">
          日々の写真・音声メモです。多い時ほど「すべて見る」で振り返ってください
        </p>
      </div>
      {records.length > 0 ? (
        <div className="space-y-5">
          {categoryCounts.map(({ cat, count }) => {
            const categoryRecords = records.filter((r) => r.category === cat);
            const visibleCount = visibleRecordCounts[cat] ?? 1;
            const expanded = visibleCount > 1;
            const visible = categoryRecords.slice(0, visibleCount);
            const remaining = count - visible.length;
            return (
              <div key={cat} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold text-gray-600">{cat}<span className="ml-1 font-normal text-gray-400">{count}件</span></p>
                  {count > 1 && (
                    <button
                      onClick={() =>
                        setVisibleRecordCounts((prev) => ({
                          ...prev,
                          [cat]: expanded ? 1 : Math.min(count, RECORDS_PAGE_SIZE),
                        }))
                      }
                      className="text-xs font-bold text-flow-green"
                    >
                      {expanded ? "折りたたむ" : `すべて見る（${count}件）`}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {visible.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      thumbUrl={thumbUrls[record.id]}
                      fallbackUrl={resolveRecordCoverUrl(undefined, record.category, imageSlots)}
                    />
                  ))}
                </div>
                {remaining > 0 && (
                  <button
                    onClick={() =>
                      setVisibleRecordCounts((prev) => ({
                        ...prev,
                        [cat]: Math.min(count, visibleCount + RECORDS_PAGE_SIZE),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    さらに{Math.min(RECORDS_PAGE_SIZE, remaining)}件を表示（残り{remaining}件）
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">まだ記録がありません</p>
          <p className="mt-1 text-xs text-gray-400">上のボタンから最初の記録を作りましょう</p>
        </div>
      )}

      {/* ── 定点観測（変化する情報: 同じ地点の写真を時系列比較） ── */}
      <section id="photos" className="scroll-mt-3 space-y-2">
        <SectionHeading>定点観測</SectionHeading>
        {observationGroups.length > 0 ? (
          <div className="space-y-3">
            {observationGroups.map((g) => {
              const point = g.pointId ? pointById.get(g.pointId) : undefined;
              const meta = point ? pointTypeView(point.type) : null;
              const label = point ? point.name || meta!.label : "田んぼ全体";
              const icon = meta ? meta.icon : <IconFieldGrid className="h-4 w-4 text-green-700" />;
              return <ObservationGroup key={g.key} label={label} icon={icon} photos={g.photos} />;
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">まだ写真がありません</p>
            <p className="mt-1 text-xs text-gray-400">「写真で記録」から追加すると、同じ地点の変化を見比べられます</p>
          </div>
        )}
      </section>
    </div>
  );
}
