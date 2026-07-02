import type { SVGProps } from "react";

/**
 * アプリ共通のSVGアイコンセット。
 * 参照モックの線画アイコンに合わせ、stroke ベース（線幅1.8）で統一する。
 * 絵文字はマップピンなど一部を除き使用しない。
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 10.75 12 3l9 7.75" />
      <path d="M5.25 9.5V20a1 1 0 0 0 1 1H9.5v-5.25h5V21h3.25a1 1 0 0 0 1-1V9.5" />
    </Base>
  );
}

export function IconMap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4 3.6 5.8a1 1 0 0 0-.6 1V19.6a.6.6 0 0 0 .8.55L9 18.4l6 1.8 5.4-1.8a1 1 0 0 0 .6-.95V4.4a.6.6 0 0 0-.8-.55L15 5.6 9 4Z" />
      <path d="M9 4v14.4M15 5.6V20.2" />
    </Base>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m16.3 4.2 3.5 3.5L8.5 19l-4.6 1.1L5 15.5 16.3 4.2Z" />
      <path d="m14.5 6 3.5 3.5" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </Base>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.42V11a6 6 0 1 0-12 0v3.18a2 2 0 0 1-.6 1.42L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
    </Base>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 5 7 7-7 7" />
    </Base>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 19 8 12l7-7" />
    </Base>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21.5S5 15.6 5 10a7 7 0 1 1 14 0c0 5.6-7 11.5-7 11.5Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Base>
  );
}

export function IconPinFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 22S5 15.8 5 10a7 7 0 1 1 14 0c0 5.8-7 12-7 12Z" />
      <circle cx="12" cy="10" r="2.6" fill="white" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="5" width="16" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M4 10.5h16" />
    </Base>
  );
}

export function IconDrop(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5s6 6.2 6 10.3a6 6 0 1 1-12 0C6 9.7 12 3.5 12 3.5Z" />
    </Base>
  );
}

export function IconDropFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.8s6.6 6.8 6.6 11.3a6.6 6.6 0 1 1-13.2 0C5.4 9.6 12 2.8 12 2.8Z" />
    </svg>
  );
}

export function IconWaves(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 9.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
      <path d="M3 14.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
    </Base>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.5 2.8 19.5h18.4L12 4.5Z" />
      <path d="M12 10.5v3.5" />
      <circle cx="12" cy="16.8" r="0.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconWarningFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 3.7a1.2 1.2 0 0 0-2 0L1.9 18.6A1.2 1.2 0 0 0 3 20.5h18a1.2 1.2 0 0 0 1-1.9L13 3.7Z" />
      <path d="M12 9v5M12 16.6v.4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.2a7 7 0 0 1 14 0" />
    </Base>
  );
}

export function IconUserFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0Z" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
    </Base>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8.2h2.8L8.6 5.8h6.8l1.8 2.4H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.2a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </Base>
  );
}

export function IconMic(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </Base>
  );
}

export function IconPlayFill(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.5v13a.7.7 0 0 0 1.06.6l10.3-6.5a.7.7 0 0 0 0-1.2L9.06 4.9A.7.7 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m16.2 16.2 4.3 4.3" />
    </Base>
  );
}

export function IconFunnel(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5h16l-6.2 7.2V18l-3.6 2v-7.8L4 5Z" />
    </Base>
  );
}

export function IconSliders(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 8h6M15 8h4M5 16h2M11 16h8" />
      <circle cx="13" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </Base>
  );
}

export function IconListBullet(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.8" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="4.8" cy="12" r="0.5" fill="currentColor" />
      <circle cx="4.8" cy="17.5" r="0.5" fill="currentColor" />
    </Base>
  );
}

export function IconLocate(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14" />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Base>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5.5" y="4.5" width="13" height="17" rx="2" />
      <path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 10h6M9 13.5h6M9 17h3.5" />
    </Base>
  );
}

export function IconDocDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L13.5 3Z" />
      <path d="M13.5 3v5h5M12 11v6m0 0-2.4-2.4M12 17l2.4-2.4" />
    </Base>
  );
}

export function IconGear(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </Base>
  );
}

export function IconCloudCheck(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 18.5a4.5 4.5 0 0 1-.7-8.95A6 6 0 0 1 18 10.2a4.15 4.15 0 0 1-.7 8.3H7Z" />
      <path d="m9.2 14 2 2 3.8-3.8" />
    </Base>
  );
}

export function IconChat(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.8 0-1.6-.1-2.3-.3L5 20.5l.9-3.3c-1.8-1.4-2.9-3.4-2.9-5.7 0-4.3 4-8 9-8Z" />
    </Base>
  );
}

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

export function IconMore(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}

export function IconMoreVertical(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  );
}

export function IconExpand(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </Base>
  );
}

export function IconFieldGrid(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 12h17M12 5.5v13" />
    </Base>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" fill="#FBBF24" stroke="#F59E0B" />
      <g stroke="#F59E0B">
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
      </g>
    </Base>
  );
}

export function IconSprout(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3.5-2.5-6-6.5-6.5C6 11.5 8.5 14 12 14Z" />
      <path d="M12 11.5c0-3 2.2-5.2 5.8-5.7-.4 3.5-2.6 5.7-5.8 5.7Z" />
    </Base>
  );
}

/** 参照モックのロゴ（稲穂＋緑の葉） */
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
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth ?? 1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
