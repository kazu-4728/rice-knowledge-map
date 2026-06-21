"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconMap, IconPencil, IconMenu, IconCalendar } from "../ui/icons";

const tabs = [
  { key: "home",     label: "ホーム",   href: "/home",     Icon: IconHome     },
  { key: "map",      label: "マップ",   href: "/map",      Icon: IconMap      },
  { key: "records",  label: "記録",     href: "/records",  Icon: IconPencil   },
  { key: "calendar", label: "予定",     href: "/calendar", Icon: IconCalendar },
  { key: "menu",     label: "メニュー", href: "/menu",     Icon: IconMenu     },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/map") return null;

  return (
    <nav className="shrink-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      {/* PC幅でタブ間隔が間延びしないよう中央寄せキャップ。モバイル列幅はそのまま */}
      <div className="flex h-16 mx-auto w-full max-w-md">
        {tabs.map(({ key, label, href, Icon }) => {
          const active = href === "/home"
            ? pathname === "/home" || pathname.startsWith("/fields")
            : pathname === href || (href !== "/home" && pathname.startsWith(href));
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
