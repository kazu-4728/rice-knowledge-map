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

export const NAV_ITEMS = [
  { href: "/map", label: "マップ", Icon: IconMap },
  { href: "/home", label: "状況", Icon: IconHome },
  { href: "/records", label: "記録一覧", Icon: IconPencil },
  { href: "/fields", label: "田んぼ一覧", Icon: IconFieldGrid },
  { href: "/calendar", label: "カレンダー", Icon: IconCalendar },
  { href: "/export", label: "エクスポート", Icon: IconDocDown },
  { href: "/guide", label: "使い方", Icon: IconSprout },
  { href: "/menu", label: "設定", Icon: IconGear },
] as const;

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(href + "/");
}
