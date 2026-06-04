import { pointColor, type PointKind } from "../../lib/map/sampleMapData";

const rows: Array<{ label: string; kind: PointKind }> = [
  { label: "入水口", kind: "inlet" },
  { label: "出水口", kind: "outlet" },
  { label: "異常箇所", kind: "alert" },
];

function LegendPin({ kind }: { kind: PointKind }) {
  const alert = kind === "alert";

  return (
    <svg viewBox="0 0 30 36" className="h-[37px] w-[31px]" aria-hidden="true">
      <path d="M15 2C8.8 2 4 6.8 4 13c0 8.3 11 21 11 21s11-12.7 11-21C26 6.8 21.2 2 15 2Z" fill={pointColor(kind)} stroke="white" strokeWidth="2" />
      {alert ? <path d="M15 8v10M15 23v1" stroke="white" strokeLinecap="round" strokeWidth="3.2" /> : <circle cx="15" cy="13" r="4" fill="white" />}
    </svg>
  );
}

export function MapLegend() {
  return (
    <div className="absolute left-4 top-[132px] z-30 grid min-w-[132px] gap-[9px] rounded-[16px] border border-white/70 bg-white/92 px-[14px] py-[11px] text-[14px] font-extrabold shadow-[0_10px_28px_rgba(17,24,20,0.14)] backdrop-blur-xl md:left-28 md:top-36">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <LegendPin kind={row.kind} />
          {row.label}
        </div>
      ))}
    </div>
  );
}
