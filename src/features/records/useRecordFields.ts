"use client";

import { useEffect, useState } from "react";
import { loadFarmData } from "../../lib/data/farm";

export type FieldOption = { id: string; name: string; center: [number, number] | null };

/** 点がリング（経度緯度の多角形）の内側にあるか（ray casting法） */
function pointInRing([x, y]: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * 記録作成画面（写真・音声）で共用する田んぼ候補の読み込み。
 * 自分の田んぼ一覧を取得し、GPSで「いま立っている田んぼ」を自動選択する
 * （圏外なら最寄りのcentroid）。位置情報が取れなくても手動選択で記録できる。
 */
export function useRecordFields() {
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [farmError, setFarmError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFarmData().then((farm) => {
      if (cancelled) return;
      if (farm.mode === "demo" || farm.mode === "anon") {
        setNeedLogin(farm.mode === "anon");
        return;
      }
      if (farm.mode === "error") {
        setFarmError(true);
        return;
      }
      const options: FieldOption[] = farm.fieldsGeoJSON.features.flatMap((f) => {
        if (f.geometry.type !== "Polygon") return [];
        const ring = f.geometry.coordinates[0];
        const pts = ring.slice(0, -1);
        const center: [number, number] = [
          pts.reduce((s, c) => s + c[0], 0) / pts.length,
          pts.reduce((s, c) => s + c[1], 0) / pts.length,
        ];
        return [{ id: String(f.id ?? f.properties?.id ?? ""), name: String(f.properties?.name ?? ""), center }];
      });
      setFields(options);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const here: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            setLocation({ lng: here[0], lat: here[1] });
            // いま立っている田んぼがあれば自動選択、なければ一番近い田んぼ
            setSelectedFieldId((prev) => {
              if (prev) return prev;
              const inside = farm.fieldsGeoJSON.features.find(
                (f) => f.geometry.type === "Polygon" && pointInRing(here, f.geometry.coordinates[0])
              );
              if (inside) return String(inside.id ?? inside.properties?.id ?? "");
              let best: FieldOption | null = null;
              let bestDist = Infinity;
              for (const o of options) {
                if (!o.center) continue;
                const d = (o.center[0] - here[0]) ** 2 + (o.center[1] - here[1]) ** 2;
                if (d < bestDist) {
                  bestDist = d;
                  best = o;
                }
              }
              return best?.id ?? null;
            });
          },
          () => {
            // 位置情報なしでも記録は可能（田んぼは手動選択）
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { fields, selectedFieldId, setSelectedFieldId, location, setLocation, needLogin, farmError };
}
