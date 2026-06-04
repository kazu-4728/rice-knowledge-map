import Link from "next/link";
import { AppIcon } from "../../components/mobile/AppIcon";
import type { MobileTab } from "./MobileBottomNav";

const text = {
  aria: "\u4e3b\u8981\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3",
  home: "\u30db\u30fc\u30e0",
  map: "\u30de\u30c3\u30d7",
  records: "\u8a18\u9332",
  menu: "\u30e1\u30cb\u30e5\u30fc",
};

type Item = {
  key: MobileTab;
  label: string;
  href: string;
  icon: "home" | "map" | "pen" | "menu";
};

const items: Item[] = [
  { key: "home", label: text.home, href: "/", icon: "home" },
  { key: "map", label: text.map, href: "/map", icon: "map" },
  { key: "records", label: text.records, href: "/records", icon: "pen" },
  { key: "menu", label: text.menu, href: "/menu", icon: "menu" },
];

export function DesktopRail({ active = "map" }: { active?: MobileTab }) {
  return (
    <nav className="absolute bottom-4 left-4 top-4 z-40 hidden w-20 rounded-3xl border border-white/70 bg-white/90 px-2 py-5 shadow-[0_14px_40px_rgba(17,24,20,0.14)] backdrop-blur-xl md:block" aria-label={text.aria}>
      <div className="flex h-full flex-col items-center gap-4">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex h-[68px] w-full flex-col items-center justify-center gap-1 rounded-2xl text-[12px] font-bold ${
              isActive ? "bg-[#edf8ef] text-[#2f8d41]" : "text-[#67716d] hover:bg-white"
            }`}
          >
            <AppIcon name={item.icon} className="h-6 w-6" />
            {item.label}
          </Link>
          );
        })}
      </div>
    </nav>
  );
}
