import type { Field, FieldPoint, Member, RecordDetail, RecordItem, ScheduleItem } from "../types";
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
      properties: { id: "field-a", name: "A田", color: "#3B82F6", area_sqm: 12000 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [138.8249, 37.4321],
          [138.8278, 37.43235],
          [138.83015, 37.43135],
          [138.8297, 37.42815],
          [138.8267, 37.42775],
          [138.82505, 37.42915],
          [138.8249, 37.4321],
        ]],
      },
    },
    {
      type: "Feature",
      id: "field-b",
      properties: { id: "field-b", name: "B田", color: "#EAB308", area_sqm: 8000 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [138.83005, 37.43215],
          [138.8349, 37.43205],
          [138.83615, 37.4302],
          [138.83555, 37.4281],
          [138.8324, 37.42795],
          [138.83005, 37.4286],
          [138.83005, 37.43215],
        ]],
      },
    },
    {
      type: "Feature",
      id: "field-c",
      properties: { id: "field-c", name: "C田", color: "#22C55E", area_sqm: 15000 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [138.8302, 37.4279],
          [138.8357, 37.42805],
          [138.83625, 37.4257],
          [138.8347, 37.42385],
          [138.8314, 37.42415],
          [138.82985, 37.42585],
          [138.8302, 37.4279],
        ]],
      },
    },
    {
      type: "Feature",
      id: "field-d",
      properties: { id: "field-d", name: "D田", color: "#A855F7", area_sqm: 9000 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [138.82475, 37.42785],
          [138.82995, 37.42775],
          [138.82965, 37.42435],
          [138.82715, 37.42395],
          [138.82465, 37.42515],
          [138.82475, 37.42785],
        ]],
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
    pinLabel: "水位異常",
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
  // GLOSSARY.md §6 追加種別サンプル
  {
    id: "point-a-canal",
    fieldId: "field-a",
    name: "A田 北側 水路",
    type: "canal",
    status: "normal",
    lastRecord: "2025年5月23日 14:00",
    lngLat: [138.827, 37.432],
  },
  {
    id: "point-b-levee",
    fieldId: "field-b",
    name: "B田 南西畦崩れ箇所",
    type: "levee_damage",
    status: "issue",
    lastRecord: "2025年5月22日 11:30",
    lngLat: [138.831, 37.428],
  },
  {
    id: "point-d-drainage",
    fieldId: "field-d",
    name: "D田 北東 水抜け不良",
    type: "poor_drainage",
    status: "needs_check",
    lastRecord: "2025年5月21日 09:00",
    waterLevel: "低め",
    lngLat: [138.829, 37.428],
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
  { id: "record-1", time: "17:15", date: "2025年5月24日（土）", recordedAt: "2025-05-24T17:15:00", title: "A田 取水口の確認", fieldId: "field-a", fieldName: "A田", fieldArea: "1.2ha", category: "水管理", pointType: "inlet", status: "resolved", media: "photo", photoCount: 3 },
  { id: "record-2", time: "13:30", date: "2025年5月24日（土）", recordedAt: "2025-05-24T13:30:00", title: "C田 畦畔草刈り", fieldId: "field-c", fieldName: "C田", fieldArea: "1.5ha", category: "作業", pointType: "weed", status: "resolved", media: "photo", photoCount: 5 },
  { id: "record-3", time: "10:15", date: "2025年5月24日（土）", recordedAt: "2025-05-24T10:15:00", title: "B田 異常箇所の記録", fieldId: "field-b", fieldName: "B田", fieldArea: "0.8ha", category: "異常", pointType: "caution", status: "open", media: "photo", photoCount: 2 },
  { id: "record-4", time: "08:00", date: "2025年5月24日（土）", recordedAt: "2025-05-24T08:00:00", title: "A田 圃場の状況メモ", fieldId: "field-a", fieldName: "A田", fieldArea: "1.2ha", category: "音声", pointType: "inlet", status: "resolved", media: "audio", audioDuration: "0:32" },
  { id: "record-5", time: "16:20", date: "2025年5月23日（金）", recordedAt: "2025-05-23T16:20:00", title: "B田 落水口の確認", fieldId: "field-b", fieldName: "B田", fieldArea: "0.8ha", category: "水管理", pointType: "outlet", status: "resolved", media: "photo", photoCount: 1 },
  { id: "record-6", time: "11:40", date: "2025年5月23日（金）", recordedAt: "2025-05-23T11:40:00", title: "A田 畦畔草刈り", fieldId: "field-a", fieldName: "A田", fieldArea: "1.2ha", category: "作業", pointType: "weed", status: "resolved", media: "photo", photoCount: 4 },
  { id: "record-7", time: "09:05", date: "2025年5月23日（金）", recordedAt: "2025-05-23T09:05:00", title: "C田 入水口の確認", fieldId: "field-c", fieldName: "C田", fieldArea: "1.5ha", category: "水管理", pointType: "inlet", status: "resolved", media: "photo", photoCount: 2 },
  { id: "record-8", time: "15:10", date: "2025年5月22日（木）", recordedAt: "2025-05-22T15:10:00", title: "C田 異常箇所の記録", fieldId: "field-c", fieldName: "C田", fieldArea: "1.5ha", category: "異常", pointType: "caution", status: "needs_check", media: "photo", photoCount: 3 },
];

// メンバー
export const members: Member[] = [
  { name: "田中 太郎（あなた）", role: "管理者" },
  { name: "田中 花子", role: "編集者" },
  { name: "田中 次郎", role: "閲覧者" },
];

// 記録詳細のサンプル（参照モック準拠）
export const sampleRecordDetail: RecordDetail = {
  id: "record-sample",
  fieldId: null,
  fieldName: "A田",
  pointId: null,
  pointType: "outlet",
  pointTypeLabel: "出水口",
  statusLabel: "要確認",
  status: "needs_check",
  title: "北西側 出水口",
  address: "新潟県長岡市（A田 北西側）",
  recorder: "お父さん",
  recordedAt: "2025年5月24日（土）07:45",
  summary: "水量はやや少なめ。ゴミの詰まりはなし。劣化も特になし。",
  note: "",
  recordType: "check",
  latitude: null,
  longitude: null,
  comments: [
    { author: "お父さん", isRecorder: true, text: "今朝の確認記録です。念のため夕方にも見に行きます。", timestamp: "5月24日 07:45" },
    { author: "お母さん", text: "ありがとう！夕方にもう一度確認しておくね。", timestamp: "5月24日 08:12" },
    { author: "お兄ちゃん", text: "夕方に見てきたよ！特に問題なし。対応済みにしておくね。", timestamp: "5月24日 17:32" },
  ],
};

// 固定ポイント集計（メニュー画面）
export const pointStats = {
  inlet: 5,
  outlet: 3,
  caution: 7,
};
