import { AppIcon } from "../../components/mobile/AppIcon";

const text = {
  aria: "\u9078\u629e\u5730\u70b9\u306e\u8a73\u7d30",
  title: "A\u7530 \u6771\u5074 \u5165\u6c34\u53e3",
  status: "\u826f\u597d",
  lastRecord: "\u6700\u7d42\u8a18\u9332",
  date: "2025\u5e745\u670824\u65e5 08:15",
  waterLevel: "\u6c34\u4f4d",
  normal: "\u6b63\u5e38",
  photoRecord: "\u5199\u771f\u3067\u8a18\u9332",
  record: "\u8a18\u9332\u3059\u308b",
};

export function MobileBottomSheet() {
  return (
    <section
      className="absolute inset-x-0 bottom-[72px] z-40 rounded-t-[28px] border border-b-0 border-white/70 bg-white/96 px-5 pb-4 pt-2 shadow-[0_-18px_42px_rgba(17,24,20,0.18)] backdrop-blur-xl md:hidden"
      aria-label={text.aria}
    >
      <div className="mx-auto mb-3 h-1 w-14 rounded-full bg-[#c6cbc8]" />
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e8f3ff] text-[#2479cf]">
          <AppIcon name="map" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[20px] font-extrabold leading-none">{text.title}</h2>
            <span className="rounded-md border border-[#9dcc9f] bg-[#eef8ec] px-2 py-1 text-[12px] font-extrabold leading-none text-[#2d8d3a]">{text.status}</span>
          </div>
          <div className="mt-2 grid gap-1.5 text-[13px] leading-none text-[#303833]">
            <div>
              <span className="mr-3 inline-block min-w-[62px] text-[#59615d]">{text.lastRecord}</span>
              {text.date}
            </div>
            <div>
              <span className="mr-3 inline-block min-w-[62px] text-[#1f78cf]">{text.waterLevel}</span>
              {text.normal}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-[#f7fbf7] text-[14px] font-extrabold text-[#1f6f30]">
          <AppIcon name="camera" className="h-[19px] w-[19px]" />
          {text.photoRecord}
        </button>
        <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2f8d41] text-[14px] font-extrabold text-white shadow-[0_9px_18px_rgba(47,141,65,0.24)]">
          <AppIcon name="pen" className="h-[19px] w-[19px]" />
          {text.record}
        </button>
      </div>
    </section>
  );
}
