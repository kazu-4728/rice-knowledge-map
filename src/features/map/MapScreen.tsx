import Link from "next/link";
import MapClientWrapper from "./MapClientWrapper";
import { IconFunnel, IconListBullet, IconPin } from "../../components/ui/icons";

const filterChips = ["すべて", "水口", "異常", "圃場"];

/** マップ画面：白いサブヘッダー（タイトル・圃場一覧・フィルター）＋ 実画像マップ */
export default function MapScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 pb-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <IconPin className="h-6 w-6 text-green-700" />
            <h1 className="text-xl font-bold text-gray-900">マップ</h1>
          </div>
          <Link
            href="/fields"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <IconListBullet className="h-4.5 w-4.5 text-green-700" />
            圃場一覧
          </Link>
        </div>

        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto">
          {filterChips.map((label, i) => (
            <button
              key={label}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                i === 0
                  ? "border border-green-600 bg-green-50 text-green-700"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
          <button className="flex shrink-0 items-center gap-1 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <IconFunnel className="h-4 w-4" />
            フィルター
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <MapClientWrapper />
      </div>
    </div>
  );
}
