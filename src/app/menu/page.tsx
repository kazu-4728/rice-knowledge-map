import AppShell from "../../components/layout/AppShell";
import { members } from "../../data/dummy";

export default function MenuPage() {
  return (
    <AppShell>
      <div className="px-4 pt-4 space-y-4">
        <h1 className="text-lg font-bold text-gray-800">メニュー</h1>

        {/* グループ */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">グループメンバー</p>
          </div>
          <ul>
            {members.map((m, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-base">👤</div>
                  <span className="text-sm text-gray-800">{m.name}</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{m.role}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* メニューリスト */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {[
            { icon: "🔗", label: "招待URLを発行" },
            { icon: "⚙️", label: "グループ設定" },
            { icon: "📊", label: "田んぼ管理" },
            { icon: "❓", label: "ヘルプ" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-800">{item.label}</span>
              </div>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
