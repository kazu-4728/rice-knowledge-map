import {
  IconCalendar,
  IconChat,
  IconDocDown,
  IconGear,
  IconHome,
  IconMap,
  IconSprout,
} from "../ui/icons";

/**
 * 入り口は下部タブ4つのみ（再設計フェーズ5・情報構造の正）。
 * 場所詳細（/fields/[id]）は「入り口」ではなく「着地先」のためタブに含めない
 * （マップ・ホーム・記録タイムライン経由で到達する）。
 * - ホーム: 今日の田んぼ状態・記録ボタン・最近の記録（現場モード）
 * - マップ: 唯一、地図が主役の画面。今なにが起きてる? 次なにする?
 * - 記録タイムライン: 記録+会話を統合した1本の時系列（旧/talk・旧/records一覧を統合）
 * - メニュー: 後作業モード（カレンダー・エクスポート・設定等を日常導線から退避）
 */
export const NAV_ITEMS = [
  { href: "/", label: "ホーム", Icon: IconHome },
  { href: "/map", label: "マップ", Icon: IconMap },
  { href: "/records", label: "記録タイムライン", Icon: IconChat },
  { href: "/menu", label: "メニュー", Icon: IconGear },
] as const;

/** 後作業モードの二次導線（ドロワー・SideNav・/menuの「その他」セクション） */
export const SUB_NAV_ITEMS = [
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
