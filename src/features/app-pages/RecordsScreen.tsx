import { AppIcon } from "../../components/mobile/AppIcon";
import { PageShell } from "./PageShell";

const text = {
  title: "\u8a18\u9332",
  subtitle: "\u7530\u3093\u307c\u306e\u5909\u5316\u3092\u5730\u56f3\u3068\u3064\u306a\u3052\u308b",
  search: "\u30ad\u30fc\u30ef\u30fc\u30c9\u3067\u691c\u7d22",
  filter: "\u7d5e\u308a\u8fbc\u307f",
  today: "2025\u5e745\u670824\u65e5",
  yesterday: "2025\u5e745\u670823\u65e5",
  water: "\u6c34\u7ba1\u7406",
  work: "\u4f5c\u696d",
  photo: "\u5199\u771f",
  voice: "\u97f3\u58f0",
  detail: "\u8a73\u7d30",
  focus: "\u5730\u56f3\u3067\u898b\u308b",
  fieldCode: "A\u7530",
};

const chips = ["\u3059\u3079\u3066", text.photo, text.voice, text.work, text.water];

const groups = [
  {
    date: text.today,
    records: [
      { time: "17:15", title: "A\u7530 \u53d6\u6c34\u53e3\u306e\u78ba\u8a8d", meta: "A\u7530 1.2ha", tag: text.water, icon: "map" as const, tone: "text-[#2479cf]" },
      { time: "13:30", title: "C\u7530 \u7566\u7554\u8349\u5208\u308a", meta: "C\u7530 1.5ha", tag: text.work, icon: "pen" as const, tone: "text-[#2f8d41]" },
      { time: "10:15", title: "B\u7530 \u6c34\u4f4d\u7570\u5e38\u306e\u8a18\u9332", meta: "B\u7530 0.8ha", tag: "\u8981\u78ba\u8a8d", icon: "filter" as const, tone: "text-[#d43d35]" },
      { time: "08:00", title: "A\u7530 \u5712\u5834\u306e\u72b6\u6cc1\u30e1\u30e2", meta: "A\u7530 1.2ha", tag: text.voice, icon: "mic" as const, tone: "text-[#2f8d41]" },
    ],
  },
  {
    date: text.yesterday,
    records: [
      { time: "16:20", title: "B\u7530 \u843d\u6c34\u53e3\u306e\u78ba\u8a8d", meta: "B\u7530 0.8ha", tag: text.water, icon: "map" as const, tone: "text-[#2479cf]" },
      { time: "11:40", title: "A\u7530 \u7566\u7554\u8349\u5208\u308a", meta: "A\u7530 1.2ha", tag: text.work, icon: "pen" as const, tone: "text-[#2f8d41]" },
    ],
  },
];

export function RecordsScreen() {
  return (
    <PageShell active="records" title={text.title} subtitle={text.subtitle}>
      <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-[30px] border border-white/75 bg-white/88 p-4 shadow-[0_18px_46px_rgba(17,24,20,0.14)] backdrop-blur-xl md:p-5">
          <div className="flex gap-3">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#dfe7e2] bg-white px-4 shadow-sm">
              <AppIcon name="filter" className="h-5 w-5 shrink-0 text-[#68756f]" />
              <input className="min-w-0 flex-1 bg-transparent text-[15px] font-bold outline-none placeholder:text-[#8a9690]" placeholder={text.search} />
            </label>
            <button className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#dfe7e2] bg-white text-[#26302b] shadow-sm" aria-label={text.filter}>
              <AppIcon name="list" className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((chip, index) => (
              <button key={chip} className={`h-9 shrink-0 rounded-full border px-4 text-[14px] font-extrabold ${index === 0 ? "border-[#2f8d41] bg-[#edf8ef] text-[#2f8d41]" : "border-[#d8ddda] bg-white text-[#2d3430]"}`}>
                {chip}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-6">
            {groups.map((group) => (
              <section key={group.date}>
                <h2 className="mb-3 text-[20px] font-extrabold">{group.date}</h2>
                <div className="overflow-hidden rounded-[24px] border border-[#e1e8e3] bg-white/95 shadow-[0_10px_30px_rgba(17,24,20,0.08)]">
                  {group.records.map((record) => (
                    <article key={`${group.date}-${record.time}`} className="grid grid-cols-[50px_72px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#e8eee9] px-3 py-3 last:border-b-0 md:grid-cols-[56px_90px_minmax(0,1fr)_auto] md:px-4">
                      <time className="text-[14px] font-extrabold text-[#2b332f]">{record.time}</time>
                      <div className="relative h-14 overflow-hidden rounded-xl bg-[linear-gradient(140deg,#7da86b,#314b27_55%,#a5c685)] shadow-inner">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(94deg,rgba(255,255,255,0.18)_0_2px,transparent_2px_10px)]" />
                        <div className="absolute inset-x-0 bottom-0 h-5 bg-black/12" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <AppIcon name={record.icon} className={`h-5 w-5 shrink-0 ${record.tone}`} />
                          <h3 className="truncate text-[16px] font-extrabold md:text-[18px]">{record.title}</h3>
                        </div>
                        <p className="mt-1 text-[13px] font-bold text-[#67736d]">{record.meta}</p>
                      </div>
                      <span className="hidden rounded-lg bg-[#edf8ef] px-2.5 py-1 text-[12px] font-extrabold text-[#2f8d41] sm:inline-flex">{record.tag}</span>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="hidden rounded-[30px] border border-white/75 bg-white/88 p-5 shadow-[0_18px_46px_rgba(17,24,20,0.14)] backdrop-blur-xl lg:block">
          <div className="relative h-56 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#344f2a,#20341f_45%,#789344)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(96deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_15px)]" />
            <div className="absolute left-[20%] top-[25%] h-[42%] w-[54%] rotate-[-8deg] rounded-2xl border-2 border-[#6bc7f3] bg-[#4ea9db]/45" />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/92 px-4 py-3 shadow-lg">
              <p className="text-[18px] font-extrabold">{text.fieldCode}</p>
              <p className="text-[13px] font-bold text-[#64716b]">{text.focus}</p>
            </div>
          </div>
          <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2f8d41] text-[15px] font-extrabold text-white">
            <AppIcon name="map" className="h-5 w-5" />
            {text.focus}
          </button>
        </aside>
      </div>
    </PageShell>
  );
}
