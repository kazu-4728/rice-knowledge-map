import {
  IconCalendar,
  IconChat,
  IconDocDown,
  IconFieldGrid,
  IconGear,
  IconMap,
  IconPencil,
  IconSprout,
} from "../ui/icons";

/**
 * 田んぼOSの3空間+管理レイヤー（Issue #64。フェーズ3で「田んぼストーリー」を追加し4タブになる）
 * - 現場OS: 今なにが起きてる? 次なにする?（マップ+旧ホームを統合）
 * - 今日の流れ: 今日みんな何した?（記録+会話を統合した1本のタイムライン）
 * - メニュー: 管理レイヤー（カレンダー・エクスポート・設定等を日常導線から退避）
 */
export const NAV_ITEMS = [
  { href: "/map", label: "現場OS", Icon: IconMap },
  { href: "/talk", label: "今日の流れ", Icon: IconChat },
  { href: "/menu", label: "メニュー", Icon: IconGear },
] as const;

/** 管理レイヤーの二次導線（ドロワー・SideNav・/menuの「その他」セクション） */
export const SUB_NAV_ITEMS = [
  { href: "/records", label: "記録一覧", Icon: IconPencil },
  { href: "/fields", label: "田んぼ一覧", Icon: IconFieldGrid },
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
