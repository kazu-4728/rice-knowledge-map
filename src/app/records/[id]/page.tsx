import Link from "next/link";
import { sampleRecordDetail } from "../../../data/dummy";
import { PaddyPhoto } from "../../../components/ui/PaddyPhoto";
import MapThumb from "../../../components/ui/MapThumb";
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClipboard,
  IconCommentFill,
  IconMic,
  IconMore,
  IconMoreVertical,
  IconPencil,
  IconPinFill,
  IconPlayFill,
  IconPlus,
  IconUserFill,
} from "../../../components/ui/icons";

// 新潟県長岡市付近の地理院 航空写真タイル（位置サムネイル用の実画像）
const GSI_THUMB_URL = "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/15/29020/12705.jpg";

export default function RecordDetailPage() {
  const record = sampleRecordDetail;

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-gray-100">
      {/* ヘッダー */}
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-100 bg-white">
        <Link href="/records" aria-label="戻る" className="absolute left-1 p-2.5 text-gray-800">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-green-700">記録詳細</h1>
        <button aria-label="その他の操作" className="absolute right-1 p-2.5 text-gray-700">
          <IconMoreVertical className="h-6 w-6" />
        </button>
      </header>

      {/* コンテンツ */}
      <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {/* 写真・地点情報カード */}
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <PaddyPhoto variant="water" className="h-52 w-full rounded-xl object-cover" />

          <div className="mt-3 flex gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                  {record.fieldName}
                </span>
                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  {record.pointTypeLabel}
                </span>
                <span className="rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-600">
                  {record.statusLabel}
                </span>
              </div>
              <h2 className="mt-2.5 text-lg font-bold text-gray-900">{record.title}</h2>
              <p className="mt-1.5 flex items-start gap-1 text-xs text-gray-600">
                <IconPinFill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
                {record.address}
              </p>
            </div>

            {/* 位置サムネイル（地理院 航空写真） */}
            <MapThumb src={GSI_THUMB_URL} className="h-28 w-36 shrink-0 rounded-xl" />
          </div>
        </section>

        {/* 記録情報カード */}
        <section className="rounded-2xl bg-white px-4 py-1 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconUserFill className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録者</span>
            <span className="text-sm text-gray-900">{record.recorder}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
            <IconCalendar className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">記録日時</span>
            <span className="text-sm text-gray-900">{record.recordedAt}</span>
          </div>
          <div className="flex items-start gap-3 border-b border-gray-100 py-3.5">
            <IconClipboard className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">状況の概要</span>
            <p className="text-sm leading-relaxed text-gray-900">{record.summary}</p>
          </div>
          <div className="flex items-center gap-3 py-3.5">
            <IconMic className="h-5 w-5 shrink-0 text-green-700" />
            <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">音声メモ</span>
            <button className="flex items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-2 pr-4 transition-colors hover:bg-gray-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700">
                <IconPlayFill className="h-3.5 w-3.5 translate-x-[1px] text-white" />
              </span>
              <span className="text-sm font-semibold text-gray-800">{record.audioDuration}</span>
            </button>
          </div>
        </section>

        {/* 家族のコメント */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCommentFill className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-bold text-gray-900">家族のコメント</h3>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-green-700">
              <IconPlus className="h-4 w-4" strokeWidth={2.2} />
              コメントする
            </button>
          </div>

          <ul className="mt-3 space-y-1">
            {record.comments.map((comment, i) => (
              <li
                key={i}
                className={`flex gap-3 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <IconUserFill className="h-5 w-5 text-green-700" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">{comment.author}</span>
                    {comment.isRecorder && (
                      <>
                        <span className="text-xs text-gray-500">（記録者）</span>
                        <span className="rounded border border-green-600 px-1.5 py-px text-[10px] font-semibold text-green-700">
                          本人
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-800">{comment.text}</p>
                  <p className="mt-1.5 text-xs text-gray-400">{comment.timestamp}</p>
                </div>
                <button aria-label="コメントの操作" className="shrink-0 self-start p-1 text-gray-400">
                  <IconMore className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* 下部アクション */}
      <div className="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-700 bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50">
          <IconCheck className="h-5 w-5" strokeWidth={2.2} />
          対応済みにする
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800">
          <IconPencil className="h-4.5 w-4.5" />
          追記する
        </button>
      </div>
    </div>
  );
}
