import type { HomeBannerKey } from "../../lib/supabase/types";
import { defaultImage } from "../../lib/data/defaultImageCatalog";
import type { ScreenStep } from "./ScreenSequence";

/**
 * 機能バナー展開時に見せるアプリ実画面のステップ列（ホーム・ガイド・マップヘルプ共用）。
 * 画像はアプリの実スクリーンショット（テストデータ画面をPlaywrightで撮影、
 * app-defaultsバケットの screen-*.webp）。機能のUIを変更するPRでは撮り直して差し替えること。
 */
export const BANNER_SCREENS: Record<HomeBannerKey, ScreenStep[]> = {
  map: [
    { src: defaultImage("screen-map-overview-v2.webp"), caption: "開くと自分の田んぼが色つきで見える" },
    { src: defaultImage("screen-map-fab-v2.webp"), caption: "＋ボタンから記録や田んぼ登録を始める" },
    { src: defaultImage("screen-map-draw-v2.webp"), caption: "指でなぞって新しい田んぼを登録" },
  ],
  talk: [
    { src: defaultImage("screen-record-photo-v2.webp"), caption: "写真を撮ってメモを添える" },
    { src: defaultImage("screen-record-confirm-v2.webp"), caption: "内容を確認して保存" },
    { src: defaultImage("screen-records-timeline.webp"), caption: "そのまま記録タイムラインに流れる" },
  ],
  family: [
    { src: defaultImage("screen-records-timeline.webp"), caption: "今日の記録が時系列で並ぶ" },
    { src: defaultImage("screen-record-detail-v2.webp"), caption: "記録を開いてコメントでやり取り" },
  ],
  line: [
    { src: defaultImage("screen-share-sheet-v2.webp"), caption: "共有したい田んぼを選ぶ" },
    { src: defaultImage("screen-field-detail-v2.webp"), caption: "相手はリンクから田んぼの様子を見られる" },
  ],
  story: [
    { src: defaultImage("screen-field-detail-v2.webp"), caption: "田んぼ切替チップで隣の田んぼへ並行移動しながら振り返る" },
  ],
};
