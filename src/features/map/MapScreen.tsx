import Link from "next/link";
import MapClientWrapper from "./MapClientWrapper";
import { IconListBullet, IconPin } from "../../components/ui/icons";

/** マップ画面：白いサブヘッダー（タイトル・圃場一覧）＋ 実画像マップ */
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
      </div>

      <div className="relative min-h-0 flex-1">
        <MapClientWrapper />
      </div>
    </div>
  );
}
