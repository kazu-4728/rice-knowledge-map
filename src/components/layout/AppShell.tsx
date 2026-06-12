import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import HeaderAccountChip from "./HeaderAccountChip";
import { LogoRice } from "../ui/icons";

type Props = {
  children: ReactNode;
  /** マップ画面などコンテンツをスクロールさせない場合 true */
  fullBleed?: boolean;
};

/** モック共通のヘッダー（中央ロゴ＋右ログイン状態）と下部ナビを持つ画面シェル */
export default function AppShell({ children, fullBleed = false }: Props) {
  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-gray-100 relative overflow-hidden">
      <header className="relative flex items-center justify-center h-14 bg-white shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <LogoRice className="w-7 h-7" />
          <span className="text-green-700 font-bold text-lg tracking-tight">みらい稲作管理</span>
        </div>
        <HeaderAccountChip />
      </header>

      <main
        className={`flex-1 min-h-0 ${fullBleed ? "overflow-hidden relative" : "overflow-y-auto"}`}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
