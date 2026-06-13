import Link from "next/link";
import {
  IconCamera,
  IconChevronRight,
  IconCommentFill,
  IconMap,
  IconMic,
  IconPinFill,
} from "../../components/ui/icons";

const features = [
  {
    Icon: IconCamera,
    title: "写真・音声で記録",
    desc: "田んぼの様子を撮影・録音してすぐに保存。AIがタイトルと概要を自動作成します。",
  },
  {
    Icon: IconMap,
    title: "空中写真マップ",
    desc: "自分の田んぼをマップ上で管理。国土地理院の空中写真で実際の場所を確認できます。",
  },
  {
    Icon: IconPinFill,
    title: "固定ポイント管理",
    desc: "入水口・出水口・異常箇所をピンで登録。問題の場所を正確に共有できます。",
  },
  {
    Icon: IconCommentFill,
    title: "家族でコメント",
    desc: "記録に家族がコメントできます。「対応済みにする」で作業完了を共有。",
  },
  {
    Icon: IconMic,
    title: "音声メモ",
    desc: "手が汚れていてもワンタップで録音。あとからテキスト確認もできます。",
  },
];

export default function AppIntroSection() {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-green-700">このアプリでできること</h2>
      <p className="mt-1 text-xs text-gray-500">
        家族みんなで田んぼの記録を共有し、稲作の知恵を次の年に引き継ぐアプリです。
      </p>
      <ul className="mt-3 space-y-3">
        {features.map(({ Icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <Icon className="h-4.5 w-4.5 text-green-700" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/guide"
        className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-green-700"
      >
        詳しい使い方を見る
        <IconChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
