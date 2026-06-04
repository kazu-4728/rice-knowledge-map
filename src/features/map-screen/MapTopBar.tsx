import { AppIcon } from "../../components/mobile/AppIcon";
import { RiceLogo } from "../../components/mobile/RiceLogo";

const text = {
  brand: "\u307f\u3089\u3044\u7a32\u4f5c\u7ba1\u7406",
  tagline: "\u5b9f\u753b\u50cf\u30de\u30c3\u30d7\u3067\u8a18\u9332\u3059\u308b",
  fieldList: "\u5703\u5834\u4e00\u89a7",
  notice: "\u901a\u77e5",
  filter: "\u30d5\u30a3\u30eb\u30bf\u30fc",
};

const chips = ["\u3059\u3079\u3066", "\u6c34\u53e3", "\u7570\u5e38", "\u5703\u5834"];

export function MapTopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 z-40 md:left-24 md:right-[344px] lg:left-28 lg:right-[420px]">
      <div className="pointer-events-auto rounded-2xl border border-white/75 bg-white/92 px-3 py-3 shadow-[0_14px_36px_rgba(17,24,20,0.16)] backdrop-blur-xl md:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <RiceLogo className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-extrabold leading-none text-[#2f8d41] md:text-[18px] lg:text-[19px]">{text.brand}</p>
              <p className="mt-1 hidden text-xs font-semibold text-[#617069] sm:block">{text.tagline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="hidden h-9 items-center gap-2 rounded-xl border border-[#bdddc2] bg-white px-3 text-[13px] font-extrabold text-[#1f6f30] shadow-sm lg:flex">
              <AppIcon name="list" className="h-4 w-4" />
              {text.fieldList}
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#27302c] shadow-sm" aria-label={text.notice}>
              <AppIcon name="bell" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip, index) => (
            <button
              key={chip}
              className={`h-9 shrink-0 rounded-full border px-4 text-[14px] font-extrabold leading-none ${
                index === 0 ? "border-[#2f8d41] bg-[#edf8ef] text-[#2f8d41]" : "border-[#d8ddda] bg-white text-[#2d3430]"
              }`}
            >
              {chip}
            </button>
          ))}
          <button className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d8ddda] bg-white px-4 text-[14px] font-extrabold text-[#2d3430]">
            <AppIcon name="filter" className="h-4 w-4" />
            {text.filter}
          </button>
        </div>
      </div>
    </header>
  );
}
