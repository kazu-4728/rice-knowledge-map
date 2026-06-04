import { pointColor, type PointKind } from "../../lib/map/sampleMapData";

const text = {
  fieldA: "A\u7530",
  fieldB: "B\u7530",
  fieldC: "C\u7530",
  fieldD: "D\u7530",
  inlet: "\u5165\u6c34\u53e3",
  outlet: "\u51fa\u6c34\u53e3",
  alert: "\u6c34\u4f4d\u7570\u5e38",
};

type PinProps = {
  x: number;
  y: number;
  label: string;
  kind: PointKind;
};

function OverlayPin({ x, y, label, kind }: PinProps) {
  const color = pointColor(kind);
  const alert = kind === "alert";

  return (
    <div className="absolute z-20 flex items-center" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-9px, -26px)" }}>
      <svg viewBox="0 0 30 36" className="h-[37px] w-[31px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.32)]" aria-hidden="true">
        <path d="M15 2C8.8 2 4 6.8 4 13c0 8.3 11 21 11 21s11-12.7 11-21C26 6.8 21.2 2 15 2Z" fill={color} stroke="white" strokeWidth="2" />
        {alert ? <path d="M15 8v10M15 23v1" stroke="white" strokeLinecap="round" strokeWidth="3.2" /> : <circle cx="15" cy="13" r="4" fill="white" />}
      </svg>
      <span className="-ml-1 whitespace-nowrap rounded-[5px] border border-black/15 bg-white/95 px-2 py-1 text-[13px] font-extrabold leading-none text-black shadow-[0_3px_8px_rgba(0,0,0,0.22)]">
        {label}
      </span>
    </div>
  );
}

function FieldLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <span
      className="absolute z-20 min-w-[45px] rounded-[7px] border border-black/15 bg-white/95 px-[9px] py-[7px] text-center text-[19px] font-extrabold leading-none text-black shadow-[0_4px_12px_rgba(0,0,0,0.22)]"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      {label}
    </span>
  );
}

export function AerialVisualFallback() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#26391f]" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(104deg,transparent_0_47%,rgba(226,224,203,0.42)_47%_49%,transparent_49%_100%),linear-gradient(166deg,transparent_0_36%,rgba(232,231,207,0.36)_36%_38%,transparent_38%_100%),linear-gradient(83deg,transparent_0_61%,rgba(88,142,101,0.48)_61%_63%,transparent_63%_100%),repeating-linear-gradient(96deg,rgba(255,255,255,0.08)_0_2px,transparent_2px_13px),repeating-linear-gradient(4deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_18px),radial-gradient(circle_at_22%_18%,rgba(70,80,55,0.75),transparent_15%),radial-gradient(circle_at_68%_58%,rgba(86,136,52,0.72),transparent_25%),linear-gradient(135deg,#324926_0%,#20381f_30%,#536a32_52%,#2c4a22_74%,#1f3320_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[linear-gradient(28deg,transparent_0_20%,rgba(210,211,190,0.5)_20%_22%,transparent_22%_100%),linear-gradient(158deg,transparent_0_58%,rgba(215,216,195,0.45)_58%_60%,transparent_60%_100%)] opacity-70 mix-blend-screen" />
    </div>
  );
}

export function StaticMapOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <svg viewBox="0 0 430 520" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <polygon points="82,164 214,126 232,264 122,292" fill="rgba(78,169,219,0.48)" stroke="#6bc7f3" strokeWidth="3" />
        <polygon points="228,104 384,72 390,218 238,232" fill="rgba(224,200,60,0.53)" stroke="#e8c83f" strokeWidth="3" />
        <polygon points="222,254 388,234 374,446 218,421" fill="rgba(116,190,64,0.54)" stroke="#83d551" strokeWidth="3" />
        <polygon points="68,300 226,292 219,431 52,425" fill="rgba(154,122,201,0.5)" stroke="#a981d9" strokeWidth="3" />
      </svg>
      <FieldLabel x={38} y={40} label={text.fieldA} />
      <FieldLabel x={72} y={33} label={text.fieldB} />
      <FieldLabel x={69} y={62} label={text.fieldC} />
      <FieldLabel x={33} y={69} label={text.fieldD} />
      <OverlayPin x={15} y={41} label={text.inlet} kind="inlet" />
      <OverlayPin x={51} y={27} label={text.inlet} kind="inlet" />
      <OverlayPin x={84} y={39} label={text.outlet} kind="outlet" />
      <OverlayPin x={80} y={50} label={text.outlet} kind="outlet" />
      <OverlayPin x={51} y={51} label={text.alert} kind="alert" />
      <OverlayPin x={45} y={77} label={text.outlet} kind="outlet" />
      <OverlayPin x={7} y={77} label={text.outlet} kind="outlet" />
    </div>
  );
}
