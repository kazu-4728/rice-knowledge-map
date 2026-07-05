"use client";

import { cn } from "@/lib/utils";

export type PlotGlowField = {
  id: string;
  name: string;
  status: "normal" | "needs_check" | "issue";
};

const STATUS_COLOR: Record<PlotGlowField["status"], { fill: string; stroke: string }> = {
  normal: { fill: "#22C55E", stroke: "#4ADE80" },
  needs_check: { fill: "#EAB308", stroke: "#FACC15" },
  issue: { fill: "#EF4444", stroke: "#F87171" },
};

/**
 * 田んぼの状態一覧を信号色ポリゴンで俯瞰表示するヒーロー。
 * ランディングの MapMockup（固定座標のSVGパッチワーク）を、実データ件数に応じて
 * グリッド状に自動レイアウトする実戦投入版。
 */
export function PlotGlowMap({
  fields,
  onSelect,
  className,
}: {
  fields: PlotGlowField[];
  onSelect?: (fieldId: string) => void;
  className?: string;
}) {
  if (fields.length === 0) return null;

  const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(fields.length))));
  const rows = Math.ceil(fields.length / cols);
  const cellW = 400 / cols;
  const pad = 6;

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-[#101a14]", className)}>
      <svg
        viewBox={`0 0 400 ${rows * 60 + 20}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="田んぼの状態一覧"
      >
        <rect width="400" height={rows * 60 + 20} fill="#131f17" />
        {fields.map((f, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const rowH = 60;
          const x = col * cellW + pad;
          const y = row * rowH + pad + 10;
          const w = cellW - pad * 2;
          const h = rowH - pad * 2;
          const skew = (i % 2 === 0 ? 1 : -1) * 1.5;
          const color = STATUS_COLOR[f.status];
          const points = `${x},${y + skew} ${x + w},${y} ${x + w},${y + h} ${x},${y + h - skew}`;
          return (
            <g
              key={f.id}
              onClick={() => onSelect?.(f.id)}
              className={onSelect ? "cursor-pointer" : undefined}
            >
              <polygon points={points} fill={color.fill} opacity="0.28" />
              <polygon points={points} fill="none" stroke={color.stroke} strokeWidth="2.5" opacity="0.9" />
              {f.status === "issue" && (
                <circle cx={x + w / 2} cy={y + h / 2} r="6" fill="#EF4444" opacity="0.35">
                  <animate attributeName="r" values="5;11;5" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={x + w / 2}
                y={y + h / 2 + 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#ffffff"
                opacity="0.9"
              >
                {f.name.length > 6 ? `${f.name.slice(0, 6)}…` : f.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
