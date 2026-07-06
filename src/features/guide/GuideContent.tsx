import {
  IconCamera,
  IconChevronRight,
  IconCommentFill,
  IconFieldGrid,
  IconMap,
  IconMic,
  IconPinFill,
  IconSprout,
} from "../../components/ui/icons";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { SYSTEM_DEFAULT_IMAGES } from "../../lib/data/defaultImageCatalog";

type Section = {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  steps: string[];
};

const sections: Section[] = [
  {
    id: "home",
    Icon: IconSprout,
    title: "はじめかた",
    steps: [
      "アプリを開いてログインボタンからメールアドレスで登録します。",
      "メールに届いたリンクをタップするとログインが完了します。",
      "家族を招待するにはメニュー →「家族・作業者」の招待ボタンを使います。",
    ],
  },
  {
    id: "records",
    Icon: IconCamera,
    title: "記録を作る（写真・音声）",
    steps: [
      "ホームまたは記録タブの「写真で記録」ボタンをタップして撮影します。",
      "メモ欄に気づいたことを入力。音声入力ボタン（マイクアイコン）でしゃべるだけでも入力できます。",
      "対象の田んぼとポイント種別を選んで「次へ」→「保存する」。",
      "記録一覧に追加され、家族全員が確認できます。",
    ],
  },
  {
    id: "audio",
    Icon: IconMic,
    title: "音声メモ",
    steps: [
      "「音声メモ」ボタンをタップしてマイクアイコンを押すと録音開始（最大2分）。",
      "もう一度タップすると停止。録音した内容を確認して保存できます。",
      "手が汚れた状態でも手袋をしたままでも使えます。",
    ],
  },
  {
    id: "map",
    Icon: IconMap,
    title: "マップで田んぼを管理",
    steps: [
      "マップタブを開くと空中写真が表示されます。",
      "「田んぼを登録」をタップして、田んぼの輪郭をなぞってポリゴンを描きます。",
      "名前を付けて保存すると一覧に表示されます。",
      "マップ上でピンをタップすると、その地点の最新情報が下部に表示されます。",
    ],
  },
  {
    id: "pins",
    Icon: IconPinFill,
    title: "固定ポイント（ピン）の登録",
    steps: [
      "マップ下部の「ピン追加」ボタンをタップして地図上の場所を選択します。",
      "入水口・出水口・異常箇所などの種別と名前を設定して保存。",
      "ピンをタップすると最終記録と状態が確認できます。",
      "「詳細」ボタンでそのピンに紐づいた記録一覧を表示します。",
    ],
  },
  {
    id: "fields",
    Icon: IconFieldGrid,
    title: "田んぼ一覧",
    steps: [
      "メニュー →「田んぼ一覧」から登録した田んぼを確認できます。",
      "田んぼカードをタップするとその田んぼの記録一覧に移動します。",
      "カメラアイコンから田んぼの実写真を登録できます（オーナー・編集者）。",
    ],
  },
  {
    id: "comments",
    Icon: IconCommentFill,
    title: "コメント・対応済み",
    steps: [
      "記録詳細ページで「コメントする」ボタンをタップして家族にメッセージを残せます。",
      "問題が解決したら「対応済みにする」ボタンで完了を記録します。",
      "対応済みの記録は一覧でグレー表示されます。",
    ],
  },
];

const changelog = [
  { date: "2026-06-13", note: "ヒーローセクション・アプリ説明・使い方ページを追加（PR-B）" },
  { date: "2026-06-12", note: "田んぼ一覧・ホーム最近の記録・メニュー固定ポイント管理を実データ化（Phase E）" },
  { date: "2026-06-12", note: "マップのピン登録・編集・削除機能を追加（Phase D）" },
  { date: "2026-06-11", note: "写真記録の保存・音声メモの録音・保存（Phase B/B2）" },
];

export default function GuideContent() {
  return (
    <div className="space-y-4 px-3 pb-8 pt-3">
      <div className="relative overflow-hidden rounded-2xl">
        <RemotePhoto src={SYSTEM_DEFAULT_IMAGES.fieldDefault} alt="" className="h-28 w-full object-cover" fallbackVariant="field" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 px-4 py-3">
          <p className="text-sm font-bold text-white drop-shadow">
            みらい稲作管理 — 使い方ガイド
          </p>
          <p className="mt-1 text-xs text-white/85 drop-shadow">
            家族で田んぼの記録を共有し、稲作の知恵を次の年へ引き継ぐアプリです。
          </p>
        </div>
      </div>

      {sections.map(({ id, Icon, title, steps }) => (
        <section key={id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <Icon className="h-4.5 w-4.5 text-green-700" />
            </span>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          </div>
          <ol className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-gray-700">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* 更新履歴 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <IconChevronRight className="h-4 w-4 text-green-700" />
          更新履歴
        </h2>
        <ul className="mt-3 space-y-2">
          {changelog.map(({ date, note }) => (
            <li key={date} className="flex gap-2 text-xs">
              <span className="shrink-0 text-gray-400">{date}</span>
              <span className="text-gray-700">{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
