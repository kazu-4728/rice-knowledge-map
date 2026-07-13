export type ShareResult = "shared" | "copied" | "cancelled" | "failed";
/** @deprecated 汎用名の ShareResult を使ってください。既存呼び出し元との後方互換のために残しています */
export type ShareFieldStoryResult = ShareResult;

/**
 * OSの共有シート（Web Share API）でテキスト+リンクを共有する。
 * 非対応環境ではクリップボードへのコピーにフォールバックする。
 * 田んぼストーリー（shareFieldStory）とホーム（Issue #72）の共通実装。
 */
export async function shareContent(params: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareResult> {
  const { title, text, url } = params;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      // ユーザーが共有シートを閉じた場合は失敗扱いにしない（コピーへもフォールバックしない）
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // それ以外の失敗（対応アプリなし等）はクリップボードへフォールバックする
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

/**
 * 田んぼストーリー画面から家族LINEへの手動共有（Issue #70・段階1）。
 * Web Share API（テキスト+リンクのみ。画像ファイルは段階2以降）でOSの共有シートを開く。
 */
export async function shareFieldStory(params: {
  fieldName: string;
  statusLabel: string;
  url: string;
}): Promise<ShareFieldStoryResult> {
  const title = `${params.fieldName || "田んぼ"}の様子`;
  const text = `${title}\n${params.statusLabel}`;
  return shareContent({ title, text, url: params.url });
}
