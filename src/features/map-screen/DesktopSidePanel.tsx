import { AppIcon } from "../../components/mobile/AppIcon";

const text = {
  aria: "\u9078\u629e\u5730\u70b9\u306e\u8a73\u7d30",
  title: "A\u7530 \u6771\u5074 \u5165\u6c34\u53e3",
  status: "\u826f\u597d",
  note: "\u6c34\u4f4d\u306f\u6b63\u5e38\u3002\u6b21\u56de\u306f\u5915\u65b9\u306b\u518d\u78ba\u8a8d\u3002",
  lastRecord: "\u6700\u7d42\u8a18\u9332",
  date: "2025\u5e745\u670824\u65e5 08:15",
  field: "\u5703\u5834",
  fieldValue: "A\u7530 1.2ha",
  place: "\u5730\u70b9",
  placeValue: "\u6771\u5074 \u5165\u6c34\u53e3",
  photoRecord: "\u5199\u771f\u3067\u8a18\u9332",
  voiceMemo: "\u97f3\u58f0\u30e1\u30e2",
  record: "\u8a18\u9332\u3059\u308b",
};

export function DesktopSidePanel() {
  return (
    <aside
      className="absolute bottom-6 right-5 top-6 z-40 hidden w-[320px] rounded-[28px] border border-white/70 bg-white/94 p-5 shadow-[0_16px_44px_rgba(17,24,20,0.16)] backdrop-blur-xl md:block lg:right-6 lg:w-[384px]"
      aria-label={text.aria}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f3ff] text-[#2479cf]">
          <AppIcon name="map" className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[22px] font-extrabold leading-tight">{text.title}</h2>
            <span className="rounded-lg border border-[#9dcc9f] bg-[#eef8ec] px-2.5 py-1 text-[13px] font-extrabold leading-none text-[#2d8d3a]">{text.status}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#64716b]">{text.note}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 rounded-2xl border border-[#e1e8e3] bg-white p-4">
        <div className="flex justify-between text-sm">
          <span className="font-bold text-[#64716b]">{text.lastRecord}</span>
          <span className="font-extrabold">{text.date}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold text-[#64716b]">{text.field}</span>
          <span className="font-extrabold">{text.fieldValue}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold text-[#64716b]">{text.place}</span>
          <span className="font-extrabold">{text.placeValue}</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-[#f7fbf7] text-[14px] font-extrabold text-[#1f6f30]">
          <AppIcon name="camera" className="h-5 w-5" />
          {text.photoRecord}
        </button>
        <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-white text-[14px] font-extrabold text-[#1f6f30]">
          <AppIcon name="mic" className="h-5 w-5" />
          {text.voiceMemo}
        </button>
      </div>
      <button className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2f8d41] text-[16px] font-extrabold text-white shadow-[0_12px_24px_rgba(47,141,65,0.24)]">
        <AppIcon name="pen" className="h-5 w-5" />
        {text.record}
      </button>
    </aside>
  );
}
