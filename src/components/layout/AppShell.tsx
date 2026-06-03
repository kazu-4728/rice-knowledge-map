import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

type Props = {
  children: ReactNode;
  hideHeader?: boolean;
  /** マップ画面など: main を flex-col overflow-hidden にする */
  mapMode?: boolean;
};

export default function AppShell({ children, hideHeader = false, mapMode = false }: Props) {
  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-[#F3F4F0] relative overflow-hidden">

      {/* ヘッダー（3カラム・中央寄せ） */}
      {!hideHeader && (
        <header className="flex items-center h-14 bg-white border-b border-gray-100 shrink-0 px-4">
          {/* 左スペーサー */}
          <div className="w-10" />
          {/* 中央: ロゴ + テキスト */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {/* 稲穂SVGロゴ */}
            <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
              {/* 茎 */}
              <path d="M14 24 L14 8" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round"/>
              {/* 左穂 */}
              <ellipse cx="10" cy="10" rx="2.5" ry="4" fill="#EAB308" transform="rotate(-25 10 10)"/>
              <ellipse cx="8"  cy="14" rx="2"   ry="3.5" fill="#EAB308" transform="rotate(-20 8 14)"/>
              {/* 右穂 */}
              <ellipse cx="18" cy="10" rx="2.5" ry="4" fill="#EAB308" transform="rotate(25 18 10)"/>
              <ellipse cx="20" cy="14" rx="2"   ry="3.5" fill="#EAB308" transform="rotate(20 20 14)"/>
              {/* 頂穂 */}
              <ellipse cx="14" cy="7" rx="1.8" ry="3.5" fill="#EAB308"/>
            </svg>
            <span className="text-[18px] font-bold text-green-700 tracking-tight">みらい稲作管理</span>
          </div>
          {/* 右: ベルアイコン */}
          <div className="w-10 flex justify-end">
            <button className="p-1 text-gray-500" aria-label="通知">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* コンテンツ */}
      <main className={
        mapMode
          ? "flex-1 flex flex-col min-h-0 overflow-hidden pb-16"
          : "flex-1 overflow-y-auto pb-16"
      }>
        {children}
      </main>

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}
