const pointTypes = [
  { type: "inlet", icon: "💧", label: "入水口" },
  { type: "outlet", icon: "⬇", label: "出水口" },
  { type: "weed", icon: "🌿", label: "雑草" },
  { type: "caution", icon: "⚠️", label: "異常" },
];

export default function PhotoRecordScreen() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-800">写真で記録</h1>

      {/* カメラエリア */}
      <div className="bg-gray-800 rounded-2xl h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full" />
          </div>
          <p className="text-white text-sm">📷 タップして撮影</p>
        </div>
      </div>

      {/* 候補地 */}
      <div className="bg-white rounded-xl p-3 border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">候補: A田（現在地から推定）</p>
        <p className="text-xs text-green-600 font-medium">新潟県長岡市 ○○町地内</p>
      </div>

      {/* ポイント種別 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">ポイントの種類を選択</p>
        <div className="grid grid-cols-4 gap-2">
          {pointTypes.map((pt) => (
            <button
              key={pt.type}
              className="flex flex-col items-center gap-1 bg-white border-2 border-gray-100 rounded-xl py-3 hover:border-green-400 transition-colors"
            >
              <span className="text-xl">{pt.icon}</span>
              <span className="text-xs text-gray-600">{pt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 音声メモ追加 */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
        <span className="text-sm text-gray-700">🎤 音声メモを追加</span>
        <button className="text-xs text-green-600 font-medium">追加</button>
      </div>

      {/* 次へボタン */}
      <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-4 rounded-xl transition-colors">
        次へ
      </button>
    </div>
  );
}
