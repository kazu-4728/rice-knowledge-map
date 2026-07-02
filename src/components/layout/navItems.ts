import {
  IconCalendar,
  IconDocDown,
  IconFieldGrid,
  IconGear,
  IconHome,
  IconMap,
  IconPencil,
  IconSprout,
} from "../ui/icons";

/**
 * 田んぼOSの3空間+設定（主要ナビ4系統）
 * - マップ: 開く場所（地図が起点）
 * - 記録: PR-2で専用ページ `/talk`（家族の統合トークルーム1本）を新設し「トーク」に置き換える予定。
 *   それまで既存の記録一覧を「トーク」と呼ぶと誤解を生むため、暫定的に「記録」表記とする
 * - 管理: 見わたす場所（状況・カレンダー・エクスポート）
 */
export const NAV_ITEMS = [
  { href: "/map", label: "マップ", Icon: IconMap },
  { href: "/records", label: "記録", Icon: IconPencil },
  { href: "/home", label: "管理", Icon: IconHome },
  { href: "/menu", label: "設定", Icon: IconGear },
] as const;

/** 管理空間の下にぶら下がる二次導線（ドロワー・SideNavの「その他」セクション） */
export const SUB_NAV_ITEMS = [
  { href: "/fields", label: "田んぼ一覧", Icon: IconFieldGrid },
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(href + "/");
}
