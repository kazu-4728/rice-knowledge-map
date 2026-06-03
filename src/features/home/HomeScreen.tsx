import Link from "next/link";
import { scheduleItems, recentRecords } from "../../data/dummy";

// ステータスバッジ（モック画像準拠）
const statusBadge: Record<string, string> = {
  予定:   "bg-sky-100 text-sky-700",
  進行中: "bg-amber-100 text-amber-700",
};

// 予定アイコン（絵文字）
const scheduleIcon: Record<string, string> = {
  drop:   "💧",
  waves:  "🌊",
  sprout: "🌿",
};

// 田んぼタグカラー（モック画像準拠）
const fieldTagStyle: Record<string, string> = {
  A田: "bg-green-100 text-green-700",
  B田: "bg-amber-100 text-amber-700",
  C田: "bg-gray-100 text-gray-600",
  D田: "bg-purple-100 text-purple-700",
};

export default function HomeScreen() {
  return (
    <div className="pb-6">

      {/* ① グリーティングカード */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* アバター */}
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900">おはようございます！</p>
            <p className="text-[12px] text-gray-500 mt-0.5">今日も稲作管理をがんばりましょう。</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-[11px] text-gray-400">2025年</p>
          <p className="text-[26px] font-bold text-green-600 leading-none">5月24日</p>
          <p className="text-[13px] font-semibold text-green-600">（土）</p>
        </div>
      </div>

      {/* ② 天気カード */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          {/* 天気アイコン */}
          <span className="text-5xl leading-none shrink-0">⛅</span>
          {/* 気温 */}
          <div className="shrink-0">
            <p className="text-[36px] font-bold text-gray-900 leading-none">24°C</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[12px] text-red-500 font-medium">最高 27°C</span>
              <span className="text-[12px] text-blue-500 font-medium">最低 16°C</span>
            </div>
          </div>
          {/* 湿度・降水確率 */}
          <div className="border-l border-gray-200 pl-3 space-y-1 shrink-0">
            <div className="flex items-center gap-1 text-[12px] text-gray-600">
              <span>☂</span>
              <span>降水確率 <strong className="text-gray-800">10%</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-600">
              <span>💧</span>
              <span>湿度 <strong className="text-gray-800">62%</strong></span>
            </div>
          </div>
          {/* 現在地 */}
          <div className="ml-auto text-right shrink-0">
            <p className="text-[11px] text-gray-400">現在地</p>
            <p className="text-[12px] font-bold text-gray-800">新潟県長岡市</p>
            <p className="text-[11px] text-green-600 mt-0.5">📍 地域を変更</p>
          </div>
        </div>
      </div>

      {/* ③ 今日の予定 */}
      <div className="flex items-center justify-between px-4 mt-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-green-600">📅</span>
          <h2 className="text-[15px] font-bold text-gray-800">今日の予定</h2>
        </div>
        <button className="text-[13px] text-green-600 flex items-center gap-0.5">
          すべて見る
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {scheduleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            {/* 時刻 */}
            <div className="w-12 shrink-0 text-center">
              <p className="text-[15px] font-bold text-gray-800">{item.time}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">🕐</p>
            </div>
            {/* タイトル・圃場 */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">圃場：{item.fieldName}</p>
            </div>
            {/* 活動アイコン */}
            <span className="text-xl shrink-0">{scheduleIcon[item.icon]}</span>
            {/* ステータスバッジ */}
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${statusBadge[item.status]}`}>
              {item.status}
            </span>
            {/* シェブロン */}
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        ))}
      </div>

      {/* ④ クイックアクション */}
      <div className="flex items-center px-4 mt-4 mb-2 gap-2">
        <span className="text-green-600">⚡</span>
        <h2 className="text-[15px] font-bold text-gray-800">クイックアクション</h2>
      </div>
      <div className="grid grid-cols-4 gap-3 mx-4">
        {[
          { icon: "📷", label: "写真で記録", href: "/records/new" },
          { icon: "🎤", label: "音声で記録", href: "/records/new?type=audio" },
          { icon: "🗺️", label: "マップ",     href: "/map" },
          { icon: "📋", label: "作業記録",   href: "/records" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center py-4 gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-[30px] leading-none">{action.icon}</span>
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* ⑤ 最近の記録 */}
      <div className="flex items-center justify-between px-4 mt-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-green-600">🕐</span>
          <h2 className="text-[15px] font-bold text-gray-800">最近の記録</h2>
        </div>
        <button className="text-[13px] text-green-600 flex items-center gap-0.5">
          すべて見る
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {recentRecords.map((record) => (
          <div key={record.id} className="flex items-center gap-3 px-4 py-3">
            {/* サムネイル */}
            {record.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.photo}
                alt={record.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-green-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-800 shrink-0 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl">🎤</span>
                <span className="text-[10px] text-gray-400">{record.audioDuration}</span>
              </div>
            )}
            {/* テキスト */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 truncate">{record.title}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{record.date} {record.time}</p>
              <div className="flex items-center gap-1 mt-1">
                {record.media === "photo" && (
                  <span className="text-[11px] text-gray-500">📷 写真{record.photoCount}枚</span>
                )}
              </div>
            </div>
            {/* 田んぼタグ */}
            <span className={`text-[11px] font-medium px-2 py-1 rounded-md shrink-0 ${fieldTagStyle[record.fieldName] ?? "bg-gray-100 text-gray-600"}`}>
              {record.fieldName}
            </span>
            {/* シェブロン */}
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        ))}
      </div>

    </div>
  );
}
