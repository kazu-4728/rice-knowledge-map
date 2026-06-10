"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconMap, IconPencil, IconMenu } from "../ui/icons";

const tabs = [
  { key: "home", label: "ホーム", href: "/", Icon: IconHome },
  { key: "map", label: "マップ", href: "/map", Icon: IconMap },
  { key: "records", label: "記録", href: "/records", Icon: IconPencil },
  { key: "menu", label: "メニュー", href: "/menu", Icon: IconMenu },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16">
        {tabs.map(({ key, label, href, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 text-[11px] font-medium ${
                active ? "text-green-700" : "text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.1 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
