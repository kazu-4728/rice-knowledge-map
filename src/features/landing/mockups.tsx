"use client";

/**
 * ランディングページ用のアプリUIモックアップ集。
 * 外部画像に依存せず、実際のアプリ（ダーク管制室マップ・トーク・管理）の
 * 見た目をCSS/SVGで再現する。実写が読み込めない環境でもリッチに見せる要。
 */

/** ダーク管制室マップのミニチュア（ヒーロー・機能紹介で使用） */
export function MapMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#101a14] ${className}`}>
      {/* 航空写真風の下地（暗いパッチワーク） */}
      <svg viewBox="0 0 400 720" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="720" fill="#131f17" />
        <g opacity="0.5">
          <rect x="-20" y="40" width="190" height="150" fill="#1a2a1e" transform="rotate(-3 75 115)" />
          <rect x="180" y="10" width="240" height="170" fill="#16241a" transform="rotate(2 300 95)" />
          <rect x="-30" y="200" width="230" height="190" fill="#182920" transform="rotate(-1 85 295)" />
          <rect x="210" y="190" width="220" height="180" fill="#1b2b1d" transform="rotate(3 320 280)" />
          <rect x="-10" y="400" width="200" height="180" fill="#15231a" transform="rotate(2 90 490)" />
          <rect x="200" y="380" width="230" height="200" fill="#192a1f" transform="rotate(-2 315 480)" />
          <rect x="-20" y="590" width="440" height="160" fill="#141f16" />
        </g>
        {/* 農道 */}
        <path d="M0 380 Q 200 360 400 390" stroke="#2a3a2e" strokeWidth="10" fill="none" />
        <path d="M195 0 Q 205 360 185 720" stroke="#26352a" strokeWidth="8" fill="none" />

        {/* 発光ポリゴン（信号色） */}
        <g>
          <polygon points="40,90 165,80 175,175 55,190" fill="#22C55E" opacity="0.28" />
          <polygon points="40,90 165,80 175,175 55,190" fill="none" stroke="#4ADE80" strokeWidth="3.5" opacity="0.9" />
          <polygon points="225,110 360,95 370,200 240,215" fill="#EAB308" opacity="0.26" />
          <polygon points="225,110 360,95 370,200 240,215" fill="none" stroke="#FACC15" strokeWidth="3.5" opacity="0.95" />
          <polygon points="55,235 180,225 190,330 70,345" fill="#EF4444" opacity="0.26" />
          <polygon points="55,235 180,225 190,330 70,345" fill="none" stroke="#F87171" strokeWidth="3.5" opacity="0.95" />
          <polygon points="235,250 365,240 375,350 250,365" fill="#3B82F6" opacity="0.24" />
          <polygon points="235,250 365,240 375,350 250,365" fill="none" stroke="#60A5FA" strokeWidth="3.5" opacity="0.9" />
        </g>
        {/* 異常ピン */}
        <g transform="translate(115 265)">
          <circle r="14" fill="#EF4444" opacity="0.25">
            <animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <path d="M0 -12 C 7 -12 11 -6 11 -1 C 11 6 0 16 0 16 C 0 16 -11 6 -11 -1 C -11 -6 -7 -12 0 -12 Z" fill="#EF4444" />
          <circle cy="-2" r="4" fill="white" />
        </g>
      </svg>

      {/* 検索ピル */}
      <div className="absolute inset-x-3 top-3 flex items-center gap-2 rounded-full glass-dark-strong px-3 py-2.5">
        <span className="text-emerald-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        </span>
        <span className="text-[11px] font-semibold text-white/85">田んぼをさがす</span>
      </div>

      {/* サマリーシート */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl glass-dark-strong px-4 pb-4 pt-2.5">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/30" />
        <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
          <span className="whitespace-nowrap text-xl font-bold leading-none text-white">
            4<span className="ml-1 text-[10px] font-semibold text-white/70">枚の田んぼ</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-red-400/30 bg-red-400/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
            <span className="h-1 w-1 rounded-full bg-red-500" />気になる 3
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2.5">
          <span className="text-base">⚠️</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-white">未対応を確認する（3件）</span>
            <span className="block truncate text-[9px] text-white/60">まずは「東の田」から</span>
          </span>
        </div>
      </div>

      {/* FAB（シートに被らない高さに置く） */}
      <div className="absolute bottom-[36%] right-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_4px_20px_rgba(34,197,94,0.55)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
      </div>
    </div>
  );
}

/** スマホフレーム（中に各モックアップを入れる）。components/ui/PhoneFrame.tsx へ昇格済み、ここではre-exportのみ */
export { PhoneFrame } from "../../components/ui/PhoneFrame";
