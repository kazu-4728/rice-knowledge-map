import AppShell from "../../components/layout/AppShell";
import { recentRecords } from "../../data/dummy";

export default function RecordsPage() {
  return (
    <AppShell>
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-gray-800 mb-4">記録一覧</h1>
        <ul className="space-y-3">
          {recentRecords.map((record) => (
            <li key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3">
              <div className="w-14 h-14 bg-green-100 rounded-lg shrink-0 flex items-center justify-center text-2xl">
                {record.media === "photo" ? "🖼️" : "🎤"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{record.title}</p>
                <p className="text-xs text-gray-400">{record.date} {record.time}</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{record.fieldName}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{record.category}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
