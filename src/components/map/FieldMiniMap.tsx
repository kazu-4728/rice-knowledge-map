"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSON } from "geojson";
import { IconExpand } from "../ui/icons";

type Props = {
  /** タップ時の遷移先（マップ画面） */
  href: string;
  /** 田んぼの輪郭（あれば塗りつぶし表示する） */
  boundary?: GeoJSON.Polygon | null;
  /** 輪郭が無い場合の中心候補（記録地点・ポイント等） */
  points?: [number, number][];
  className?: string;
  ariaLabel?: string;
};

/**
 * 場所確認用の小さな地図（設計原則: 主役の原則。地図が主役なのはマップ画面のみで、
 * 場所詳細・記録では実写写真が主役、地図は確認用の小さな脇役として埋め込む）。
 * 操作不可（tap-throughでマップ画面へ遷移）の非インタラクティブなMapLibre表示。
 */
export function FieldMiniMap({ href, boundary, points = [], className = "", ariaLabel = "マップで見る" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const depKey = JSON.stringify({ boundary, points });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const coords: [number, number][] =
      boundary?.coordinates?.[0]?.map((c) => [c[0], c[1]] as [number, number]) ?? points;
    if (coords.length === 0) return;

    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const center: [number, number] = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];

      map = new maplibre.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            gsi: {
              type: "raster",
              tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
              tileSize: 256,
            },
          },
          layers: [{ id: "gsi-layer", type: "raster", source: "gsi" }],
        },
        center,
        zoom: 16,
        interactive: false,
        attributionControl: false,
      });

      // レイアウト確定前にcanvasが初期化されるとぼやけたまま残るため、
      // コンテナのサイズ変化に追従してresizeする（本体マップと同じ多重防御）
      resizeObserver = new ResizeObserver(() => map?.resize());
      resizeObserver.observe(containerRef.current);

      map.on("load", () => {
        if (cancelled || !map) return;
        if (boundary) {
          map.addSource("field", { type: "geojson", data: { type: "Feature", properties: {}, geometry: boundary } });
          // 航空写真の見え方を主役にするため塗りは薄く、輪郭線で場所を示す
          map.addLayer({ id: "field-fill", type: "fill", source: "field", paint: { "fill-color": "#22c55e", "fill-opacity": 0.15 } });
          map.addLayer({ id: "field-line", type: "line", source: "field", paint: { "line-color": "#16a34a", "line-width": 2.5 } });
        }
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibre.LngLatBounds(coords[0], coords[0])
        );
        // 小さいカードでpaddingを取りすぎるとズームが引けてタイルが霞むため最小限にする
        map.fitBounds(bounds, { padding: 10, animate: false, maxZoom: 18 });
      });
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  if (!boundary && points.length === 0) return null;

  return (
    <Link href={href} aria-label={ariaLabel} className={`relative block overflow-hidden bg-gray-200 ${className}`}>
      <div ref={containerRef} className="pointer-events-none h-full w-full" />
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/35 p-1 text-white">
        <IconExpand className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
