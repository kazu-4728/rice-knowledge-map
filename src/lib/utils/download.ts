/** Blobをファイルとしてダウンロードさせる（ブラウザの標準的なa[download]トリック） */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // クリック後の非同期ダウンロード開始を妨げないよう少し待ってから解放する
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
