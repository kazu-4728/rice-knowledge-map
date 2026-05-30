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

export type FieldPoint = {
  id: string;
  fieldId: string;
  name: string;
  type: "inlet" | "outlet" | "caution" | "weed";
  status: "normal" | "needs_check" | "issue" | "resolved";
  lastRecord: string;
  waterLevel?: string;
  position: { x: number; y: number };
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
