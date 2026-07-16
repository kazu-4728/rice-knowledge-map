import type { ComponentType, SVGProps } from "react";
import type { HomeBannerKey } from "../../lib/supabase/types";
import {
  IconChartBar,
  IconChat,
  IconMap,
  IconPencil,
  IconShare,
} from "../../components/ui/icons";

export type HomeBannerAction = { type: "link"; href: string } | { type: "share" };

export type HomeBannerDef = {
  key: HomeBannerKey;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  /** ヒーロー内クイックアクセス帯用の短縮表記 */
  shortTitle: string;
  shortSub: string;
  summary: string;
  /** 展開時の3カラム詳細（できること／使うタイミング／その後どうなる?） */
  detail: { label: string; items: string[] }[];
  action: HomeBannerAction;
  /** 遷移/共有ボタンの表示ラベル（アイコンだけでは押した先が分からないため必須） */
  actionLabel: string;
};

/**
 * ホーム（/、ランディング統合後）の機能バナー5件。
 * 唯一の説明ソース: ここを更新すればホームの説明が追従する（機能を変更するPRでは
 * 該当項目もあわせて更新すること）。
 * タイトルはナビタブ・ページ見出しと完全一致させる（2026-07-16オーナー確定・案B。
 * ホームで覚えた名前がアプリ内に存在しない、という不一致を作らない）。
 * keyはgroup_site_contentのimage_slots.homeBannersの保存キーのため変更しない。
 * 並び順は実際の利用の流れ（見る・登録する→記録する→みんなで確認→共有→振り返る）。
 */
export const HOME_BANNERS: HomeBannerDef[] = [
  {
    key: "map",
    Icon: IconMap,
    title: "マップ",
    shortTitle: "マップ",
    shortSub: "見る・登録する",
    summary:
      "空中写真の上で指でなぞって田んぼを登録。信号色で状態がひと目でわかり、入水口や異常箇所はピンで管理できます。",
    detail: [
      {
        label: "できること",
        items: [
          "指でなぞって田んぼを登録（面積は自動計算）",
          "緑・黄・赤の信号色で状態を確認",
          "入水口・出水口・異常箇所をピンで管理",
        ],
      },
      {
        label: "使うタイミング",
        items: ["はじめて使うとき（まず田んぼを登録）", "見回りの前や移動中に", "異常の場所を確かめたいとき"],
      },
      {
        label: "その後どうなる?",
        items: ["登録した田んぼに記録を残せる", "異常はその場で報告できる", "みんなの記録と履歴に反映される"],
      },
    ],
    action: { type: "link", href: "/map" },
    actionLabel: "マップを開く",
  },
  {
    key: "talk",
    Icon: IconPencil,
    title: "今日の記録を残す",
    shortTitle: "記録する",
    shortSub: "写真・音声・作業を記録",
    summary: "写真・音声・作業内容を田んぼごとに残します。記録はみんなの記録と田んぼの履歴に反映されます。",
    detail: [
      {
        label: "できること",
        items: ["写真・音声・メモを記録", "田んぼの名札付きで残せる", "その場で数秒で完了"],
      },
      {
        label: "使うタイミング",
        items: ["水を見たとき・作業をしたとき", "異常に気づいたとき", "帰り道の振り返りに"],
      },
      {
        label: "その後どうなる?",
        items: ["記録がみんなの記録に流れる", "仲間がすぐに確認できる", "田んぼの履歴に積み上がる"],
      },
    ],
    // みんなの記録のカメラボタンと同じ写真記録の開始導線。保存後はホーム（/）へ復帰する
    action: { type: "link", href: "/records/new?returnTo=%2F" },
    actionLabel: "記録をはじめる",
  },
  {
    key: "family",
    Icon: IconChat,
    title: "みんなの記録",
    shortTitle: "みんなの記録",
    shortSub: "記録と会話が時系列で",
    summary: "今日みんなが何をしたかを時系列で確認します。記録やコメントをまとめて見られます。",
    detail: [
      {
        label: "できること",
        items: ["みんなの記録を時系列で確認", "田んぼの名札で絞り込み", "コメントで反応を返せる"],
      },
      {
        label: "使うタイミング",
        items: ["「今日どうだった?」のとき", "離れた仲間の様子を知りたいとき", "対応の分担を決めるとき"],
      },
      {
        label: "その後どうなる?",
        items: ["言った言わないがなくなる", "対応もれに気づける", "みんなの知恵が残っていく"],
      },
    ],
    action: { type: "link", href: "/talk" },
    actionLabel: "みんなの記録を開く",
  },
  {
    key: "line",
    Icon: IconShare,
    title: "共有する",
    shortTitle: "共有する",
    shortSub: "LINEなどへリンクひとつ",
    summary: "田んぼの様子や記録を、LINEなどいつものアプリで知らせます。リンクから相手がそのまま見られます。",
    detail: [
      {
        label: "できること",
        items: ["LINEなど好きなアプリで送れる", "田んぼの様子とリンクを共有", "アプリ未利用の人にも届く"],
      },
      {
        label: "使うタイミング",
        items: ["今日の様子を伝えたいとき", "見てほしい記録があるとき", "仲間を誘いたいとき"],
      },
      {
        label: "その後どうなる?",
        items: ["リンクからすぐ見られる", "そのままアプリに参加できる", "見守りの輪が広がる"],
      },
    ],
    action: { type: "share" },
    actionLabel: "共有をはじめる",
  },
  {
    key: "story",
    Icon: IconChartBar,
    title: "田んぼストーリー",
    shortTitle: "田んぼストーリー",
    shortSub: "育ちを振り返る",
    summary: "田んぼごとの成長を、過去の写真や記録と見比べて振り返ります。来年の判断材料になります。",
    detail: [
      {
        label: "できること",
        items: ["田んぼごとの成長を振り返る", "過去と今の写真を見比べる", "記録の蓄積を確認"],
      },
      {
        label: "使うタイミング",
        items: ["季節の節目に", "去年と比べたいとき", "来年の計画を立てるとき"],
      },
      {
        label: "その後どうなる?",
        items: ["毎年の判断材料になる", "みんなと共有できる", "農家の知恵が引き継がれる"],
      },
    ],
    action: { type: "link", href: "/fields" },
    actionLabel: "田んぼストーリーを開く",
  },
];
