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

/** 統合トークルームのミニチュア（PR-2で実装する画面のプレビュー） */
export function TalkMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden bg-[#f4f6f2] ${className}`}>
      <div className="flex items-center gap-2 bg-green-800 px-3 py-2.5">
        <span className="text-[11px] font-bold text-white">🌾 家族のトーク</span>
        <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white/85">3人</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-end gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">父</span>
          <div className="max-w-[75%]">
            <div className="overflow-hidden rounded-2xl rounded-bl-sm bg-white shadow-sm">
              <div className="flex h-14 items-center justify-center bg-gradient-to-br from-emerald-200 via-lime-100 to-emerald-300 text-2xl">📷</div>
              <div className="px-2.5 py-1.5">
                <span className="mr-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">🌾 東の田</span>
                <span className="text-[10px] text-gray-700">畦に崩れあり。見ておいて</span>
              </div>
            </div>
            <span className="ml-1 text-[8px] text-gray-400">6:12</span>
          </div>
        </div>
        <div className="flex items-end justify-end gap-1.5">
          <span className="mr-1 text-[8px] text-gray-400">6:40</span>
          <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-green-600 px-2.5 py-1.5 text-[10px] leading-relaxed text-white shadow-sm">
            了解。夕方見てくる 👍
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">母</span>
          <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-white px-2.5 py-1.5 text-[10px] text-gray-700 shadow-sm">
            <span className="mr-1 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">💧 西の田</span>
            水位はちょうどいいよ
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2">
        <span className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] text-gray-400">メッセージ...</span>
        <span className="text-base">🎤</span>
        <span className="text-base">📷</span>
      </div>
    </div>
  );
}

/** 管理ダッシュボードのミニチュア */
export function DashboardMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden bg-gray-50 ${className}`}>
      <div className="bg-green-800 px-3 py-2.5 text-[11px] font-bold text-white">管理</div>
      <div className="space-y-2 p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { v: "4", l: "田んぼ", c: "text-gray-900" },
            { v: "1", l: "異常", c: "text-red-500" },
            { v: "2", l: "要確認", c: "text-amber-500" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white p-2 text-center shadow-sm">
              <p className={`text-lg font-bold leading-none ${s.c}`}>{s.v}</p>
              <p className="mt-1 text-[8px] font-semibold text-gray-500">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <p className="text-[9px] font-bold text-gray-500">農事暦</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-sm">☀️</span>
            <span className="text-[10px] font-bold text-gray-800">いまは「中干し」の時期</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {["bg-emerald-400", "bg-red-400", "bg-amber-400", "bg-emerald-400"].map((c, i) => (
            <div key={i} className={`h-7 rounded-lg ${c} opacity-80`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 「今日の田んぼ」ストーリーのミニチュア */
export function StoryMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col overflow-hidden bg-gradient-to-b from-[#12241a] via-[#0e1c14] to-black ${className}`}>
      <div className="flex gap-1 p-2.5">
        <div className="h-0.5 flex-1 rounded-full bg-white" />
        <div className="h-0.5 flex-1 rounded-full bg-white/60" />
        <div className="h-0.5 flex-1 rounded-full bg-white/25" />
        <div className="h-0.5 flex-1 rounded-full bg-white/25" />
      </div>
      <div className="mt-auto p-4">
        <p className="text-[10px] font-semibold text-white/75">おはようございます</p>
        <p className="mt-0.5 text-lg font-bold text-white">7月2日(木)</p>
        <p className="mt-1 text-[11px] font-semibold text-white/85">くもり時々晴れ 29° / 22°</p>
        <div className="mt-2.5 rounded-xl glass-dark p-2.5">
          <p className="text-[11px] font-bold text-white">☀️ いまは「中干し」の時期</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-1/3 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** スマホフレーム（中に各モックアップを入れる） */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19] overflow-hidden rounded-[2.4rem] border-[6px] border-black bg-black shadow-[0_24px_80px_-16px_rgba(0,0,0,0.75)] ring-1 ring-white/15 ${className}`}
    >
      {/* ノッチ */}
      <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">{children}</div>
    </div>
  );
}
