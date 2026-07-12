import type { ComponentType, SVGProps } from "react";
import type { HomeBannerKey } from "../../lib/supabase/types";
import {
  IconChartBar,
  IconPencil,
  IconPin,
  IconShare,
  IconUsers,
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
};

/**
 * ホーム（/home）の機能バナー5件（Issue #72確定事項9・確定事項6の遷移先対応）。
 * 文言は初稿でありオーナーレビュー対象（確定事項11）。
 */
export const HOME_BANNERS: HomeBannerDef[] = [
  {
    key: "map",
    Icon: IconPin,
    title: "田んぼを見る",
    shortTitle: "田んぼを見る",
    shortSub: "地図で確認",
    summary: "地図で田んぼの場所・状態・異常を確認します。",
    detail: [
      {
        label: "できること",
        items: ["田んぼの場所や状況を地図で確認", "見回り前に異常をチェック", "過去の記録もすぐに参照"],
      },
      {
        label: "使うタイミング",
        items: ["見回りの前や移動中に", "異常を早く見つけたいとき", "作業の計画を立てるとき"],
      },
      {
        label: "その後どうなる?",
        items: ["異常があれば記録に残せる", "家族へ共有してすぐ対応", "田んぼの履歴に反映される"],
      },
    ],
    action: { type: "link", href: "/map" },
  },
  {
    key: "talk",
    Icon: IconPencil,
    title: "今日の記録を残す",
    shortTitle: "記録する",
    shortSub: "写真・音声・作業を記録",
    summary: "写真・音声・作業内容を田んぼごとに残します。記録は今日の流れと田んぼの履歴に反映されます。",
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
        items: ["記録が今日の流れに流れる", "家族がすぐに確認できる", "田んぼの履歴に積み上がる"],
      },
    ],
    // 今日の流れのカメラボタンと同じ写真記録の開始導線。保存後はホームへ復帰する
    action: { type: "link", href: "/records/new?returnTo=%2Fhome" },
  },
  {
    key: "family",
    Icon: IconUsers,
    title: "家族の動きを見る",
    shortTitle: "家族で共有する",
    shortSub: "家族と共有してみんなで把握",
    summary: "今日みんなが何をしたかを時系列で確認します。家族の記録やコメントをまとめて見られます。",
    detail: [
      {
        label: "できること",
        items: ["家族の記録を時系列で確認", "田んぼの名札で絞り込み", "コメントで反応を返せる"],
      },
      {
        label: "使うタイミング",
        items: ["「今日どうだった?」のとき", "離れた家族の様子を知りたいとき", "対応の分担を決めるとき"],
      },
      {
        label: "その後どうなる?",
        items: ["言った言わないがなくなる", "対応もれに気づける", "家族の知恵が残っていく"],
      },
    ],
    action: { type: "link", href: "/talk" },
  },
  {
    key: "story",
    Icon: IconChartBar,
    title: "育ち方を振り返る",
    shortTitle: "育ち方を振り返る",
    shortSub: "生育の変化や履歴をチェック",
    summary: "過去の写真や記録を比べて生育の変化を見ます。季節ごとの違いや前回との比較に使います。",
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
        items: ["毎年の判断材料になる", "家族と共有できる", "農家の知恵が引き継がれる"],
      },
    ],
    action: { type: "link", href: "/fields" },
  },
  {
    key: "line",
    Icon: IconShare,
    title: "LINEで家族に共有する",
    shortTitle: "LINEで共有する",
    shortSub: "家族へお知らせ・リンクで簡単",
    summary: "田んぼの様子や記録を家族へ知らせます。共有リンクから家族がアプリへ入れます。",
    detail: [
      {
        label: "できること",
        items: ["田んぼの様子をLINEへ送る", "写真とリンクを共有", "アプリ未利用の家族にも届く"],
      },
      {
        label: "使うタイミング",
        items: ["今日の様子を伝えたいとき", "見てほしい記録があるとき", "家族を誘いたいとき"],
      },
      {
        label: "その後どうなる?",
        items: ["家族がリンクから見られる", "そのままアプリに参加できる", "見守りの輪が広がる"],
      },
    ],
    action: { type: "share" },
  },
];
