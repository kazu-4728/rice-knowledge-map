import type { Field, FieldPoint, Member, RecordItem, ScheduleItem } from "../types";
import type { GeoJSON } from "geojson";

// 田んぼ一覧
export const fields: Field[] = [
  { id: "field-a", name: "A田", label: "A田", area: "1.2ha", crop: "コシヒカリ", season: "分げつ期", color: "blue" },
  { id: "field-b", name: "B田", label: "B田", area: "0.8ha", crop: "コシヒカリ", season: "活着期", color: "yellow" },
  { id: "field-c", name: "C田", label: "C田", area: "1.5ha", crop: "新之助", season: "分げつ期", color: "green" },
  { id: "field-d", name: "D田", label: "D田", area: "0.9ha", crop: "こしいぶき", season: "初期", color: "purple" },
];

// 田んぼポリゴン（新潟県長岡市近辺のダミー座標）
export const fieldGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "field-a",
      properties: { id: "field-a", name: "A田", color: "#3B82F6" },
      geometry: {
        type: "Polygon",
        coordinates: [[[138.825, 37.432], [138.830, 37.432], [138.830, 37.428], [138.825, 37.428], [138.825, 37.432]]],
      },
    },
    {
      type: "Feature",
      id: "field-b",
      properties: { id: "field-b", name: "B田", color: "#EAB308" },
      geometry: {
        type: "Polygon",
        coordinates: [[[138.830, 37.432], [138.836, 37.432], [138.836, 37.428], [138.830, 37.428], [138.830, 37.432]]],
      },
    },
    {
      type: "Feature",
      id: "field-c",
      properties: { id: "field-c", name: "C田", color: "#22C55E" },
      geometry: {
        type: "Polygon",
        coordinates: [[[138.830, 37.428], [138.836, 37.428], [138.836, 37.424], [138.830, 37.424], [138.830, 37.428]]],
      },
    },
    {
      type: "Feature",
      id: "field-d",
      properties: { id: "field-d", name: "D田", color: "#A855F7" },
      geometry: {
        type: "Polygon",
        coordinates: [[[138.825, 37.428], [138.830, 37.428], [138.830, 37.424], [138.825, 37.424], [138.825, 37.428]]],
      },
    },
  ],
};

// 固定ポイント（地図座標付き）
export const fieldPoints: FieldPoint[] = [
  {
    id: "point-a-inlet",
    fieldId: "field-a",
    name: "A田 東側 入水口",
    type: "inlet",
    status: "normal",
    lastRecord: "2025年5月24日 08:15",
    waterLevel: "正常",
    lngLat: [138.829, 37.430],
  },
  {
    id: "point-b-inlet",
    fieldId: "field-b",
    name: "B田 北側 入水口",
    type: "inlet",
    status: "normal",
    lastRecord: "2025年5月24日 07:45",
    waterLevel: "正常",
    lngLat: [138.833, 37.431],
  },
  {
    id: "point-b-outlet",
    fieldId: "field-b",
    name: "B田 東側 出水口",
    type: "outlet",
    status: "normal",
    lastRecord: "2025年5月23日 16:20",
    waterLevel: "やや少なめ",
    lngLat: [138.835, 37.429],
  },
  {
    id: "point-c-caution",
    fieldId: "field-c",
    name: "C田 中央東側 水位異常",
    type: "caution",
    status: "needs_check",
    lastRecord: "2025年5月24日 10:15",
    waterLevel: "高め",
    lngLat: [138.832, 37.426],
  },
  {
    id: "point-c-outlet",
    fieldId: "field-c",
    name: "C田 南側 出水口",
    type: "outlet",
    status: "normal",
    lastRecord: "2025年5月22日 09:05",
    waterLevel: "正常",
    lngLat: [138.831, 37.425],
  },
  {
    id: "point-d-outlet",
    fieldId: "field-d",
    name: "D田 西側 出水口",
    type: "outlet",
    status: "normal",
    lastRecord: "2025年5月23日 09:05",
    waterLevel: "正常",
    lngLat: [138.826, 37.426],
  },
];

// 今日の予定
export const scheduleItems: ScheduleItem[] = [
  { time: "08:00", title: "A田 取水確認", fieldName: "A田（1.2ha）", icon: "drop", status: "予定" },
  { time: "10:30", title: "B田 中干し確認", fieldName: "B田（0.8ha）", icon: "waves", status: "進行中" },
  { time: "13:30", title: "C田 畦畔草刈り", fieldName: "C田（1.5ha）", icon: "sprout", status: "予定" },
];

// 最近の記録
export const recentRecords: RecordItem[] = [
  { id: "record-1", time: "17:15", date: "2025年5月24日（土）", title: "A田 取水口の確認", fieldName: "A田", fieldArea: "1.2ha", category: "水管理", pointType: "inlet", media: "photo", photoCount: 3 },
  { id: "record-2", time: "13:30", date: "2025年5月24日（土）", title: "C田 畦畔草刈り", fieldName: "C田", fieldArea: "1.5ha", category: "作業", pointType: "weed", media: "photo", photoCount: 5 },
  { id: "record-3", time: "10:15", date: "2025年5月24日（土）", title: "B田 異常箇所の記録", fieldName: "B田", fieldArea: "0.8ha", category: "異常", pointType: "caution", media: "photo", photoCount: 2 },
  { id: "record-4", time: "08:00", date: "2025年5月24日（土）", title: "A田 圃場の状況メモ", fieldName: "A田", fieldArea: "1.2ha", category: "音声", pointType: "inlet", media: "audio", audioDuration: "0:32" },
  { id: "record-5", time: "16:20", date: "2025年5月23日（金）", title: "B田 落水口の確認", fieldName: "B田", fieldArea: "0.8ha", category: "水管理", pointType: "outlet", media: "photo", photoCount: 1 },
];

// メンバー
export const members: Member[] = [
  { name: "作業者A（あなた）", role: "管理者" },
  { name: "作業者B", role: "編集者" },
  { name: "作業者C", role: "閲覧者" },
];
