import Link from "next/link";
import { AppIcon } from "../../components/mobile/AppIcon";
import { PageShell } from "./PageShell";

const text = {
  title: "\u30db\u30fc\u30e0",
  subtitle: "\u4eca\u65e5\u306e\u5730\u56f3\u3068\u8a18\u9332\u5c0e\u7dda",
  focus: "\u4eca\u65e5\u306e\u91cd\u70b9\u30dd\u30a4\u30f3\u30c8",
  field: "A\u7530 \u6771\u5074 \u5165\u6c34\u53e3",
  status: "\u826f\u597d",
  memo: "\u6c34\u4f4d\u306f\u6b63\u5e38\u3002\u5915\u65b9\u306b\u3082\u3046\u4e00\u5ea6\u78ba\u8a8d\u3002",
  map: "\u30de\u30c3\u30d7\u3092\u958b\u304f",
  photo: "\u5199\u771f\u3067\u8a18\u9332",
  voice: "\u97f3\u58f0\u30e1\u30e2",
  recent: "\u6700\u8fd1\u306e\u8a18\u9332",
  viewAll: "\u3059\u3079\u3066\u898b\u308b",
  water: "\u53d6\u6c34\u53e3\u306e\u78ba\u8a8d",
  weed: "\u7566\u7554\u8349\u5208\u308a",
  alert: "\u6c34\u4f4d\u7570\u5e38\u306e\u30e1\u30e2",
};

const records = [
  { time: "08:15", title: text.water, meta: "A\u7530 / \u6c34\u7ba1\u7406", tone: "text-[#2479cf]" },
  { time: "13:30", title: text.weed, meta: "C\u7530 / \u4f5c\u696d", tone: "text-[#2f8d41]" },
  { time: "17:10", title: text.alert, meta: "B\u7530 / \u8981\u78ba\u8a8d", tone: "text-[#d43d35]" },
];

export function HomeScreen() {
  return (
    <PageShell active="home" title={text.title} subtitle={text.subtitle}>
      <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/70 bg-white/76 shadow-[0_18px_46px_rgba(17,24,20,0.16)] backdrop-blur-xl md:min-h-[560px]">
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(54,112,54,0.26),transparent_42%),linear-gradient(28deg,transparent_0_46%,rgba(225,226,206,0.5)_46%_48%,transparent_48%),repeating-linear-gradient(96deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_15px),linear-gradient(135deg,#445f2d,#263f22_38%,#66883d_70%,#243a22)]" />
          <div className="absolute left-[8%] top-[28%] h-[34%] w-[44%] rotate-[-9deg] rounded-[18px] border-2 border-[#6bc7f3] bg-[#4ea9db]/45 shadow-[0_12px_30px_rgba(0,0,0,0.18)]" />
          <div className="absolute right-[11%] top-[17%] h-[32%] w-[37%] rotate-[-7deg] rounded-[16px] border-2 border-[#e8c83f] bg-[#dfc83e]/55 shadow-[0_12px_30px_rgba(0,0,0,0.18)]" />
          <div className="absolute bottom-[12%] right-[12%] h-[34%] w-[42%] rotate-[5deg] rounded-[20px] border-2 border-[#83d551] bg-[#74be40]/50 shadow-[0_12px_30px_rgba(0,0,0,0.18)]" />
          <div className="absolute inset-x-4 bottom-4 rounded-[28px] border border-white/80 bg-white/92 p-4 shadow-[0_18px_48px_rgba(17,24,20,0.2)] backdrop-blur-xl md:inset-x-6 md:bottom-6 md:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f3ff] text-[#2479cf]">
                <AppIcon name="map" className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[22px] font-extrabold leading-tight">{text.field}</h2>
                  <span className="rounded-lg border border-[#9dcc9f] bg-[#eef8ec] px-2.5 py-1 text-[13px] font-extrabold leading-none text-[#2d8d3a]">{text.status}</span>
                </div>
                <p className="mt-2 text-[14px] font-semibold leading-relaxed text-[#596862]">{text.memo}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/map" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2f8d41] text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(47,141,65,0.24)]">
                <AppIcon name="map" className="h-5 w-5" />
                {text.map}
              </Link>
              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-white text-[15px] font-extrabold text-[#1f6f30]">
                <AppIcon name="camera" className="h-5 w-5" />
                {text.photo}
              </button>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="rounded-[28px] border border-white/75 bg-white/88 p-4 shadow-[0_14px_36px_rgba(17,24,20,0.12)] backdrop-blur-xl">
            <h2 className="text-[18px] font-extrabold">{text.focus}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-[#f7fbf7] text-[#1f6f30]">
                <AppIcon name="camera" className="h-7 w-7" />
                <span className="text-[14px] font-extrabold">{text.photo}</span>
              </button>
              <button className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[#b8d7bd] bg-white text-[#1f6f30]">
                <AppIcon name="mic" className="h-7 w-7" />
                <span className="text-[14px] font-extrabold">{text.voice}</span>
              </button>
            </div>
          </section>
          <section className="rounded-[28px] border border-white/75 bg-white/90 p-4 shadow-[0_14px_36px_rgba(17,24,20,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold">{text.recent}</h2>
              <Link href="/records" className="text-[13px] font-extrabold text-[#2f8d41]">{text.viewAll}</Link>
            </div>
            <div className="mt-3 divide-y divide-[#e3e9e5]">
              {records.map((record) => (
                <Link key={record.title} href="/records" className="flex items-center gap-3 py-3 text-[#101412]">
                  <time className="w-11 shrink-0 text-[13px] font-extrabold text-[#64716b]">{record.time}</time>
                  <AppIcon name="pen" className={`h-5 w-5 shrink-0 ${record.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-extrabold">{record.title}</p>
                    <p className="mt-1 truncate text-[12px] font-bold text-[#6d7772]">{record.meta}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
