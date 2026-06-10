import type { FieldPointType } from "../../types";

/** ピンの色（参照モック: 入水口=青 / 出水口=緑 / 異常=赤） */
export const PIN_COLORS: Record<FieldPointType, string> = {
  inlet: "#2F80ED",
  outlet: "#2E9E44",
  canal: "#0EA5E9",
  caution: "#E53935",
  weed: "#84CC16",
  levee_damage: "#B45309",
  poor_drainage: "#7C3AED",
  other: "#6B7280",
};

export const TYPE_LABELS: Record<FieldPointType, string> = {
  inlet: "入水口",
  outlet: "出水口",
  canal: "水路",
  caution: "注意箇所",
  weed: "雑草",
  levee_damage: "畦崩れ",
  poor_drainage: "水抜け不良",
  other: "その他",
};

export const STATUS_LABELS: Record<string, string> = {
  normal: "良好",
  needs_check: "要確認",
  issue: "異常",
  resolved: "解決済み",
};

/** ピン内部の白い記号（種別ごと） */
function innerGlyph(type: FieldPointType): string {
  switch (type) {
    case "inlet":
    case "canal":
    case "poor_drainage":
      // しずく
      return `<path d="M15 7.2s4.4 4.6 4.4 7.6a4.4 4.4 0 1 1-8.8 0c0-3 4.4-7.6 4.4-7.6Z" fill="white"/>`;
    case "caution":
    case "levee_damage":
      // ！マーク
      return `<rect x="13.7" y="7.5" width="2.6" height="7.5" rx="1.3" fill="white"/><circle cx="15" cy="18" r="1.6" fill="white"/>`;
    case "weed":
      // 草
      return `<path d="M15 18c0-4 1.6-6.4 4.6-7.4-.6 3.6-2 5.8-4.6 7.4Zm0 0c0-4-1.6-6.4-4.6-7.4.6 3.6 2 5.8 4.6 7.4Z" fill="white"/>`;
    default:
      // 丸
      return `<circle cx="15" cy="13" r="4" fill="white"/>`;
  }
}

/** ティアドロップ型ピンのSVG文字列（HTML Marker用） */
export function pinSVG(type: FieldPointType, size = 34): string {
  const color = PIN_COLORS[type] ?? PIN_COLORS.other;
  const h = Math.round(size * (38 / 30));
  return `
<svg width="${size}" height="${h}" viewBox="0 0 30 38" style="display:block">
  <path d="M15 36.6C15 36.6 26.8 24.4 26.8 13.4 26.8 6.7 21.5 1.6 15 1.6S3.2 6.7 3.2 13.4C3.2 24.4 15 36.6 15 36.6Z"
    fill="${color}" stroke="white" stroke-width="2"/>
  <g transform="translate(0,0)">${innerGlyph(type)}</g>
</svg>`;
}
