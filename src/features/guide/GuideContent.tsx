import {
  IconCamera,
  IconChat,
  IconChevronRight,
  IconCommentFill,
  IconFieldGrid,
  IconMap,
  IconMic,
  IconShare,
  IconSprout,
} from "../../components/ui/icons";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import { ScreenSequence, type ScreenStep } from "../home/ScreenSequence";
import { SYSTEM_DEFAULT_IMAGES, defaultImage } from "../../lib/data/defaultImageCatalog";

type Section = {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  steps: string[];
  /** アプリ実画面のステップ再生（あれば手順の上に表示） */
  screens?: ScreenStep[];
};

/**
 * 使い方ガイド。名称はナビ・ホームと同一（マップ／みんなの記録／各場所の記録）。
 * 各セクションにアプリ実画面のステップ再生を付け、文字だけの説明にしない。
 * 導線やUIを変更するPRでは、該当セクションの文言・実画面もあわせて更新すること。
 */
const sections: Section[] = [
  {
    id: "start",
    Icon: IconSprout,
    title: "はじめかた",
    steps: [
      "ホーム右上の「ログイン」からメールアドレスで登録します。",
      "メールに届いたリンクをタップするとログインが完了します。",
      "仲間を招待するにはメニュー →「家族・作業者」の招待ボタンを使います。",
    ],
  },
  {
    id: "map",
    Icon: IconMap,
    title: "マップ（見る・登録する）",
    screens: [
      { src: defaultImage("screen-map-overview.webp"), caption: "開くと自分の田んぼが色つきで見える" },
      { src: defaultImage("screen-map-fab.webp"), caption: "右下の＋から記録や田んぼ登録を始める" },
      { src: defaultImage("screen-map-draw.webp"), caption: "指でなぞって新しい田んぼを登録" },
    ],
    steps: [
      "マップを開くと空中写真の上に田んぼが信号色（緑=順調・黄=要確認・赤=異常）で表示されます。",
      "右下の＋ボタン →「田んぼを登録」で、田んぼの輪郭を指でなぞって登録します（面積は自動計算）。",
      "入水口・出水口・異常箇所はピンとして登録でき、タップで状態を確認できます。",
      "使い方に迷ったら、マップ右側の「?」ボタンでいつでもこの説明を見られます。",
    ],
  },
  {
    id: "records",
    Icon: IconCamera,
    title: "記録を残す（写真・音声）",
    screens: [
      { src: defaultImage("screen-record-photo.webp"), caption: "写真を撮ってメモを添える" },
      { src: defaultImage("screen-record-confirm.webp"), caption: "内容を確認して保存" },
      { src: defaultImage("screen-talk-timeline.webp"), caption: "そのままみんなの記録に流れる" },
    ],
    steps: [
      "ホームの「今日の記録を残す」か、マップ右下の＋ボタン、みんなの記録のカメラボタンから始めます。",
      "メモ欄はマイクアイコンでしゃべるだけでも入力できます。",
      "対象の田んぼとポイント種別を選んで「次へ」→「保存する」。",
      "保存すると、みんなの記録と田んぼの履歴に反映されます。",
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
    id: "talk",
    Icon: IconChat,
    title: "みんなの記録",
    screens: [
      { src: defaultImage("screen-talk-timeline.webp"), caption: "今日の記録が時系列で並ぶ" },
      { src: defaultImage("screen-record-detail.webp"), caption: "記録を開いてコメントでやり取り" },
    ],
    steps: [
      "みんなの記録には、仲間全員の記録と会話が時系列で流れます。",
      "田んぼの名札やカテゴリで絞り込みができます。",
      "下の入力欄からひとことメッセージや音声も送れます。",
      "田んぼ別にまとめて見たいときは「各場所の記録」、異常・要確認だけを横断で探したいときはメニュー→「記録一覧」を使います。",
    ],
  },
  {
    id: "fields",
    Icon: IconFieldGrid,
    title: "各場所の記録",
    screens: [
      { src: defaultImage("screen-fields-list.webp"), caption: "田んぼごとのカードで状態を確認" },
      { src: defaultImage("screen-field-detail.webp"), caption: "記録の蓄積と写真の変化を確認できる" },
    ],
    steps: [
      "各場所の記録では、田んぼを1枚ずつ選んで状態・記録・写真の変化を確認できます。",
      "田んぼカードをタップすると詳細（記録一覧・定点観測の写真比較）に移動します。",
      "カメラアイコンから田んぼのカバー写真を登録できます（オーナー・編集者）。",
    ],
  },
  {
    id: "share",
    Icon: IconShare,
    title: "共有する",
    screens: [
      { src: defaultImage("screen-share-sheet.webp"), caption: "共有したい田んぼを選ぶ" },
      { src: defaultImage("screen-field-detail.webp"), caption: "相手はリンクから田んぼの様子を見られる" },
    ],
    steps: [
      "ホームの「共有する」か、田んぼ詳細の「共有する」ボタンから共有できます。",
      "LINEなど、いつも使うアプリを選んで田んぼの様子とリンクを送れます。",
      "アプリを使っていない相手にも届きます。招待すれば一緒に記録もできます。",
    ],
  },
  {
    id: "comments",
    Icon: IconCommentFill,
    title: "コメント・対応済み",
    steps: [
      "記録詳細ページで「コメントする」ボタンをタップして仲間にメッセージを残せます。",
      "問題が解決したら「対応済みにする」ボタンで完了を記録します。",
      "対応済みの記録は一覧でグレー表示されます。",
    ],
  },
];

const changelog = [
  { date: "2026-07-16", note: "ホームを一新（名称統一・実画面つき説明・次の操作の提案）。マップに田んぼ登録ボタンとヘルプを追加" },
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
            みんなで田んぼの記録を共有し、稲作の知恵を次の年へ引き継ぐアプリです。
          </p>
        </div>
      </div>

      {sections.map(({ id, Icon, title, steps, screens }) => (
        <section key={id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <Icon className="h-4.5 w-4.5 text-green-700" />
            </span>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          </div>
          {screens && <ScreenSequence steps={screens} className="mt-3" />}
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
