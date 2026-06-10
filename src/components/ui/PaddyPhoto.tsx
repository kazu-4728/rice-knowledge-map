import { IconPlayFill } from "./icons";

/**
 * 実写真が入るまでのプレースホルダー。
 * 朝の田園風景（空・山並み・水鏡の田・若苗の列）をSVGで描く。
 * 実運用ではカメラ撮影画像（Supabase Storage）に置き換わる。
 */

type Variant = "field" | "water" | "grass" | "sprout";

export function PaddyPhoto({
  variant = "field",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const id = `pp-${variant}`;
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* 朝空 */}
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FA8D6" />
          <stop offset="0.55" stopColor="#A8CCE6" />
          <stop offset="0.85" stopColor="#E8E9D8" />
          <stop offset="1" stopColor="#F4ECCF" />
        </linearGradient>
        {/* 朝日のグロー */}
        <radialGradient id={`${id}-sun`} cx="0.72" cy="0.95" r="0.55">
          <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#FFE9A8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
        {/* 水鏡（空を映す） */}
        <linearGradient id={`${id}-mirror`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9E4C8" />
          <stop offset="0.45" stopColor="#BCD3DE" />
          <stop offset="1" stopColor="#8FB4C9" />
        </linearGradient>
        {/* 苗の緑 */}
        <linearGradient id={`${id}-rice`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9CC36B" />
          <stop offset="1" stopColor="#5E9A4C" />
        </linearGradient>
        <linearGradient id={`${id}-rice2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB05B" />
          <stop offset="1" stopColor="#46823E" />
        </linearGradient>
        {/* 用水路の水 */}
        <linearGradient id={`${id}-flow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9CFDE" />
          <stop offset="1" stopColor="#6FA3BC" />
        </linearGradient>
      </defs>

      {/* 空 */}
      <rect width="400" height="118" fill={`url(#${id}-sky)`} />
      <rect width="400" height="118" fill={`url(#${id}-sun)`} />

      {/* 雲 */}
      <g fill="#FFFFFF" opacity="0.75">
        <ellipse cx="80" cy="38" rx="44" ry="9" />
        <ellipse cx="108" cy="32" rx="30" ry="7" />
        <ellipse cx="288" cy="22" rx="52" ry="8" />
        <ellipse cx="318" cy="28" rx="30" ry="6" />
      </g>

      {/* 遠景の山並み（霞がかった層） */}
      <path
        d="M0 96 Q46 70 92 86 T182 78 T272 88 T352 74 T400 84 V120 H0 Z"
        fill="#7E97B8"
        opacity="0.8"
      />
      <path
        d="M0 106 Q60 88 124 100 T250 96 T400 100 V124 H0 Z"
        fill="#5F7E9C"
        opacity="0.75"
      />

      {/* 山裾の樹林帯 */}
      <path
        d="M0 118 Q50 110 100 115 T200 112 T300 116 T400 112 V128 H0 Z"
        fill="#3E6B47"
      />
      {/* 家屋のシルエット */}
      <g fill="#54716B" opacity="0.9">
        <path d="M52 112 l7 -6 7 6 v7 h-14 Z" />
        <path d="M330 110 l6 -5 6 5 v8 h-12 Z" />
      </g>

      {/* 田面（水鏡ベース） */}
      <rect y="126" width="400" height="134" fill={`url(#${id}-mirror)`} />

      {/* 苗の列（奥行きのある水平バンド＋水鏡の隙間） */}
      <g>
        <path d="M0 134 H400 V139 H0 Z" fill={`url(#${id}-rice)`} opacity="0.85" />
        <path d="M0 144 H400 V151 H0 Z" fill={`url(#${id}-rice2)`} opacity="0.9" />
        <path d="M0 158 H400 V167 H0 Z" fill={`url(#${id}-rice)`} />
        <path d="M0 176 H400 V188 H0 Z" fill={`url(#${id}-rice2)`} />
        <path d="M0 200 H400 V216 H0 Z" fill={`url(#${id}-rice)`} />
        <path d="M0 230 H400 V252 H0 Z" fill={`url(#${id}-rice2)`} />
      </g>

      {/* 水面の朝日の反射 */}
      <path d="M250 126 L320 260 H230 L210 126 Z" fill="#FFEFBE" opacity="0.22" />

      {/* 苗の質感（短い縦線） */}
      <g stroke="#2F5E33" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
        {[14, 52, 96, 138, 186, 232, 278, 322, 366].map((x) => (
          <path key={x} d={`M${x} 212 v-9 M${x + 16} 208 v-7 M${x + 30} 213 v-8`} />
        ))}
      </g>
      <g stroke="#37683B" strokeWidth="2.2" strokeLinecap="round" opacity="0.6">
        {[8, 64, 124, 188, 248, 312, 368].map((x) => (
          <path key={x} d={`M${x} 248 v-13 M${x + 20} 244 v-10 M${x + 38} 249 v-12`} />
        ))}
      </g>

      {variant === "water" && (
        <>
          {/* コンクリート用水路と流れ */}
          <path d="M168 126 L120 260 H280 L232 126 Z" fill="#B9BDB9" />
          <path d="M178 126 L140 260 H260 L222 126 Z" fill={`url(#${id}-flow)`} />
          <g stroke="#F1F8FB" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M188 150 Q200 146 212 150" />
            <path d="M180 182 Q200 176 220 182" />
            <path d="M170 220 Q200 212 230 220" />
            <path d="M163 248 Q200 240 237 248" />
          </g>
          <g fill="#FFFFFF" opacity="0.55">
            <ellipse cx="200" cy="166" rx="10" ry="2.5" />
            <ellipse cx="194" cy="202" rx="13" ry="3" />
            <ellipse cx="206" cy="236" rx="16" ry="3.5" />
          </g>
        </>
      )}

      {variant === "grass" && (
        <>
          {/* 畦の草むら */}
          <path d="M0 252 Q100 238 200 248 T400 246 V260 H0 Z" fill="#3C7038" />
          <g stroke="#2E5C2C" strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
            <path d="M36 252 q-4 -16 -10 -22 M44 253 q0 -18 5 -26 M54 252 q4 -14 11 -19" />
            <path d="M180 250 q-4 -15 -10 -20 M188 251 q0 -17 5 -24 M198 250 q4 -13 10 -18" />
            <path d="M320 250 q-4 -16 -10 -21 M328 251 q0 -18 5 -25 M338 250 q4 -14 10 -19" />
          </g>
        </>
      )}

      {variant === "sprout" && (
        // 補植直後の若苗を強調
        <g stroke="#D8F0C0" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
          {[70, 150, 230, 310].map((x) => (
            <path
              key={x}
              d={`M${x} 196 q-5 -14 -12 -18 M${x} 196 q0 -17 1 -21 M${x} 196 q5 -13 12 -17`}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/** 記録一覧などのサムネイル。音声記録は波形＋再生ボタン表示にする */
export function RecordThumb({
  media,
  variant = "field",
  duration,
  className = "",
}: {
  media: "photo" | "audio";
  variant?: Variant;
  duration?: string;
  className?: string;
}) {
  if (media === "audio") {
    return (
      <div className={`relative overflow-hidden bg-gray-800 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center gap-[3px] px-3 opacity-90">
          {[5, 9, 14, 8, 16, 11, 18, 9, 13, 7, 15, 10, 6].map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-green-400" style={{ height: `${h * 2}px` }} />
          ))}
        </div>
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
          <IconPlayFill className="h-3.5 w-3.5 translate-x-[1px] text-gray-800" />
        </span>
        {duration && (
          <span className="absolute bottom-1 right-1.5 text-[10px] font-semibold text-white/90">{duration}</span>
        )}
      </div>
    );
  }
  return (
    <div className={`overflow-hidden ${className}`}>
      <PaddyPhoto variant={variant} className="h-full w-full" />
    </div>
  );
}
