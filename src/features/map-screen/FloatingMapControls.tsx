import { AppIcon } from "../../components/mobile/AppIcon";

export function FloatingMapControls() {
  return (
    <div className="absolute right-4 top-[39%] z-30 grid justify-items-center gap-3 md:right-[344px] lg:right-[424px]">
      <button className="grid h-[51px] w-[51px] place-items-center rounded-full bg-white text-[#343b38] shadow-[0_10px_28px_rgba(17,24,20,0.18)]" aria-label="現在地">
        <AppIcon name="target" className="h-7 w-7" />
      </button>
      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(17,24,20,0.18)]">
        <button className="grid h-[47px] w-[51px] place-items-center border-0 bg-transparent text-[31px] leading-none" aria-label="拡大">+</button>
        <div className="mx-auto h-px w-[30px] bg-[#d6d8d7]" />
        <button className="grid h-[47px] w-[51px] place-items-center border-0 bg-transparent text-[31px] leading-none" aria-label="縮小">-</button>
      </div>
    </div>
  );
}
