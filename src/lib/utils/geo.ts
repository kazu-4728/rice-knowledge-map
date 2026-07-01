const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 田んぼほどの広さ（数千㎡〜数ha）を前提にした概算面積計算。
 * 重心緯度を基準に等距円筒図法で平面へ投影し、シューレース公式で面積を求める。
 */
export function computeApproxAreaSqm(vertices: [number, number][]): number {
  if (vertices.length < 3) return 0;

  const refLat = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
  const cosRef = Math.cos(toRad(refLat));

  const points = vertices.map(([lng, lat]) => [
    toRad(lng) * EARTH_RADIUS_M * cosRef,
    toRad(lat) * EARTH_RADIUS_M,
  ]);

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** 2点間の実距離（ハーバサイン公式、メートル） */
export function distanceMeters(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);
  const sinDPhi = Math.sin(dPhi / 2);
  const sinDLambda = Math.sin(dLambda / 2);
  const h =
    sinDPhi * sinDPhi +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLambda * sinDLambda;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 1坪 = 400/121 ㎡（尺貫法とメートル法の法定換算値）。1反 = 300坪。
const TSUBO_SQM = 400 / 121;
const TAN_SQM = TSUBO_SQM * 300;

export type AreaUnit = "ha" | "tan" | "sqm";

export const AREA_UNIT_ORDER: AreaUnit[] = ["ha", "tan", "sqm"];

const AREA_UNIT_INFO: Record<AreaUnit, { sqmPerUnit: number; label: string; decimals: number }> = {
  ha: { sqmPerUnit: 10000, label: "ha", decimals: 2 },
  tan: { sqmPerUnit: TAN_SQM, label: "反", decimals: 2 },
  sqm: { sqmPerUnit: 1, label: "㎡", decimals: 0 },
};

export function formatAreaSqm(sqm: number, unit: AreaUnit = "ha"): string {
  const info = AREA_UNIT_INFO[unit];
  return `${(sqm / info.sqmPerUnit).toFixed(info.decimals)}${info.label}`;
}

export function nextAreaUnit(unit: AreaUnit): AreaUnit {
  const i = AREA_UNIT_ORDER.indexOf(unit);
  return AREA_UNIT_ORDER[(i + 1) % AREA_UNIT_ORDER.length];
}
