import Link from "next/link";
import { AppIcon } from "../../components/mobile/AppIcon";

export type MobileTab = "home" | "map" | "records" | "menu";

const text = {
  aria: "\u4e3b\u8981\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3",
  home: "\u30db\u30fc\u30e0",
  map: "\u30de\u30c3\u30d7",
  records: "\u8a18\u9332",
  menu: "\u30e1\u30cb\u30e5\u30fc",
};

const tabs: Array<{ key: MobileTab; label: string; href: string; icon: "home" | "map" | "pen" | "menu" }> = [
  { key: "home", label: text.home, href: "/", icon: "home" },
  { key: "map", label: text.map, href: "/map", icon: "map" },
  { key: "records", label: text.records, href: "/records", icon: "pen" },
  { key: "menu", label: text.menu, href: "/menu", icon: "menu" },
];

export function MobileBottomNav({ active = "map" }: { active?: MobileTab }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 h-[72px] border-t border-white/70 bg-white/95 shadow-[0_-10px_30px_rgba(17,24,20,0.08)] backdrop-blur-xl md:hidden" aria-label={text.aria}>
      <div className="grid h-full grid-cols-4 pb-2 pt-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link key={tab.href} href={tab.href} className={`flex flex-col items-center justify-center gap-1 text-[12px] leading-none no-underline ${isActive ? "font-extrabold text-[#2f8d41]" : "font-semibold text-[#687078]"}`}>
              <AppIcon name={tab.icon} className="h-[27px] w-[27px]" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
