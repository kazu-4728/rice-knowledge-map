import type { JSX, SVGProps } from "react";
import {
  Home,
  Map,
  Pencil,
  Menu,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Droplet,
  Waves as LucideWaves,
  User,
  Users,
  Camera,
  Mic,
  Search,
  SlidersHorizontal,
  List,
  LocateFixed,
  Plus,
  Minus,
  Check,
  Clipboard,
  FileDown,
  Settings,
  MessageCircle,
  MoreVertical as LucideMoreVertical,
  Maximize2,
  LayoutGrid,
  Sprout as LucideSprout,
  X,
  Trash2,
  Tractor,
  Droplets,
  Leaf,
  Sun,
  Wheat,
  Moon,
  Snowflake,
  Share2,
} from "lucide-react";
import type { SeasonIconKey } from "../../lib/season";

/**
 * アプリ共通アイコンセット。
 * 汎用の線画アイコンは lucide-react に委譲する（stroke 1.8 で統一）。
 * 「Fill」系（信号色の強調表示に使う塗りつぶし+白抜き細部のあるもの）と
 * ブランドロゴは lucide に相当品がないため自作SVGのまま維持する。
 */

type IconProps = SVGProps<SVGSVGElement>;

export function IconHome(props: IconProps) {
  return <Home strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconMap(props: IconProps) {
  return <Map strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconPencil(props: IconProps) {
  return <Pencil strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconMenu(props: IconProps) {
  return <Menu strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconChevronRight(props: IconProps) {
  return <ChevronRight strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconChevronLeft(props: IconProps) {
  return <ChevronLeft strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconPin(props: IconProps) {
  return <MapPin strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** ピンの塗りつぶし版（中央の白抜き穴が特徴。lucideに相当品がないため自作を維持） */
export function IconPinFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 22S5 15.8 5 10a7 7 0 1 1 14 0c0 5.8-7 12-7 12Z" />
      <circle cx="12" cy="10" r="2.6" fill="white" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return <Calendar strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconDrop(props: IconProps) {
  return <Droplet strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 水滴の塗りつぶし版（lucideのDropletを塗りで代用） */
export function IconDropFill(props: IconProps) {
  return <Droplet fill="currentColor" stroke="none" aria-hidden="true" {...props} />;
}

export function IconWaves(props: IconProps) {
  return <LucideWaves strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 警告三角の塗りつぶし版（「!」の白抜きが特徴のため自作を維持） */
export function IconWarningFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 3.7a1.2 1.2 0 0 0-2 0L1.9 18.6A1.2 1.2 0 0 0 3 20.5h18a1.2 1.2 0 0 0 1-1.9L13 3.7Z" />
      <path d="M12 9v5M12 16.6v.4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return <User strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/**
 * 人物アイコンの塗りつぶし版。lucideのUserは胴体パスが閉じておらず
 * fill指定しても頭の丸だけしか表示されないため、独自SVGを維持する
 */
export function IconUserFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0Z" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return <Users strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconCamera(props: IconProps) {
  return <Camera strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconMic(props: IconProps) {
  return <Mic strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 再生ボタンの塗りつぶし三角形（独自の三角形パスを維持） */
export function IconPlayFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.5v13a.7.7 0 0 0 1.06.6l10.3-6.5a.7.7 0 0 0 0-1.2L9.06 4.9A.7.7 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return <Search strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconSliders(props: IconProps) {
  return <SlidersHorizontal strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconListBullet(props: IconProps) {
  return <List strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconLocate(props: IconProps) {
  return <LocateFixed strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconPlus(props: IconProps) {
  return <Plus strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconMinus(props: IconProps) {
  return <Minus strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconCheck(props: IconProps) {
  return <Check strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconClipboard(props: IconProps) {
  return <Clipboard strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconShare(props: IconProps) {
  return <Share2 strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconDocDown(props: IconProps) {
  return <FileDown strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconGear(props: IconProps) {
  return <Settings strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconChat(props: IconProps) {
  return <MessageCircle strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 吹き出しの塗りつぶし版（中の白い3点が特徴のため自作を維持） */
export function IconCommentFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3.5c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.8 0-1.6-.1-2.3-.3L5 20.5l.9-3.3c-1.8-1.4-2.9-3.4-2.9-5.7 0-4.3 4-8 9-8Z" />
      <circle cx="8.5" cy="11.2" r="1" fill="white" />
      <circle cx="12" cy="11.2" r="1" fill="white" />
      <circle cx="15.5" cy="11.2" r="1" fill="white" />
    </svg>
  );
}

export function IconMoreVertical(props: IconProps) {
  return <LucideMoreVertical fill="currentColor" strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconExpand(props: IconProps) {
  return <Maximize2 strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconFieldGrid(props: IconProps) {
  return <LayoutGrid strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconSprout(props: IconProps) {
  return <LucideSprout strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 参照モックのロゴ（稲穂＋緑の葉）。lucideに相当品がないため自作を維持 */
export function LogoRice(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      {/* 葉 */}
      <path
        d="M15 28C7.5 26.5 4 20.5 4.5 13.5 11 15 14.6 19.5 15.4 25"
        fill="#3B8C3F"
      />
      <path
        d="M16.5 27.5c-1-6.5 1.5-12 8-15 .8 7-1.5 12.5-7 15"
        fill="#5CA84D"
      />
      {/* 穂軸 */}
      <path d="M16 26C16 16 18 9 22.5 4" stroke="#C9952C" strokeWidth="1.6" strokeLinecap="round" />
      {/* 籾 */}
      <ellipse cx="22.8" cy="5.2" rx="1.7" ry="2.6" transform="rotate(38 22.8 5.2)" fill="#E8B23A" />
      <ellipse cx="19.6" cy="7.6" rx="1.6" ry="2.5" transform="rotate(58 19.6 7.6)" fill="#E8B23A" />
      <ellipse cx="25.4" cy="8.4" rx="1.6" ry="2.5" transform="rotate(20 25.4 8.4)" fill="#E8B23A" />
      <ellipse cx="18.6" cy="11.2" rx="1.5" ry="2.4" transform="rotate(64 18.6 11.2)" fill="#DFA830" />
      <ellipse cx="24.2" cy="12 " rx="1.5" ry="2.4" transform="rotate(24 24.2 12)" fill="#DFA830" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return <X strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconTrash(props: IconProps) {
  return <Trash2 strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconTractor(props: IconProps) {
  return <Tractor strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconDroplets(props: IconProps) {
  return <Droplets strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconLeaf(props: IconProps) {
  return <Leaf strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconSun(props: IconProps) {
  return <Sun strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconWheat(props: IconProps) {
  return <Wheat strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconMoon(props: IconProps) {
  return <Moon strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function IconSnowflake(props: IconProps) {
  return <Snowflake strokeWidth={1.8} aria-hidden="true" {...props} />;
}

/** 農事暦フェーズのアイコン種別→アイコンのマッピング（season.tsのiconKeyに対応） */
export const SEASON_ICONS: Record<SeasonIconKey, (props: IconProps) => JSX.Element> = {
  tractor: IconTractor,
  droplets: IconDroplets,
  sprout: IconSprout,
  leaf: IconLeaf,
  sun: IconSun,
  wheat: IconWheat,
  moon: IconMoon,
  snowflake: IconSnowflake,
};
