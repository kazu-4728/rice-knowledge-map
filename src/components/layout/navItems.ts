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
 * 田んぼOSの3空間+各場所の記録+管理レイヤー（Issue #64・フェーズ3で4タブ化）。
 * 名称はホームのバナー・ページ見出し・ガイドと完全一致させる（2026-07-16オーナー確定・案B）。
 * - マップ: 今なにが起きてる? 次なにする?（見る・なぞって登録する）
 * - みんなの記録: 今日みんな何した?（記録+会話を統合した1本のタイムライン。家族に限らない）
 * - 各場所の記録: この田んぼはどう育ってる?（田んぼ詳細+生育比較を統合）
 * - メニュー: 管理レイヤー（カレンダー・エクスポート・設定等を日常導線から退避）
 */
export const NAV_ITEMS = [
  { href: "/map", label: "マップ", Icon: IconMap },
  { href: "/talk", label: "みんなの記録", Icon: IconChat },
  { href: "/fields", label: "各場所の記録", Icon: IconFieldGrid },
  { href: "/menu", label: "メニュー", Icon: IconGear },
] as const;

/** 管理レイヤーの二次導線（ドロワー・SideNav・/menuの「その他」セクション） */
export const SUB_NAV_ITEMS = [
  { href: "/records", label: "記録一覧", Icon: IconPencil },
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
