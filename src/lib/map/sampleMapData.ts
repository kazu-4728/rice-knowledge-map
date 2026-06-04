import type { FeatureCollection, Polygon } from "geojson";

export type FieldId = "field-a" | "field-b" | "field-c" | "field-d";
export type PointKind = "inlet" | "outlet" | "alert";

export type FieldArea = {
  id: FieldId;
  name: string;
  color: string;
  labelPosition: [number, number];
  polygon: [number, number][];
};

export type MapPoint = {
  id: string;
  fieldId: FieldId;
  label: string;
  kind: PointKind;
  position: [number, number];
};

export const mapCenter: [number, number] = [138.85105, 37.43015];

export const fields: FieldArea[] = [
  {
    id: "field-a",
    name: "A田",
    color: "#58b6ea",
    labelPosition: [138.85006, 37.43069],
    polygon: [
      [138.84918, 37.43142],
      [138.85072, 37.43158],
      [138.85088, 37.43013],
      [138.84934, 37.42998],
      [138.84902, 37.43069],
      [138.84918, 37.43142],
    ],
  },
  {
    id: "field-b",
    name: "B田",
    color: "#e4c83d",
    labelPosition: [138.85227, 37.4311],
    polygon: [
      [138.85137, 37.43185],
      [138.85314, 37.43169],
      [138.85316, 37.43074],
      [138.85155, 37.43052],
      [138.85137, 37.43185],
    ],
  },
  {
    id: "field-c",
    name: "C田",
    color: "#79c34a",
    labelPosition: [138.85212, 37.42928],
    polygon: [
      [138.85131, 37.43023],
      [138.85304, 37.4302],
      [138.85286, 37.42844],
      [138.8512, 37.42856],
      [138.85131, 37.43023],
    ],
  },
  {
    id: "field-d",
    name: "D田",
    color: "#9b79cf",
    labelPosition: [138.84975, 37.42884],
    polygon: [
      [138.84902, 37.42969],
      [138.85094, 37.42972],
      [138.85086, 37.4283],
      [138.84892, 37.42838],
      [138.84902, 37.42969],
    ],
  },
];

export const mapPoints: MapPoint[] = [
  { id: "a-west-inlet", fieldId: "field-a", label: "入水口", kind: "inlet", position: [138.84892, 37.43055] },
  { id: "a-east-inlet", fieldId: "field-a", label: "入水口", kind: "inlet", position: [138.85105, 37.43138] },
  { id: "b-east-outlet", fieldId: "field-b", label: "出水口", kind: "outlet", position: [138.85304, 37.43096] },
  { id: "c-east-outlet", fieldId: "field-c", label: "出水口", kind: "outlet", position: [138.85286, 37.4301] },
  { id: "c-alert", fieldId: "field-c", label: "水位異常", kind: "alert", position: [138.85122, 37.43003] },
  { id: "c-south-outlet", fieldId: "field-c", label: "出水口", kind: "outlet", position: [138.85119, 37.42843] },
  { id: "d-west-outlet", fieldId: "field-d", label: "出水口", kind: "outlet", position: [138.84873, 37.42856] },
];

export const fieldsGeoJson: FeatureCollection<Polygon, { id: FieldId; name: string; color: string }> = {
  type: "FeatureCollection",
  features: fields.map((field) => ({
    type: "Feature",
    properties: {
      id: field.id,
      name: field.name,
      color: field.color,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[...field.polygon, field.polygon[0]]],
    },
  })),
};

export function pointColor(kind: PointKind) {
  if (kind === "inlet") return "#2479cf";
  if (kind === "outlet") return "#3e9550";
  return "#e53935";
}
