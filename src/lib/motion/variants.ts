import type { Variants } from "motion/react";

/**
 * 田んぼOS共通のmotion variant。
 * ランディングページの reveal パターン（下から浮き上がるフェードイン）を
 * 日常画面（/map /records /talk /calendar 等）のリスト・カードにも展開する。
 * 常時ループする環境演出（fab-glow等）はCSS keyframesのまま担当を分ける。
 */

/** 単体要素のマウント時フェード＋浮上（1回きりの状態変化向け） */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/** リスト・カード列の親コンテナ（stagger制御用） */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

/** stagger配下の各アイテム */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
