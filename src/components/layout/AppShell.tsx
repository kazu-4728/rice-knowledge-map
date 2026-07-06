"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import HeaderAccountChip from "./HeaderAccountChip";
import BackButton from "./BackButton";
import MenuDrawer from "./MenuDrawer";
import SideNav from "./SideNav";
import { useDrawer } from "./DrawerContext";
import WeatherHeader from "../ui/WeatherHeader";
import { IconChevronLeft, IconMenu, LogoRice } from "../ui/icons";

type Props = {
  children: ReactNode;
  fullBleed?: boolean;
  backHref?: string;
  backLabel?: string;
  backDynamic?: boolean;
  showHeader?: boolean;
};

export default function AppShell({
  children,
  fullBleed = false,
  backHref,
  backLabel = "戻る",
  backDynamic,
  showHeader = true,
}: Props) {
  const { drawerOpen, setDrawerOpen } = useDrawer();

  return (
    <div className="flex h-dvh w-full print:block print:h-auto">
      {/* PC left sidebar (lg+) */}
      <SideNav />

      {/* main column */}
      <div
        className={`flex flex-1 min-w-0 flex-col ${fullBleed ? "" : "mx-auto max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl"} bg-gradient-to-b from-green-50 to-gray-100 relative overflow-hidden print:block print:h-auto print:overflow-visible`}
      >
        {showHeader && (
          <>
            <header className="relative flex items-center justify-center h-14 bg-green-800 shrink-0 print:hidden">
              {backDynamic && <BackButton label={backLabel} className="text-white hover:bg-white/10 active:bg-white/15" />}
              {!backDynamic && backHref && (
                <Link
                  href={backHref}
                  className="absolute left-2 flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-white hover:bg-white/10 active:bg-white/15"
                >
                  <IconChevronLeft className="h-4.5 w-4.5" />
                  {backLabel}
                </Link>
              )}
              {/* mobile menu起動ボタン — on right when back button present, on left otherwise; hidden on lg+
                  常設ボトムタブは導入せず、必要な時に呼び出すオンデマンド型を維持しつつ、
                  タップ領域を広げ・ガラス質感のピルにして発見しやすく・押しやすくする */}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="メニューを開く"
                className={`absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all active:scale-95 active:bg-white/25 lg:hidden ${backDynamic || backHref ? "right-11" : "left-2"}`}
              >
                <IconMenu className="h-5.5 w-5.5" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95">
                  <LogoRice className="w-5 h-5" />
                </span>
                <span className="text-white font-bold text-lg tracking-tight">
                  みらい稲作管理
                </span>
              </div>
              <HeaderAccountChip hasBack={!!(backDynamic || backHref)} />
            </header>
            <div className="print:hidden">
              <WeatherHeader />
            </div>
          </>
        )}

        <main
          className={`flex-1 min-h-0 ${fullBleed ? "overflow-hidden relative" : "overflow-y-auto"} print:overflow-visible print:min-h-0`}
        >
          {children}
        </main>
      </div>

      {/* mobile drawer */}
      <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
