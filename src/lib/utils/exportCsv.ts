import type { ExportRecord } from "../data/exportData";

const HEADERS = ["日時", "田んぼ", "分類", "地点種別", "状態", "タイトル", "メモ", "AI要約", "次のアクション", "緯度", "経度", "写真枚数", "音声"];

/** RFC 4180準拠のフィールドエスケープ（カンマ・改行・ダブルクォートを含む場合のみ囲む） */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: (string | number | null)[]): string {
  return fields.map((f) => escapeCsvField(f === null ? "" : String(f))).join(",");
}

/**
 * 記録の構造化データのみをCSVへ変換する（画像は含まない。表計算・分析用途）。
 * Excelでの文字化けを防ぐため、呼び出し側でBOM付きUTF-8として書き出すこと。
 */
export function buildRecordsCsv(records: ExportRecord[]): string {
  const lines = [toCsvRow(HEADERS)];
  for (const r of records) {
    lines.push(
      toCsvRow([
        r.recordedAtISO,
        r.fieldName,
        r.category,
        r.pointTypeLabel,
        r.statusLabel,
        r.title,
        r.note,
        r.summary,
        r.nextAction,
        r.latitude,
        r.longitude,
        r.photos.length,
        r.hasAudio ? "あり" : "",
      ])
    );
  }
  // CRLFはExcel等での互換性のため
  return lines.join("\r\n");
}
