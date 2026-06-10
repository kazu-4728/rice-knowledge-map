import Link from "next/link";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconMic,
  IconPinFill,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

const pointTypes = [
  { type: "inlet", icon: <IconDropFill className="h-6 w-6 text-sky-500" />, label: "入水口" },
  { type: "outlet", icon: <IconWaves className="h-6 w-6 text-blue-500" />, label: "出水口" },
  { type: "weed", icon: <IconSprout className="h-6 w-6 text-green-600" />, label: "雑草" },
  { type: "caution", icon: <IconWarningFill className="h-6 w-6 text-amber-500" />, label: "異常" },
];

export default function PhotoRecordScreen() {
  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      <h1 className="px-1 text-2xl font-bold text-gray-900">写真で記録</h1>

      {/* カメラエリア */}
      <button className="relative flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl bg-gray-900 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white">
          <span className="h-12 w-12 rounded-full bg-white" />
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <IconCamera className="h-4.5 w-4.5" />
          タップして撮影
        </span>
      </button>

      {/* 候補地 */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm">
        <IconPinFill className="h-6 w-6 shrink-0 text-green-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">候補: A田（現在地から推定）</p>
          <p className="mt-0.5 text-xs text-gray-500">新潟県長岡市 ○○町地内</p>
        </div>
        <button className="shrink-0 text-sm font-semibold text-green-700">変更</button>
      </div>

      {/* ポイント種別 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-900">ポイントの種類を選択</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {pointTypes.map((pt) => (
            <button
              key={pt.type}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-gray-100 bg-white py-3 transition-colors hover:border-green-500"
            >
              {pt.icon}
              <span className="text-xs font-semibold text-gray-700">{pt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 音声メモ追加 */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm">
        <span className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
          <IconMic className="h-5 w-5 text-green-700" />
          音声メモを追加
        </span>
        <Link href="/records/new?type=audio" className="text-sm font-semibold text-green-700">
          追加
        </Link>
      </div>

      {/* 次へ */}
      <Link
        href="/records/new/confirm"
        className="flex w-full items-center justify-center gap-1 rounded-xl bg-green-700 py-4 text-sm font-bold text-white transition-colors hover:bg-green-800"
      >
        次へ（内容を確認）
        <IconChevronRight className="h-4.5 w-4.5" />
      </Link>
    </div>
  );
}
