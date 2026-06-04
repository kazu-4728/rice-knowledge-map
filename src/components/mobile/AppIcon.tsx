type IconName =
  | "bell"
  | "camera"
  | "file"
  | "filter"
  | "home"
  | "list"
  | "map"
  | "menu"
  | "mic"
  | "pen"
  | "target";

type Props = {
  name: IconName;
  className?: string;
};

export function AppIcon({ name, className = "h-6 w-6" }: Props) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.15,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "bell") return <svg {...common}><path d="M15 17H5l1.3-1.4c.4-.4.7-1 .7-1.6v-3a5 5 0 0 1 10 0v3c0 .6.2 1.2.7 1.6L19 17h-4Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  if (name === "camera") return <svg {...common}><path d="M7 7.5 8.5 5h7L17 7.5h2.5v12h-15v-12H7Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;
  if (name === "file") return <svg {...common}><path d="M6 4h12v16H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  if (name === "filter") return <svg {...common}><path d="M4 5h16l-6.5 7.5V18L10 20v-7.5L4 5Z" /></svg>;
  if (name === "home") return <svg {...common}><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M6 10.5V20h5v-5h4v5h5v-9.5" /></svg>;
  if (name === "list") return <svg {...common}><path d="M4 5h16M4 12h16M4 19h16" /><path d="M8 5v14" /></svg>;
  if (name === "map") return <svg {...common}><path d="M3.5 6.5 9 4l6 2.5L20.5 4v15.5L15 22l-6-2.5-5.5 2.5V6.5Z" /><path d="M9 4v15.5M15 6.5V22" /></svg>;
  if (name === "menu") return <svg {...common}><path d="M5 7h14M5 12h14M5 17h14" /></svg>;
  if (name === "mic") return <svg {...common}><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" /><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v3" /></svg>;
  if (name === "pen") return <svg {...common}><path d="m5 19 3.8-.8L18.6 8.4a2 2 0 0 0-2.8-2.8L6 15.2 5 19Z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
}
