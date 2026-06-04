import { AppIcon } from "../../components/mobile/AppIcon";
import { PageShell } from "./PageShell";

const text = {
  title: "\u30e1\u30cb\u30e5\u30fc",
  subtitle: "\u5bb6\u65cf\u3068\u7530\u3093\u307c\u3092\u7ba1\u7406\u3059\u308b",
  sync: "\u540c\u671f\u72b6\u614b",
  syncBody: "\u3059\u3079\u3066\u306e\u8a18\u9332\u306f\u6700\u65b0\u3067\u3059",
  backup: "\u6700\u7d42\u30d0\u30c3\u30af\u30a2\u30c3\u30d7",
  backupAt: "2025\u5e745\u670824\u65e5 08:30",
  members: "\u5bb6\u65cf\u30fb\u4f5c\u696d\u8005",
  points: "\u56fa\u5b9a\u30dd\u30a4\u30f3\u30c8\u7ba1\u7406",
  fields: "\u7530\u3093\u307c\u4e00\u89a7",
  notifications: "\u901a\u77e5\u8a2d\u5b9a",
  export: "\u30c7\u30fc\u30bf\u51fa\u529b",
  settings: "\u30a2\u30d7\u30ea\u8a2d\u5b9a",
  admin: "\u7ba1\u7406\u8005",
  editor: "\u7de8\u96c6\u8005",
  viewer: "\u95b2\u89a7\u8005",
  inlet: "\u5165\u6c34\u53e3",
  outlet: "\u51fa\u6c34\u53e3",
  alert: "\u6ce8\u610f\u7b87\u6240",
};

const members = [
  { name: "\u7530\u4e2d \u592a\u90ce\uff08\u3042\u306a\u305f\uff09", role: text.admin },
  { name: "\u7530\u4e2d \u82b1\u5b50", role: text.editor },
  { name: "\u7530\u4e2d \u6b21\u90ce", role: text.viewer },
];

const rows = [
  { label: text.fields, value: "42\u679a", icon: "map" as const },
  { label: text.notifications, value: "", icon: "bell" as const },
  { label: text.export, value: "", icon: "file" as const },
  { label: text.settings, value: "", icon: "menu" as const },
];

export function MenuScreen() {
  return (
    <PageShell active="menu" title={text.title} subtitle={text.subtitle}>
      <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid min-w-0 content-start gap-4">
          <div className="rounded-[30px] border border-white/75 bg-white/88 p-5 shadow-[0_18px_46px_rgba(17,24,20,0.14)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-[#e7f7ee] text-[#2f8d41] shadow-inner">
                <AppIcon name="target" className="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[18px] font-extrabold">{text.sync}</h2>
                <p className="mt-1 text-[14px] font-bold text-[#64716b]">{text.syncBody}</p>
              </div>
              <div className="hidden border-l border-[#dde6e0] pl-5 text-right sm:block">
                <p className="text-[12px] font-bold text-[#64716b]">{text.backup}</p>
                <p className="mt-1 text-[15px] font-extrabold">{text.backupAt}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_18px_46px_rgba(17,24,20,0.12)] backdrop-blur-xl">
            <h2 className="text-[20px] font-extrabold">{text.members}</h2>
            <div className="mt-4 divide-y divide-[#e5ece7] overflow-hidden rounded-2xl border border-[#e5ece7] bg-white/82">
              {members.map((member) => (
                <button key={member.name} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dcf1df] text-[#2f8d41]">
                    <AppIcon name="home" className="h-5 w-5" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[16px] font-extrabold">{member.name}</span>
                  <span className="rounded-lg bg-[#edf8ef] px-2.5 py-1 text-[12px] font-extrabold text-[#2f8d41]">{member.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_18px_46px_rgba(17,24,20,0.12)] backdrop-blur-xl">
            <h2 className="text-[20px] font-extrabold">{text.points}</h2>
            <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#e5ece7] bg-white/82">
              <div className="border-r border-[#e5ece7] p-4 text-center">
                <p className="text-[13px] font-bold text-[#64716b]">{text.inlet}</p>
                <p className="mt-2 text-[30px] font-extrabold text-[#2479cf]">5</p>
              </div>
              <div className="border-r border-[#e5ece7] p-4 text-center">
                <p className="text-[13px] font-bold text-[#64716b]">{text.outlet}</p>
                <p className="mt-2 text-[30px] font-extrabold text-[#2f8d41]">3</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[13px] font-bold text-[#64716b]">{text.alert}</p>
                <p className="mt-2 text-[30px] font-extrabold text-[#d68a16]">7</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-white/75 bg-white/90 shadow-[0_18px_46px_rgba(17,24,20,0.12)] backdrop-blur-xl">
            {rows.map((row) => (
              <button key={row.label} className="flex h-[64px] w-full items-center gap-4 border-b border-[#e5ece7] px-5 text-left last:border-b-0">
                <AppIcon name={row.icon} className="h-7 w-7 shrink-0 text-[#2f8d41]" />
                <span className="min-w-0 flex-1 truncate text-[18px] font-extrabold">{row.label}</span>
                {row.value ? <span className="text-[14px] font-bold text-[#64716b]">{row.value}</span> : null}
              </button>
            ))}
          </div>
        </section>

        <aside className="hidden overflow-hidden rounded-[30px] border border-white/75 bg-white/88 p-5 shadow-[0_18px_46px_rgba(17,24,20,0.14)] backdrop-blur-xl lg:block">
          <div className="relative h-full min-h-[520px] rounded-[26px] bg-[linear-gradient(135deg,#344f2a,#20341f_45%,#789344)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(96deg,rgba(255,255,255,0.12)_0_2px,transparent_2px_15px)]" />
            <div className="absolute left-[14%] top-[20%] h-[28%] w-[58%] rotate-[-8deg] rounded-2xl border-2 border-[#6bc7f3] bg-[#4ea9db]/45" />
            <div className="absolute bottom-[19%] right-[12%] h-[34%] w-[52%] rotate-[5deg] rounded-2xl border-2 border-[#83d551] bg-[#74be40]/50" />
            <div className="absolute inset-x-5 bottom-5 rounded-[24px] bg-white/92 p-4 shadow-xl">
              <p className="text-[20px] font-extrabold">{text.points}</p>
              <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#64716b]">{text.subtitle}</p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
