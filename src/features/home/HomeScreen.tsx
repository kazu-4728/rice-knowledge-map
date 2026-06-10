import Link from "next/link";
import { scheduleItems, recentRecords } from "../../data/dummy";
import { RecordThumb } from "../../components/ui/PaddyPhoto";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconMap,
  IconMic,
  IconPin,
  IconSprout,
  IconSun,
  IconWaves,
} from "../../components/ui/icons";

const scheduleIcon = {
  drop: <IconDropFill className="h-5 w-5 text-sky-500" />,
  waves: <IconWaves className="h-5 w-5 text-blue-500" />,
  sprout: <IconSprout className="h-5 w-5 text-green-600" />,
};

const statusStyle: Record<string, string> = {
  予定: "bg-gray-100 text-gray-600",
  進行中: "bg-green-100 text-green-700",
};

// サンプルデータの基準日（全体を統一）
const SAMPLE_DATE = "2025年5月24日（土）";

export default function HomeScreen() {
  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      {/* あいさつ・天気（控えめに） */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-900">おはようございます！</p>
            <p className="mt-0.5 text-xs text-gray-500">{SAMPLE_DATE}・新潟県長岡市</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2">
            <IconSun className="h-6 w-6" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-800">24°C</p>
              <p className="text-[10px] text-gray-500">27° / 18°</p>
            </div>
          </div>
        </div>

        {/* 記録導線（主役） */}
        <div className="mt-4 flex gap-3">
          <Link
            href="/records/new"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            <IconCamera className="h-5 w-5" />
            写真で記録
          </Link>
          <Link
            href="/records/new?type=audio"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
          >
            <IconMic className="h-5 w-5" />
            音声メモ
          </Link>
        </div>
        <Link
          href="/map"
          className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-bold text-green-800 transition-colors hover:bg-green-100"
        >
          <IconMap className="h-5 w-5" />
          マップを開く
        </Link>
      </section>

      {/* 今日の予定 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">今日の予定</h2>
          <button className="flex items-center text-sm font-semibold text-green-700">
            すべて見る
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-2">
          {scheduleItems.map((item, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <span className="w-11 shrink-0 text-sm font-semibold text-gray-600">{item.time}</span>
              {scheduleIcon[item.icon]}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.fieldName}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${statusStyle[item.status]}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 最近の記録 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">最近の記録</h2>
          <Link href="/records" className="flex items-center text-sm font-semibold text-green-700">
            すべて見る
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-2">
          {recentRecords.slice(0, 4).map((record, i) => (
            <li key={record.id}>
              <Link
                href={`/records/${record.id}`}
                className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
              >
                <RecordThumb
                  media={record.media}
                  variant={record.category === "作業" ? "grass" : "water"}
                  duration={record.audioDuration}
                  className="h-14 w-[4.5rem] shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{record.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <IconPin className="h-3.5 w-3.5" />
                    {record.fieldName}（{record.fieldArea}）・{record.time}
                  </p>
                </div>
                <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
