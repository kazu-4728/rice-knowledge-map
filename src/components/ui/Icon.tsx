export type IconName =
  | "bell"
  | "calendar"
  | "camera"
  | "cloud"
  | "drop"
  | "edit"
  | "field"
  | "filter"
  | "home"
  | "image"
  | "map"
  | "menu"
  | "mic"
  | "pin"
  | "search"
  | "settings"
  | "sprout"
  | "users"
  | "warning"
  | "waves";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

const paths: Record<IconName, string[]> = {
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z", "M10 21a3 3 0 0 0 4 0"],
  calendar: ["M7 3v4M17 3v4", "M4 8h16", "M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"],
  camera: ["M4 8h4l2-3h4l2 3h4v11H4V8Z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  cloud: ["M7 18h10a4 4 0 0 0 1-7 6 6 0 0 0-11-2 5 5 0 0 0 0 9Z", "M9 13l2 2 4-5"],
  drop: ["M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z"],
  edit: ["M4 20h4l11-11-4-4L4 16v4Z", "M14 6l4 4"],
  field: ["M4 5h16v14H4V5Z", "M4 11h16", "M10 5v14", "M14 5v14"],
  filter: ["M4 5h16l-6 7v6l-4 2v-8L4 5Z"],
  home: ["M3 11l9-8 9 8", "M5 10v10h5v-6h4v6h5V10"],
  image: ["M4 5h16v14H4V5Z", "M7 15l3-3 3 3 2-2 3 3", "M8 9h.01"],
  map: ["M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z", "M9 4v14", "M15 6v14"],
  menu: ["M5 7h14", "M5 12h14", "M5 17h14"],
  mic: ["M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z", "M5 11a7 7 0 0 0 14 0", "M12 18v3"],
  pin: ["M12 21s7-5 7-12a7 7 0 0 0-14 0c0 7 7 12 7 12Z", "M12 11h.01"],
  search: ["M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z", "M15 15l5 5"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M4 12h2M18 12h2M12 4v2M12 18v2"],
  sprout: ["M12 20V9", "M12 10C8 6 5 6 3 7c1 4 4 6 9 3Z", "M12 12c4-5 8-5 10-4-1 5-5 7-10 4Z"],
  users: ["M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M16 11a3 3 0 1 0 0-6", "M2 21a6 6 0 0 1 12 0", "M14 18a5 5 0 0 1 8 3"],
  warning: ["M12 3 22 20H2L12 3Z", "M12 9v5", "M12 17h.01"],
  waves: ["M3 8c3 2 6 2 9 0s6-2 9 0", "M3 13c3 2 6 2 9 0s6-2 9 0", "M3 18c3 2 6 2 9 0s6-2 9 0"],
};

export function Icon({ name, size = 24, className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
