"use client";

import { useEffect, useRef, useState } from "react";
import {
  addPointPhoto,
  deletePointPhoto,
  loadPointMedia,
  type PointMediaItem,
} from "../../lib/data/pointMedia";
import { useToast } from "../../components/ui/Toast";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { IconCamera, IconClose, IconTrash } from "../../components/ui/icons";

type Props = {
  pointId: string;
  /** 追加・削除ボタンを出す（ピン編集ダイアログ用） */
  editable?: boolean;
  /**
   * 同じピンを表示する別インスタンス（ピン編集ダイアログとマップのピン詳細パネルは
   * 同時にマウントされうる）で写真が追加・削除されたときに再取得させるための値。
   * 値が変わるたびに再読み込みする（レビュー指摘: 編集ダイアログで追加しても
   * 背後のピン詳細パネルが古いままだった）。呼び出し側が持つ共有カウンター等を渡す。
   */
  refreshKey?: number;
  /** editableな側で追加・削除が成功した直後に呼ばれる（呼び出し側でrefreshKeyを更新する用途） */
  onChange?: () => void;
};

/**
 * ピンの台帳写真セクション（マップのピン詳細・ピン編集ダイアログ共通）。
 * 記録タイムラインとは別系統の「変わらない情報」を横スクロールのサムネイルで見せる。
 * データ取得を自前で行う自己完結コンポーネントのため、置き場所ごとの配線は不要。
 */
export default function PointPhotoSection({ pointId, editable = false, refreshKey, onChange }: Props) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PointMediaItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // DB保存前のローカルピンは台帳写真を持てない
  const isLocalPin = pointId.startsWith("local-");

  const reload = async () => {
    const { byPoint, urls: signed } = await loadPointMedia([pointId]);
    setItems(byPoint[pointId] ?? []);
    setUrls(signed);
    setLoaded(true);
  };

  useEffect(() => {
    if (isLocalPin) {
      setItems([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    loadPointMedia([pointId]).then(({ byPoint, urls: signed }) => {
      if (cancelled) return;
      setItems(byPoint[pointId] ?? []);
      setUrls(signed);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pointId, isLocalPin, refreshKey]);

  const handleAdd = async (file: File) => {
    setBusy(true);
    const result = await addPointPhoto(pointId, file);
    setBusy(false);
    if (result === "saved") {
      showToast("設備の写真を追加しました");
      reload();
      onChange?.();
    } else if (result === "demo") {
      showToast("ログインすると写真を追加できます");
    } else if (result === "denied") {
      showToast("写真を追加できませんでした（編集権限がありません）", "error");
    } else {
      showToast("写真の追加に失敗しました。通信環境を確認してください", "error");
    }
  };

  const handleDelete = async (item: PointMediaItem) => {
    setBusy(true);
    const result = await deletePointPhoto(item);
    setBusy(false);
    if (result === "deleted") {
      showToast("写真を削除しました");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onChange?.();
    } else if (result === "denied") {
      showToast("削除できませんでした（編集権限がありません）", "error");
    } else if (result !== "demo") {
      showToast("削除に失敗しました", "error");
    }
  };

  if (isLocalPin) {
    return editable ? (
      <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
        ピンの保存が完了すると設備の写真を追加できます
      </p>
    ) : null;
  }

  // 閲覧時は写真が無ければ何も出さない（編集時は追加ボタンを出す）
  if (!editable && loaded && items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">
          設備の写真{items.length > 0 ? `（${items.length}枚）` : ""}
        </p>
        {editable && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-lg border border-green-700/30 bg-white px-2.5 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
          >
            <IconCamera className="h-3.5 w-3.5" />
            {busy ? "追加中…" : "写真を追加"}
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="mt-1.5 flex gap-1.5">
          <div className="h-20 w-20 animate-pulse rounded-xl bg-gray-200" />
        </div>
      ) : items.length > 0 ? (
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
          {items.map((item) => {
            const url = urls[item.storagePath];
            return (
              <div key={item.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => url && setLightboxUrl(url)}
                  className="block h-20 w-20 overflow-hidden rounded-xl"
                  aria-label="写真を拡大する"
                >
                  <RemotePhoto src={url} alt={item.caption ?? "設備の写真"} className="h-full w-full" />
                </button>
                {editable && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(item)}
                    aria-label="この写真を削除する"
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        editable && (
          <p className="mt-1.5 text-xs text-gray-400">
            入水口の様子や機械の出入口など、変わらない情報を写真で残せます
          </p>
        )
      )}

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAdd(f);
            e.currentTarget.value = "";
          }}
        />
      )}

      {/* 簡易ライトボックス（タップで閉じる） */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="写真の拡大表示"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 署名URL（有効期限つき）のため next/image を使わない */}
          <img src={lightboxUrl} alt="設備の写真" className="max-h-full max-w-full rounded-xl object-contain" />
          <button
            type="button"
            aria-label="閉じる"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
