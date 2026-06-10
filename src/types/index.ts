export type TabKey = "home" | "map" | "records" | "menu";

export type Field = {
  id: string;
  name: string;
  label: string;
  area: string;
  crop: string;
  season: string;
  color: "blue" | "yellow" | "green" | "purple";
};

// GLOSSARY.md §6 field_points.point_type 正規値
export type FieldPointType =
  | "inlet"         // 入水口
  | "outlet"        // 出水口
  | "canal"         // 水路
  | "caution"       // 注意箇所
  | "weed"          // 雑草箇所
  | "levee_damage"  // 畦崩れ箇所
  | "poor_drainage" // 水抜け不良箇所
  | "other";        // その他

export type FieldPoint = {
  id: string;
  fieldId: string;
  name: string;
  type: FieldPointType;
  status: "normal" | "needs_check" | "issue" | "resolved";
  lastRecord: string;
  waterLevel?: string;
  lngLat: [number, number];
  /** 地図ピン横のラベル（省略時は種別ラベル） */
  pinLabel?: string;
};

export type ScheduleItem = {
  time: string;
  title: string;
  fieldName: string;
  icon: "drop" | "waves" | "sprout";
  status: "予定" | "進行中";
};

export type RecordItem = {
  id: string;
  time: string;
  date: string;
  title: string;
  fieldName: string;
  fieldArea: string;
  category: "水管理" | "作業" | "異常" | "音声";
  pointType: "inlet" | "outlet" | "caution" | "weed";
  media: "photo" | "audio";
  photoCount?: number;
  audioDuration?: string;
};

export type Member = {
  name: string;
  role: "管理者" | "編集者" | "閲覧者";
};

export type RecordComment = {
  author: string;
  isRecorder?: boolean;
  text: string;
  timestamp: string;
};

/** 記録詳細画面のサンプルデータ */
export type RecordDetail = {
  id: string;
  fieldName: string;
  pointTypeLabel: string;
  statusLabel: string;
  title: string;
  address: string;
  recorder: string;
  recordedAt: string;
  summary: string;
  audioDuration: string;
  comments: RecordComment[];
};
