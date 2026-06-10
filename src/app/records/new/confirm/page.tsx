import Link from "next/link";
import { PaddyPhoto } from "../../../../components/ui/PaddyPhoto";
import {
  IconCheck,
  IconChevronLeft,
  IconClipboard,
  IconMic,
  IconPencil,
  IconPinFill,
  IconPlayFill,
} from "../../../../components/ui/icons";

/** 保存前確認画面（AI整理結果の確認・T-022） */
export default function ConfirmRecordPage() {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <Link href="/records/new" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-green-700">保存前の確認</h1>
      </header>

      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* AI整理結果 */}
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-bold text-green-800">AIが内容を整理しました</p>
          <p className="mt-1 text-[11px] leading-relaxed text-green-700">
            写真と音声メモから、タイトル・分類・状況の概要を提案しています。違っていれば修正してください。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <PaddyPhoto variant="water" className="h-44 w-full rounded-xl" />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">A田</span>
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">入水口</span>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">水管理</span>
          </div>
          <h2 className="mt-2.5 text-lg font-bold text-gray-900">A田 取水口の確認</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <IconPinFill className="h-3.5 w-3.5 text-green-700" />
            新潟県長岡市（A田 東側）・2025年5月24日（土）17:15
          </p>
        </section>

        <section className="rounded-2xl bg-white px-4 py-1 shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-100 py-3.5">
            <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">状況の概要（AI提案）</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-900">
                水の流れは良好。取水口のゴミ詰まりなし。水位は標準よりやや高め。
              </p>
            </div>
            <button aria-label="概要を編集" className="shrink-0 p-1 text-green-700">
              <IconPencil className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="flex items-center gap-3 py-3.5">
            <IconMic className="h-5 w-5 shrink-0 text-green-700" />
            <span className="flex-1 text-sm font-semibold text-gray-700">音声メモ</span>
            <button className="flex items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-2 pr-4 hover:bg-gray-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700">
                <IconPlayFill className="h-3.5 w-3.5 translate-x-[1px] text-white" />
              </span>
              <span className="text-sm font-semibold text-gray-800">0:32</span>
            </button>
          </div>
        </section>
      </main>

      <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Link
          href="/records/new"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <IconPencil className="h-4.5 w-4.5" />
          修正する
        </Link>
        <Link
          href="/records"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          <IconCheck className="h-5 w-5" strokeWidth={2.2} />
          保存する
        </Link>
      </div>
    </div>
  );
}
