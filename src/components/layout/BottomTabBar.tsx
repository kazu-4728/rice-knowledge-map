"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "./navItems";

/**
 * 常設ボトムタブバー（再設計フェーズ5「入り口は下部タブ4つのみ」の実体）。
 * モバイルで常時表示し、ホーム・マップ・記録タイムライン・メニューへ
 * どの画面からも1タップで移動できるようにする。PC（lg+）はSideNavが担う。
 */
export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインタブ"
      className="shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-bold transition-colors ${
                active ? "text-green-700" : "text-gray-400"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.1 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
