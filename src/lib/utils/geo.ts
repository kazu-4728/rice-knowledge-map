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

export function formatAreaSqm(sqm: number): string {
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
  return `${sqm.toFixed(0)}㎡`;
}
