import { AppIcon } from "../../components/mobile/AppIcon";
import { pointColor } from "../../lib/map/sampleMapData";

function SheetPin() {
  return (
    <svg viewBox="0 0 30 36" className="h-[39px] w-[33px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]" aria-hidden="true">
      <path d="M15 2C8.8 2 4 6.8 4 13c0 8.3 11 21 11 21s11-12.7 11-21C26 6.8 21.2 2 15 2Z" fill={pointColor("inlet")} stroke="white" strokeWidth="2" />
      <circle cx="15" cy="13" r="4" fill="white" />
    </svg>
  );
}

export function PointBottomSheet() {
  return (
    <section className="absolute inset-x-0 bottom-0 z-30 rounded-t-[25px] border border-b-0 border-black/10 bg-white/98 px-[22px] pb-[13px] pt-[9px] shadow-[0_-16px_38px_rgba(0,0,0,0.16)]" aria-label="選択地点の詳細">
      <div className="mx-auto mb-3 h-1 w-[55px] rounded-full bg-[#c8c8c8]" />
      <div className="mb-[13px] grid grid-cols-[39px_1fr] gap-[11px]">
        <SheetPin />
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2.5">
            <h2 className="m-0 truncate text-[20px] font-extrabold leading-none">A田 東側 入水口</h2>
            <span className="rounded-md border border-[#9dcc9f] bg-[#eef8ec] px-[9px] py-1 text-[13px] font-extrabold leading-none text-[#2d8d3a]">良好</span>
          </div>
          <div className="grid gap-[7px] text-[13px] leading-none text-[#303833]">
            <div><span className="mr-3 inline-block min-w-[62px] text-[#59615d]">最終記録</span>2025年5月24日 08:15</div>
            <div><span className="mr-3 inline-block min-w-[62px] text-[#1f78cf]">水位</span>正常</div>
          </div>
        </div>
      </div>
      <div className="mb-[11px] grid grid-cols-2 gap-3">
        <button className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#b8d7bd] bg-[#f7fbf7] text-[14px] font-extrabold text-[#1f6f30]">
          <AppIcon name="camera" className="h-[19px] w-[19px]" />
          写真で記録
        </button>
        <button className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#b8d7bd] bg-white text-[14px] font-extrabold text-[#1f6f30]">
          <AppIcon name="mic" className="h-[19px] w-[19px]" />
          音声メモ
        </button>
      </div>
      <div className="grid grid-cols-[0.95fr_1.05fr] gap-3.5">
        <button className="flex h-[43px] items-center justify-center gap-2 rounded-lg border border-[#9ba1a3] bg-white text-[16px] font-extrabold text-[#222]">
          <AppIcon name="file" className="h-[18px] w-[18px]" />
          詳細
        </button>
        <button className="flex h-[43px] items-center justify-center gap-2 rounded-lg border border-[#2f8d41] bg-[#2f8d41] text-[16px] font-extrabold text-white shadow-[0_9px_18px_rgba(47,141,65,0.24)]">
          <AppIcon name="pen" className="h-[19px] w-[19px]" />
          記録する
        </button>
      </div>
    </section>
  );
}
