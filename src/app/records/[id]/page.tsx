"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RemotePhoto } from "../../../components/ui/RemotePhoto";
import { FieldMiniMap } from "../../../components/map/FieldMiniMap";
import { MemberAvatar } from "../../../components/ui/avatar";
import { shareContent } from "../../../lib/utils/share";
import { loadImageSlots } from "../../../lib/data/siteContent";
import { resolveRecordCoverUrl } from "../../../lib/data/media";
import { TYPE_TO_CATEGORY } from "../../../lib/data/records";
import type { ImageSlots } from "../../../lib/supabase/types";
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
  IconCommentFill,
  IconMap,
  IconMic,
  IconMoreVertical,
  IconPencil,
  IconPinFill,
  IconPlus,
  IconShare,
  IconTrash,
  IconUserFill,
} from "../../../components/ui/icons";
import {
  loadRecordDetail,
  addComment,
  changeRecordStatus,
  deleteRecord,
  statusLabelFor,
  type RecordDetailData,
  type MediaUrls,
  type RecordStatus,
} from "../../../lib/data/recordDetail";
import { deleteComment, updateComment } from "../../../lib/data/talk";
import { registerRecordPhotoToPoint } from "../../../lib/data/pointMedia";
import RegisterToPointSheet from "../../../features/records/RegisterToPointSheet";
import { useToast } from "../../../components/ui/Toast";
import type { RecordDetail, RecordPhoto, FieldPoint } from "../../../types";
import { VoiceInputButton } from "../../../components/ui/VoiceInputButton";
import { Button } from "../../../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<RecordDetailData | null>(null);
  // ピンの台帳への登録（写真単位）。ボタン連打防止と、登録済み表示のためのローカル状態
  const [registeringPhotoId, setRegisteringPhotoId] = useState<string | null>(null);
  const [registeredPhotoIds, setRegisteredPhotoIds] = useState<Set<string>>(new Set());
  const [pointPickerPhoto, setPointPickerPhoto] = useState<RecordPhoto | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusBusy, setStatusBusy] = useState<RecordStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});
  // コメントの編集・削除（自分のコメントのみ。record.comments[].isMineで判定）
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentEditSubmitting, setCommentEditSubmitting] = useState(false);
  const [pendingCommentDelete, setPendingCommentDelete] = useState<string | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRecordDetail(id).then((result) => {
      if (!cancelled) setData(result);
    });
    loadImageSlots().then((slots) => {
      if (!cancelled) setImageSlots(slots);
    });
    return () => { cancelled = true; };
  }, [id]);

  const goBack = () => {
    // 履歴があれば前画面に戻る。直接URLで開いた等で履歴が無いときは記録一覧へ
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/records");
    }
  };

  if (!data) {
    return (
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">読み込み中…</p>
        </main>
      </div>
    );
  }

  if (data.mode === "notfound") {
    return (
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-500">この記録は見つかりませんでした。</p>
        </main>
      </div>
    );
  }

  if (data.mode === "anon") {
    return (
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-gray-600">記録を見るにはログインが必要です。</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/records/${id}`)}`}
            className="rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white"
          >
            ログイン
          </Link>
        </main>
      </div>
    );
  }

  if (data.mode === "error") {
    return (
      <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
          <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
            <IconChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-500">読み込みに失敗しました。通信環境を確認してください。</p>
        </main>
      </div>
    );
  }

  if (data.mode !== "live" && data.mode !== "demo") return null;
  const record: RecordDetail = data.record;
  const mediaUrls: MediaUrls = data.mediaUrls;
  const isResolved = record.status === "resolved";
  const canDelete = data.canDelete;
  const canChangeStatus = data.canChangeStatus;

  // 「追記する」のクエリ: 現在の記録と同じ田んぼ・ピンに紐づくよう field/point/pointType を引き継ぐ
  // （未指定だと新規記録画面はGPSで田んぼを自動選択するため、隣接圃場で別の田んぼに保存される事故を防ぐ）
  const followupQuery = (() => {
    const params = new URLSearchParams({ type: "audio" });
    if (record.fieldId) params.set("field", record.fieldId);
    if (record.pointId) params.set("point", record.pointId);
    if (record.pointType) params.set("pointType", record.pointType);
    params.set("returnTo", `/records/${id}`);
    return params.toString();
  })();

  // 小さな地図に渡す座標。記録そのものの位置（GPS）と、写真ごとの位置を分けて扱う
  const recordPoints: [number, number][] =
    record.latitude !== null && record.longitude !== null ? [[record.longitude, record.latitude]] : [];
  const photoMarkers = mediaUrls.photos.flatMap((p, i) =>
    p.latitude !== null && p.longitude !== null
      ? [{
          lngLat: [p.longitude, p.latitude] as [number, number],
          label: mediaUrls.photos.length > 1 ? String(i + 1) : undefined,
        }]
      : []
  );

  /**
   * 状態の選択肢。異常記録では 'open' を「通常」と呼ばない
   * （ホーム・マップの未対応集計は異常記録の open/needs_check を未対応として数えるため、
   * 「通常」と表示すると詳細と警告が食い違う。tasks/TASKS.md PR1 制約1）。
   */
  const statusChoices: RecordStatus[] = ["open", "needs_check", "monitoring", "resolved"];

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setMessage(null);
    setSubmitting(true);
    const { error } = await addComment(id, commentText.trim());
    if (error) {
      setMessage(`コメントの投稿に失敗しました: ${error}`);
    } else {
      setCommentText("");
      setShowCommentInput(false);
      const refreshed = await loadRecordDetail(id);
      setData(refreshed);
    }
    setSubmitting(false);
  };

  const handleStartEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleSaveEditComment = async () => {
    if (!editingCommentId || commentEditSubmitting || !editCommentText.trim()) return;
    setCommentEditSubmitting(true);
    const { error } = await updateComment(editingCommentId, editCommentText.trim());
    setCommentEditSubmitting(false);
    if (error) {
      setMessage(`コメントの編集に失敗しました: ${error}`);
      return;
    }
    setEditingCommentId(null);
    setEditCommentText("");
    const refreshed = await loadRecordDetail(id);
    setData(refreshed);
  };

  const handleDeleteComment = async () => {
    if (!pendingCommentDelete || commentDeleting) return;
    setCommentDeleting(true);
    const { error } = await deleteComment(pendingCommentDelete);
    setCommentDeleting(false);
    if (error) {
      setMessage(`コメントの削除に失敗しました: ${error}`);
      setPendingCommentDelete(null);
      return;
    }
    setPendingCommentDelete(null);
    const refreshed = await loadRecordDetail(id);
    setData(refreshed);
  };

  /** 記録の共有（LINE等のOS共有シート。非対応環境はリンクコピー） */
  const handleShare = async () => {
    if (!record) return;
    const fieldLabel = record.fieldId && record.fieldName ? `${record.fieldName}・` : "";
    const result = await shareContent({
      title: record.title || "田んぼの記録",
      text: `${fieldLabel}${record.title}`,
      url: `${window.location.origin}/records/${encodeURIComponent(id)}`,
    });
    if (result === "copied") setMessage("リンクをコピーしました。LINEなどに貼り付けて共有できます");
    else if (result === "failed") setMessage("共有に失敗しました");
  };

  const handleChangeStatus = async (next: RecordStatus) => {
    if (statusBusy || next === record.status) return;
    setMessage(null);
    setStatusBusy(next);
    const { error } = await changeRecordStatus(id, next);
    // 状態更新自体は成功している可能性があるため、エラー有無に関わらず再読込する
    const refreshed = await loadRecordDetail(id);
    setData(refreshed);
    if (error) setMessage(error);
    setStatusBusy(null);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setMessage(null);
    setDeleting(true);
    const result = await deleteRecord(id);
    if (result.status === "deleted") {
      // 削除後はこの記録の詳細URLが404になるため、戻る先を明示的に置き換える。
      // 田んぼが分かっていれば田んぼ詳細へ（記録が消えた状態で再描画される）、なければ記録一覧へ
      const dest = record.fieldId ? `/fields/${encodeURIComponent(record.fieldId)}` : "/records";
      router.replace(dest);
      return;
    }
    setDeleting(false);
    setConfirmDelete(false);
    if (result.status === "denied") {
      setMessage("削除できませんでした（権限がありません）");
    } else if (result.status === "demo") {
      setMessage("デモモードでは削除できません");
    } else if (result.status === "anon") {
      setMessage("ログインが必要です");
    } else {
      setMessage(`削除に失敗しました: ${result.message}`);
    }
  };

  /**
   * 写真をピンの台帳に登録する。記録に point_id があれば直接登録し、
   * 無ければ同じ田んぼのピンをRegisterToPointSheetで選ばせる。
   * 田んぼ紐付けも無い記録ではボタン自体を出さない（呼び出し側で制御）。
   */
  const handleRegisterToPointClick = async (photo: RecordPhoto) => {
    if (record.pointId) {
      await runRegisterToPoint(photo, record.pointId);
    } else if (record.fieldId) {
      setPointPickerPhoto(photo);
    }
  };

  const runRegisterToPoint = async (photo: RecordPhoto, pointId: string) => {
    setRegisteringPhotoId(photo.id);
    const result = await registerRecordPhotoToPoint(photo.storagePath, pointId);
    setRegisteringPhotoId(null);
    if (result === "saved") {
      showToast("ピンの台帳に登録しました");
      setRegisteredPhotoIds((prev) => new Set(prev).add(photo.id));
    } else if (result === "denied") {
      showToast("登録できませんでした（編集権限がありません）", "error");
    } else if (result === "error") {
      showToast("登録に失敗しました。通信環境を確認してください", "error");
    }
  };

  const handleSelectPointForRegister = async (point: FieldPoint) => {
    const photo = pointPickerPhoto;
    setPointPickerPhoto(null);
    if (photo) await runRegisterToPoint(photo, point.id);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md md:max-w-2xl lg:max-w-3xl flex-col overflow-hidden bg-gray-100">
      {/* ヘッダー */}
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <button onClick={goBack} aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="その他の操作" className="absolute right-1 p-2.5 text-gray-500">
                <IconMoreVertical className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
                <IconTrash className="h-4 w-4" />
                記録を削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* 親（場所詳細）への常設導線。圃場未紐付けの記録はタイムラインへ戻す */}
      {record.fieldId ? (
        <Link
          href={`/fields/${encodeURIComponent(record.fieldId)}`}
          className="flex shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 text-xs font-bold text-green-700"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          {record.fieldName}
        </Link>
      ) : (
        <Link
          href="/records"
          className="flex shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 text-xs font-bold text-green-700"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          記録タイムラインに戻る
        </Link>
      )}

      {/* コンテンツ */}
      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* 写真・地点情報カード。写真が無い記録はカテゴリに応じたシステム既定の実写を表示
            （SVGプレースホルダーは使わない・オーナー方針。RemotePhoto内のPaddyPhotoは
            Supabase未設定の純デモ等、実写が用意できないときの最終フォールバックのみ） */}
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          {mediaUrls.photos.length > 0 ? (
            <div className="space-y-3">
              {mediaUrls.photos.map((photo, i) => (
                <figure key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={mediaUrls.photos.length > 1 ? `記録写真${i + 1}` : "記録写真"}
                    className="h-52 w-full rounded-xl object-cover"
                  />
                  {/* 写真ごとの撮影日時・位置（record_media に保存済みだが表示されていなかった） */}
                  {(photo.capturedAtLabel || photo.latitude !== null) && (
                    <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 px-0.5 text-[11px] text-gray-500">
                      {mediaUrls.photos.length > 1 && (
                        <span className="font-bold text-gray-600">写真{i + 1}</span>
                      )}
                      {photo.capturedAtLabel && (
                        <span className="flex items-center gap-1">
                          <IconCalendar className="h-3.5 w-3.5 text-green-700" />
                          {photo.capturedAtLabel}
                        </span>
                      )}
                      {photo.latitude !== null && photo.longitude !== null && (
                        <span className="flex items-center gap-1">
                          <IconPinFill className="h-3.5 w-3.5 text-green-700" />
                          {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                        </span>
                      )}
                    </figcaption>
                  )}
                  {/* 入水口・機械の出入口など「変わらない情報」はピンの台帳へ登録すると、
                      記録タイムラインとは別にマップのピン詳細から見返せる */}
                  {record.fieldId && (
                    <button
                      type="button"
                      disabled={registeringPhotoId === photo.id || registeredPhotoIds.has(photo.id)}
                      onClick={() => handleRegisterToPointClick(photo)}
                      className="mt-1.5 flex items-center gap-1 rounded-lg border border-green-700/25 bg-white px-2.5 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                      <IconPinFill className="h-3.5 w-3.5" />
                      {registeredPhotoIds.has(photo.id)
                        ? "登録済み"
                        : registeringPhotoId === photo.id
                          ? "登録中…"
                          : "ピンの台帳に登録"}
                    </button>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <RemotePhoto
              src={resolveRecordCoverUrl(undefined, TYPE_TO_CATEGORY[record.recordType] ?? "作業", imageSlots)}
              alt=""
              className="h-52 w-full rounded-xl"
              fallbackVariant="water"
            />
          )}

          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 圃場未紐付けの記録（field_id: null）は場所詳細を持たないため場所チップは出さない */}
                {record.fieldId && record.fieldName && (
                  <Link
                    href={`/fields/${encodeURIComponent(record.fieldId)}`}
                    className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800 underline-offset-2 hover:bg-green-200 hover:underline"
                  >
                    {record.fieldName}
                  </Link>
                )}
                {record.pointTypeLabel && (
                  record.fieldId && record.pointId ? (
                    <Link
                      href={`/fields/${encodeURIComponent(record.fieldId)}?point=${encodeURIComponent(record.pointId)}`}
                      className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 underline-offset-2 hover:bg-blue-200 hover:underline"
                    >
                      {record.pointTypeLabel}
                    </Link>
                  ) : (
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                      {record.pointTypeLabel}
                    </span>
                  )
                )}
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${
                    isResolved
                      ? "bg-gray-100 text-gray-500"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {record.statusLabel}
                </span>
              </div>
              <h2 className="mt-2.5 text-lg font-bold text-gray-900">{record.title}</h2>
              {record.address && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-gray-600">
                  <IconPinFill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
                  {record.address}
                </p>
              )}
            </div>

            {/* 小さな地図（場所確認用の脇役。圃場未紐付けの記録では非表示）。
                写真ごとの位置情報があれば、その地点にピンを立てる */}
            {record.fieldId && (recordPoints.length > 0 || photoMarkers.length > 0) && (
              <FieldMiniMap
                href={`/fields/${encodeURIComponent(record.fieldId)}`}
                points={recordPoints}
                markers={photoMarkers}
                className="h-20 w-24 shrink-0 rounded-xl"
                ariaLabel="場所詳細を見る"
              />
            )}
          </div>
        </section>

        {/* マップで見る / 共有する — 記録直後の「どこから共有?」に答える常設導線。
            圃場未紐付けの記録は場所詳細・地図を持たないため「マップで見る」は出さない */}
        <div className="flex gap-2">
          {record.fieldId && (() => {
            const params = new URLSearchParams();
            if (record.fieldId) params.set("field", record.fieldId);
            if (record.pointId) params.set("point", record.pointId);
            if (record.latitude !== null && record.longitude !== null) {
              params.set("lat", String(record.latitude));
              params.set("lng", String(record.longitude));
            }
            return (
              <Link
                href={`/map?${params.toString()}`}
                className="flex flex-1 items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3.5 shadow-sm transition-transform active:scale-98"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <IconMap className="h-4.5 w-4.5 text-green-700" />
                </span>
                <span className="text-sm font-bold text-green-700">マップで見る</span>
              </Link>
            );
          })()}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-3.5 shadow-sm transition-transform active:scale-98"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <IconShare className="h-4.5 w-4.5 text-green-700" />
            </span>
            <span className="text-sm font-bold text-green-700">共有する</span>
          </button>
        </div>
        <p className="-mt-1 text-center text-xs text-gray-500">
          共有するはLINEなど、アプリの外にいる人へ送ります（仲間にはすでに「記録タイムライン」で見えています）
        </p>

        {/* 状態の変更。保存時に選んだ状態を、後からいつでも変えられるようにする */}
        <section className="rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <IconCheck className="h-5 w-5 shrink-0 text-green-700" strokeWidth={2.2} />
            <p className="text-sm font-bold text-gray-900">この記録の状態</p>
          </div>
          {canChangeStatus ? (
            <>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {statusChoices.map((s) => {
                  const active = record.status === s;
                  const busy = statusBusy === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChangeStatus(s)}
                      disabled={statusBusy !== null || active}
                      aria-pressed={active}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-70 ${
                        active
                          ? "bg-green-700 text-white"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {busy ? "変更中…" : statusLabelFor(s, record.isIssue)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {record.isIssue
                  ? "「未対応」「要確認」の異常記録は、ホームとマップで未対応として表示されます"
                  : "変更するとホーム・マップの表示にも反映されます"}
              </p>
            </>
          ) : (
            // viewer は set_record_status RPC が owner/editor 限定のため必ず拒否される。
            // 押せないボタンを見せず、現在の状態を読み取り専用で示す
            <div className="mt-2.5 flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-semibold text-gray-600">
                {record.statusLabel}
              </span>
              <p className="text-xs text-gray-400">閲覧のみの権限のため変更できません</p>
            </div>
          )}

          {/* 状態変更の履歴（record_status_events。これまで記録だけされて表示されていなかった） */}
          {record.statusEvents.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-2.5">
              <p className="text-xs font-bold text-gray-600">状態の変更履歴</p>
              <ul className="mt-1.5 space-y-1.5">
                {record.statusEvents.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-gray-600">
                    <span className="text-gray-400">{e.at}</span>
                    <span className="font-semibold text-gray-800">
                      {e.fromLabel} → {e.toLabel}
                    </span>
                    <span className="text-gray-500">{e.by}</span>
                    {e.comment && <span className="w-full text-gray-500">{e.comment}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 記録情報カード */}
        <section className="rounded-2xl bg-white px-4 py-1 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconUserFill className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録者</span>
            <span className="text-sm text-gray-900">{record.recorder}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconCalendar className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録日時</span>
            <span className="text-sm text-gray-900">{record.recordedAt}</span>
          </div>
          {record.summary && (
            <div className="flex items-start gap-3 border-b border-gray-100 py-3.5">
              <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">状況の概要</span>
              <p className="text-sm leading-relaxed text-gray-900">{record.summary}</p>
            </div>
          )}
          {record.nextAction && (
            <div className="flex items-start gap-3 border-b border-gray-100 py-3.5">
              <IconChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-700">次のアクション</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-900">{record.nextAction}</p>
              </div>
            </div>
          )}
          {mediaUrls.audio && (
            <div className="flex items-center gap-3 py-3.5">
              <IconMic className="h-5 w-5 shrink-0 text-green-700" />
              <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">音声メモ</span>
              <audio ref={audioRef} src={mediaUrls.audio} controls className="h-9 flex-1 min-w-0" />
            </div>
          )}
        </section>

        {/* みんなのコメント */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCommentFill className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-bold text-gray-900">家族のコメント</h3>
            </div>
            <button
              onClick={() => setShowCommentInput((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-green-700"
            >
              <IconPlus className="h-4 w-4" strokeWidth={2.2} />
              コメントする
            </button>
          </div>

          {showCommentInput && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">コメント</span>
                <VoiceInputButton onText={(t) => setCommentText((prev) => prev ? prev + " " + t : t)} />
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力…"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
              />
              <div className="flex gap-2">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onClick={() => { setShowCommentInput(false); setCommentText(""); }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleAddComment}
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? "送信中…" : "送信"}
                </Button>
              </div>
            </div>
          )}

          {/* 短い相槌ログ（吹き出しは廃止。会話はLINEに委ねる） */}
          {record.comments.length > 0 ? (
            <div className="mt-3 divide-y divide-gray-100">
              {record.comments.map((comment, i) => {
                const isEditingThis = comment.id != null && editingCommentId === comment.id;
                return (
                  <div key={comment.id ?? i} className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <MemberAvatar name={comment.isMine ? "あなた" : comment.author} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-xs font-bold text-gray-700">
                          {comment.isMine ? "あなた" : comment.author}
                        </span>
                        {comment.isRecorder && (
                          <span className="rounded border border-green-600 px-1 text-[10px] font-semibold text-green-700">
                            本人
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">{comment.timestamp}</span>
                        {/* 自分のコメントのみ編集・削除できる */}
                        {comment.isMine && comment.id != null && !isEditingThis && (
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditComment(comment.id!, comment.text)}
                              aria-label="コメントを編集"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition-colors active:bg-green-50 active:text-green-600"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setPendingCommentDelete(comment.id!)}
                              aria-label="コメントを削除"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition-colors active:bg-red-50 active:text-red-500"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditingThis ? (
                        <div className="mt-1.5">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full resize-none rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-green-600"
                          />
                          <div className="mt-1.5 flex justify-end gap-3">
                            <button
                              onClick={handleCancelEditComment}
                              disabled={commentEditSubmitting}
                              className="text-xs font-semibold text-gray-500"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={handleSaveEditComment}
                              disabled={commentEditSubmitting || !editCommentText.trim()}
                              className="text-xs font-bold text-green-700 disabled:text-gray-300"
                            >
                              {commentEditSubmitting ? "保存中…" : "保存"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">まだコメントはありません</p>
          )}
        </section>

        {message && <p className="px-1 text-sm text-red-600">{message}</p>}
      </main>

      {/* 下部アクション */}
      <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* 現場での最頻操作だけを常設ボタンに置く（他の状態へは上の「この記録の状態」から変更する）。
            viewer には押しても必ず拒否される操作を見せない */}
        {canChangeStatus && (
          <Button
            variant={isResolved ? "tertiary" : "secondary"}
            className="flex-1"
            onClick={() => handleChangeStatus("resolved")}
            disabled={isResolved || statusBusy !== null}
          >
            <IconCheck className="h-5 w-5" strokeWidth={2.2} />
            {isResolved ? "対応済み" : statusBusy === "resolved" ? "更新中…" : "対応済みにする"}
          </Button>
        )}
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => router.push(`/records/new?${followupQuery}`)}
        >
          <IconMic className="h-4.5 w-4.5" />
          追記する
        </Button>
      </div>

      {/* 削除確認モーダル */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogTitle>この記録を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            写真・音声・コメントもまとめて削除されます。元には戻せません。
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
            >
              {deleting ? "削除中…" : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* コメント削除確認モーダル */}
      <AlertDialog open={pendingCommentDelete !== null} onOpenChange={(open) => { if (!open) setPendingCommentDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogTitle>このコメントを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>元には戻せません。</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={commentDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteComment(); }}
              disabled={commentDeleting}
            >
              {commentDeleting ? "削除中…" : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 記録に point_id が無い写真をピンの台帳に登録する際の、同じ田んぼ内のピン選択 */}
      {pointPickerPhoto && record.fieldId && (
        <RegisterToPointSheet
          fieldId={record.fieldId}
          onSelect={handleSelectPointForRegister}
          onClose={() => setPointPickerPhoto(null)}
        />
      )}
    </div>
  );
}
