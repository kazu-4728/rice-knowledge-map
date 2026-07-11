import type { HomeBannerKey } from "../../lib/supabase/types";

export type HomeBannerAction = { type: "link"; href: string } | { type: "share" };

export type HomeBannerDef = {
  key: HomeBannerKey;
  title: string;
  summary: string;
  /** 展開時の3カラム詳細（できること／使うタイミング／その後どうなる） */
  detail: { label: string; text: string }[];
  action: HomeBannerAction;
};

/**
 * ホーム（/home）の機能バナー5件（Issue #72確定事項9・確定事項6の遷移先対応）。
 * 文言は初稿でありオーナーレビュー対象（確定事項11）。
 */
export const HOME_BANNERS: HomeBannerDef[] = [
  {
    key: "map",
    title: "田んぼを見る",
    summary: "地図を開けば、自分の田んぼの今がひと目でわかります",
    detail: [
      { label: "できること", text: "空中写真の地図上で、田んぼの状態を信号色で確認できます" },
      { label: "使うタイミング", text: "見回りの前後や、外出先から様子を確認したいとき" },
      { label: "その後どうなる", text: "気になる田んぼをタップすると、詳しい記録に進めます" },
    ],
    action: { type: "link", href: "/map" },
  },
  {
    key: "talk",
    title: "今日の記録を残す",
    summary: "写真・音声・気づきを、その場から数秒で記録できます",
    detail: [
      { label: "できること", text: "写真や音声メモを撮るだけで、田んぼごとの記録として残ります" },
      { label: "使うタイミング", text: "水を見たとき、異常に気づいたとき、作業をしたとき" },
      { label: "その後どうなる", text: "記録はそのまま家族のタイムラインに流れます" },
    ],
    action: { type: "link", href: "/talk" },
  },
  {
    key: "family",
    title: "家族の動きを見る",
    summary: "家族が今日どこで何をしたか、時系列でわかります",
    detail: [
      { label: "できること", text: "家族みんなの記録が、1本のタイムラインで流れてきます" },
      { label: "使うタイミング", text: "「今日はどうだった?」を確認したいとき" },
      { label: "その後どうなる", text: "気になる記録にコメントを付けて対応を共有できます" },
    ],
    action: { type: "link", href: "/talk" },
  },
  {
    key: "story",
    title: "育ち方を振り返る",
    summary: "田植えから収穫まで、田んぼごとの成長を辿れます",
    detail: [
      { label: "できること", text: "田植え直後と今の写真を並べて、生育を比較できます" },
      { label: "使うタイミング", text: "去年との違いを確認したいとき、記録を振り返りたいとき" },
      { label: "その後どうなる", text: "田んぼごとのストーリーとして記録が積み上がります" },
    ],
    action: { type: "link", href: "/fields" },
  },
  {
    key: "line",
    title: "LINEで家族に共有する",
    summary: "今日の田んぼの様子を、家族のLINEへそのまま共有できます",
    detail: [
      { label: "できること", text: "田んぼストーリーの写真とリンクをLINEへ共有できます" },
      { label: "使うタイミング", text: "遠くの家族に今日の様子を伝えたいとき" },
      { label: "その後どうなる", text: "LINEを開いた家族が、そのままアプリのストーリーを見られます" },
    ],
    action: { type: "share" },
  },
];
