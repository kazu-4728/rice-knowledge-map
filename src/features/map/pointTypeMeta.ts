import type { ComponentType, SVGProps } from "react";
import type { FieldPointType } from "../../types";
import { POINT_TYPES, TYPE_LABELS } from "./mapPins";
import {
  IconDropFill,
  IconPinFill,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type PointTypeMeta = {
  type: FieldPointType;
  /** 表示名（mapPins.ts の TYPE_LABELS が元データ） */
  label: string;
  /** アイコンはサイズを呼び出し側で決められるようコンポーネント参照で持つ */
  Icon: IconComponent;
  /** アイコンの文字色クラス */
  color: string;
  /** アイコンの背景色クラス（一覧の丸/角丸バッジで使う） */
  bg: string;
};

const ICONS: Record<FieldPointType, { Icon: IconComponent; color: string; bg: string }> = {
  inlet: { Icon: IconDropFill, color: "text-sky-500", bg: "bg-sky-50" },
  outlet: { Icon: IconWaves, color: "text-blue-500", bg: "bg-blue-50" },
  canal: { Icon: IconWaves, color: "text-cyan-500", bg: "bg-cyan-50" },
  weed: { Icon: IconSprout, color: "text-green-600", bg: "bg-green-50" },
  caution: { Icon: IconWarningFill, color: "text-amber-500", bg: "bg-amber-50" },
  levee_damage: { Icon: IconWarningFill, color: "text-red-500", bg: "bg-red-50" },
  poor_drainage: { Icon: IconDropFill, color: "text-orange-500", bg: "bg-orange-50" },
  other: { Icon: IconPinFill, color: "text-gray-500", bg: "bg-gray-50" },
};

/**
 * ポイント種別のアイコン付きメタ情報。記録作成の選択肢・場所詳細のポイント一覧で共通に使う
 * （以前は PhotoRecordScreen / AudioRecordScreen / FieldDetailScreen に別々の定義があり、
 * 記録作成の選択肢だけ4種類に絞られていた）。
 */
export const POINT_TYPE_META: Record<FieldPointType, PointTypeMeta> = Object.fromEntries(
  POINT_TYPES.map((type) => [type, { type, label: TYPE_LABELS[type], ...ICONS[type] }])
) as Record<FieldPointType, PointTypeMeta>;

/** 選択肢としての並び（POINT_TYPES の順） */
export const POINT_TYPE_CHOICES: PointTypeMeta[] = POINT_TYPES.map((t) => POINT_TYPE_META[t]);
