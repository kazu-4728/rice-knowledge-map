import Link from "next/link";
import { scheduleItems, recentRecords } from "../../data/dummy";

const scheduleIconMap = {
  drop: "💧",
  waves: "🌊",
  sprout: "🌿",
};

const pointTypeIconMap = {
  inlet: "💧",
  outlet: "↓",
  caution: "⚠️",
  weed: "🌿",
};

const statusStyle: Record<string, string> = {
  予定: "bg-gray-100 text-gray-600",
  進行中: "bg-green-100 text-green-700",
};

export default function HomeScreen() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="pb-4">
      {/* 挨拶・天気バナー */}
      <div className="px-4 pt-4 pb-3 bg-white">
        <p className="text-xs text-gray-500 mb-0.5">おはようございます！</p>
        <p className="text-xs text-gray-400">今日も稲作管理をがんばりましょう。</p>

        <div className="mt-3 flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☀️</span>
            <div>
              <p className="text-2xl font-bold text-gray-800">24°C</p>
              <p className="text-xs text-gray-500">最高 27° 最低 18°</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-green-700">新潟県長岡市</p>
            <p className="text-xs text-gray-500">● 晴れ後曇り</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* 今日の予定 */}
      <section className="mt-3 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-800">今日の予定</h2>
          <button className="text-xs text-green-600">すべて見る</button>
        </div>
        <ul className="space-y-2">
          {scheduleItems.map((item, i) => (
            <li key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-400 text-xs w-10 shrink-0">{item.time}</span>
              <span className="text-base">{scheduleIconMap[item.icon]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-400">{item.fieldName}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusStyle[item.status]}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* クイックアクション */}
      <section className="mt-3 bg-white px-4 py-3">
        <h2 className="text-sm font-bold text-gray-800 mb-3">クイックアクション</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "📷", label: "写真で記録", href: "/records/new" },
            { icon: "🎤", label: "音声で記録", href: "/records/new?type=audio" },
            { icon: "🗺️", label: "マップ", href: "/map" },
            { icon: "📋", label: "作業記録", href: "/records" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-1.5 bg-green-50 rounded-xl py-3 hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs text-green-800 font-medium text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近の記録 */}
      <section className="mt-3 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-800">最近の記録</h2>
          <button className="text-xs text-green-600">すべて見る</button>
        </div>
        <ul className="space-y-2">
          {recentRecords.map((record) => (
            <li key={record.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              {/* サムネイル */}
              <div className="w-12 h-12 bg-green-100 rounded-lg shrink-0 flex items-center justify-center text-xl">
                {record.media === "photo" ? "🖼️" : "🎤"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{record.title}</p>
                <p className="text-xs text-gray-400">
                  {record.date} {record.time}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{record.fieldName}</span>
                  {record.media === "photo" && (
                    <span className="text-xs text-gray-400">📷 {record.photoCount}枚</span>
                  )}
                  {record.media === "audio" && (
                    <span className="text-xs text-gray-400">🎤 {record.audioDuration}</span>
                  )}
                </div>
              </div>
              <span className="text-lg shrink-0">{pointTypeIconMap[record.pointType]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
