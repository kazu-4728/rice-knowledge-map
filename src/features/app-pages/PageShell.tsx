import { AppIcon } from "../../components/mobile/AppIcon";
import { RiceLogo } from "../../components/mobile/RiceLogo";
import type { ReactNode } from "react";
import { AerialVisualFallback } from "../map-screen/StaticMapOverlay";
import { DesktopRail } from "../map-screen/DesktopRail";
import { MobileBottomNav, type MobileTab } from "../map-screen/MobileBottomNav";

const text = {
  brand: "\u307f\u3089\u3044\u7a32\u4f5c\u7ba1\u7406",
  notice: "\u901a\u77e5",
};

type Props = {
  active: MobileTab;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function PageShell({ active, title, subtitle, children }: Props) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#27351f] text-[#101412]">
      <AerialVisualFallback />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(244,247,245,0.86),rgba(244,247,245,0.72)_28%,rgba(25,45,29,0.25)_100%)]" />
      <DesktopRail active={active} />
      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-4 pb-[92px] pt-4 md:pl-[112px] md:pr-5 md:pb-6">
        <header className="mb-4 flex items-center justify-between rounded-[24px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_14px_36px_rgba(17,24,20,0.14)] backdrop-blur-xl md:mb-5 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <RiceLogo className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-extrabold leading-none text-[#2f8d41] md:text-[20px]">{text.brand}</p>
              <p className="mt-1 truncate text-[12px] font-bold text-[#617069] md:text-[13px]">{subtitle}</p>
            </div>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#26302b] shadow-sm" aria-label={text.notice}>
            <AppIcon name="bell" className="h-5 w-5" />
          </button>
        </header>
        <div className="mb-4 flex items-end justify-between gap-3 md:mb-5">
          <div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-normal md:text-[36px]">{title}</h1>
          </div>
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </section>
      <MobileBottomNav active={active} />
    </main>
  );
}
