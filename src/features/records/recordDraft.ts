import type { FieldPointType } from "../../types";

/**
 * 記録の下書き。撮影画面 → 保存前確認画面への受け渡しに使う。
 *
 * BlobはsessionStorageに保存できないため、モジュール変数のメモリ保持にする。
 * App Routerのクライアント遷移では同一JSコンテキストなので確実に届く。
 * ページをリロードすると消える（確認画面側で /records/new へ戻す）。
 */
export type RecordDraft = {
  kind: "photo" | "audio";
  /** 圧縮済みの添付ファイル（写真=JPEG） */
  file: Blob | null;
  /** プレビュー用Object URL（clearRecordDraftでrevokeされる） */
  previewUrl: string | null;
  fieldId: string | null;
  fieldName: string | null;
  pointId: string | null;
  pointType: FieldPointType | null;
  memo: string;
  location: { lng: number; lat: number } | null;
  /** ISO文字列 */
  recordedAt: string;
};

let draft: RecordDraft | null = null;

export function setRecordDraft(next: RecordDraft): void {
  // 古いプレビューURLのリーク防止（同じURLを使い回す場合は呼び出し側が管理）
  if (draft?.previewUrl && draft.previewUrl !== next.previewUrl) {
    URL.revokeObjectURL(draft.previewUrl);
  }
  draft = next;
}

export function getRecordDraft(): RecordDraft | null {
  return draft;
}

export function clearRecordDraft(): void {
  if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
  draft = null;
}

// 保存完了の通知（保存→一覧遷移後のトースト表示に使う）
let justSaved = false;

export function markJustSaved(): void {
  justSaved = true;
}

/** 一度読むとフラグは消える */
export function consumeJustSaved(): boolean {
  const v = justSaved;
  justSaved = false;
  return v;
}
