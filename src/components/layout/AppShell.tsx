import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

type Props = {
  children: ReactNode;
  /** ヘッダーを非表示にする（マップ画面など） */
  hideHeader?: boolean;
};

export default function AppShell({ children, hideHeader = false }: Props) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden">
      {/* ヘッダー */}
      {!hideHeader && (
        <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* ロゴアイコン */}
            <span className="text-green-600 text-xl">🌾</span>
            <span className="text-green-700 font-bold text-base tracking-tight">みらい稲作管理</span>
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700" aria-label="通知">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </header>
      )}

      {/* コンテンツ */}
      <main className={`flex-1 min-h-0 ${hideHeader ? "overflow-hidden" : "overflow-y-auto pb-14"}`}>
        {children}
      </main>

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}
