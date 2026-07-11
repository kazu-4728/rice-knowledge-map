export type ShareFieldStoryResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * 田んぼストーリー画面から家族LINEへの手動共有（Issue #70・段階1）。
 * Web Share API（テキスト+リンクのみ。画像ファイルは段階2以降）でOSの共有シートを開く。
 * 非対応環境ではクリップボードへのコピーにフォールバックする。
 */
export async function shareFieldStory(params: {
  fieldName: string;
  statusLabel: string;
  url: string;
}): Promise<ShareFieldStoryResult> {
  const title = `${params.fieldName || "田んぼ"}の様子`;
  const text = `${title}\n${params.statusLabel}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url: params.url });
      return "shared";
    } catch (err) {
      // ユーザーが共有シートを閉じた場合は失敗扱いにしない（コピーへもフォールバックしない）
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // それ以外の失敗（対応アプリなし等）はクリップボードへフォールバックする
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${text}\n${params.url}`);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
