import {
  IconCalendar,
  IconChat,
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
 * - トーク: 話す場所（/talk = 家族の統合トークルーム1本。田んぼ別ルームは作らない）
 * - 管理: 見わたす場所（状況・カレンダー・エクスポート）
 */
export const NAV_ITEMS = [
  { href: "/map", label: "マップ", Icon: IconMap },
  { href: "/talk", label: "トーク", Icon: IconChat },
  { href: "/home", label: "管理", Icon: IconHome },
  { href: "/menu", label: "設定", Icon: IconGear },
] as const;

/** 管理空間の下にぶら下がる二次導線（ドロワー・SideNavの「その他」セクション） */
export const SUB_NAV_ITEMS = [
  { href: "/records", label: "記録一覧", Icon: IconPencil },
  { href: "/fields", label: "田んぼ一覧", Icon: IconFieldGrid },
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(href + "/");
}
