import type { ReactNode } from "react";
import Link from "next/link";
import BottomNav from "./BottomNav";
import HeaderAccountChip from "./HeaderAccountChip";
import BackButton from "./BackButton";
import WeatherHeader from "../ui/WeatherHeader";
import { IconChevronLeft, LogoRice } from "../ui/icons";

type Props = {
  children: ReactNode;
  /** マップ画面などコンテンツをスクロールさせない場合 true */
  fullBleed?: boolean;
  /** 戻るリンク先（指定するとヘッダー左に「← ラベル」表示） */
  backHref?: string;
  /** 戻るボタンのラベル（省略時は「戻る」） */
  backLabel?: string;
  /** true にすると router.back() で戻る動的バックボタンを表示（backHref より優先） */
  backDynamic?: boolean;
};

/** モック共通のヘッダー（中央ロゴ＋右ログイン状態）と下部ナビを持つ画面シェル */
export default function AppShell({ children, fullBleed = false, backHref, backLabel = "戻る", backDynamic }: Props) {
  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-gradient-to-b from-green-50 to-gray-100 relative overflow-hidden print:block print:h-auto print:overflow-visible">
      <header className="relative flex items-center justify-center h-14 bg-white shrink-0 border-b border-gray-100 print:hidden">
        {backDynamic && <BackButton label={backLabel} />}
        {!backDynamic && backHref && (
          <Link
            href={backHref}
            className="absolute left-2 flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50 active:bg-green-100"
          >
            <IconChevronLeft className="h-4.5 w-4.5" />
            {backLabel}
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          <LogoRice className="w-7 h-7" />
          <span className="text-green-700 font-bold text-lg tracking-tight">みらい稲作管理</span>
        </div>
        <HeaderAccountChip />
      </header>
      <div className="print:hidden">
        <WeatherHeader />
      </div>

      <main
        className={`flex-1 min-h-0 ${fullBleed ? "overflow-hidden relative" : "overflow-y-auto"} print:overflow-visible print:min-h-0`}
      >
        {children}
      </main>

      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
