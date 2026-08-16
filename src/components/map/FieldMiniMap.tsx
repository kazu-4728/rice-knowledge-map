"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSON } from "geojson";
import { IconExpand } from "../ui/icons";

export type MiniMapMarker = {
  /** 同一画面内で写真とピンを対応付ける識別子 */
  id?: string;
  lngLat: [number, number];
  /** ピン内に出す短い文字（写真の連番など）。省略時は点のみ */
  label?: string;
  /** ピンの真上に出す白いラベル札（例:「入水口」）。指定時はドットの色もcolorに従う */
  chipLabel?: string;
  /** ドット・ラベル札の色（省略時は既定の緑） */
  color?: string;
};

type Props = {
  /** タップ時の遷移先（マップ画面） */
  href?: string;
  /** 田んぼの輪郭（あれば塗りつぶし表示する） */
  boundary?: GeoJSON.Polygon | null;
  /** 輪郭が無い場合の中心候補（記録地点・ポイント等） */
  points?: [number, number][];
  /** 目に見えるピンを立てる地点（写真ごとの位置情報など）。表示範囲にも含める */
  markers?: MiniMapMarker[];
  /** 田んぼ名ラベル（本体マップと同じ白チップをHTML Markerで表示） */
  label?: string;
  className?: string;
  ariaLabel?: string;
  /**
   * true時はLinkでのマップ画面遷移を無効化し、タップした地点をonPickへ通知する
   * （固定ポイントの登録を、この田んぼのページ内から出ずに行うための位置指定モード）。
   */
  pickable?: boolean;
  onPick?: (lngLat: [number, number]) => void;
  /** 指定時は画面遷移せず、ピン選択を同一ページへ通知する */
  onMarkerSelect?: (markerId: string) => void;
  selectedMarkerId?: string | null;
};

/**
 * 場所確認用の小さな地図（設計原則: 主役の原則。地図が主役なのはマップ画面のみで、
 * 場所詳細・記録では実写写真が主役、地図は確認用の小さな脇役として埋め込む）。
 * 操作不可（tap-throughでマップ画面へ遷移）の非インタラクティブなMapLibre表示。
 */
export function FieldMiniMap({
  href = "/map",
  boundary,
  points = [],
  markers = [],
  label,
  className = "",
  ariaLabel = "マップで見る",
  pickable = false,
  onPick,
  onMarkerSelect,
  selectedMarkerId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const depKey = JSON.stringify({ boundary, points, markers, label, pickable, selectedMarkerId });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const baseCoords: [number, number][] =
      boundary?.coordinates?.[0]?.map((c) => [c[0], c[1]] as [number, number]) ?? points;
    // ピンを立てた地点が枠外に切れないよう、表示範囲の計算にも含める
    const coords: [number, number][] = [...baseCoords, ...markers.map((m) => m.lngLat)];
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
        // interactive:falseでもmap.on('click')は発火するため、パン/ズームは常に無効化したまま
        // タップ位置の取得だけ許可できる（小さい地図で誤操作しにくい）
        interactive: false,
        attributionControl: false,
      });

      if (pickable && onPick) {
        map.on("click", (e) => onPick([e.lngLat.lng, e.lngLat.lat]));
      }

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
        // 田んぼ名ラベル（本体マップのcreateFieldLabelと同じ白チップ。glyphs不要のHTML Marker）
        if (label) {
          const el = document.createElement("div");
          el.textContent = label;
          el.className =
            "rounded-lg glass-light px-2 py-0.5 text-[11px] font-bold text-emerald-900 shadow-md pointer-events-none whitespace-nowrap";
          new maplibre.Marker({ element: el, anchor: "center" }).setLngLat(center).addTo(map);
        }
        // 写真ごとの撮影位置・固定ポイントの目印（小さな丸ピン。種別ラベル付きの場合は上に白い札を添える）
        for (const marker of markers) {
          const selected = !!marker.id && marker.id === selectedMarkerId;
          const color = selected ? "#2563eb" : marker.color ?? "#059669";
          if (marker.chipLabel) {
            const wrap = document.createElement(marker.id && onMarkerSelect ? "button" : "div");
            wrap.className = `flex flex-col items-center gap-1 ${marker.id && onMarkerSelect ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`;
            if (wrap instanceof HTMLButtonElement) {
              wrap.type = "button";
              wrap.setAttribute("aria-label", `${marker.chipLabel}を選択`);
              wrap.setAttribute("aria-pressed", String(selected));
              wrap.addEventListener("click", (event) => {
                event.stopPropagation();
                onMarkerSelect?.(marker.id!);
              });
            }
            const chip = document.createElement("div");
            chip.textContent = marker.chipLabel;
            chip.className = selected
              ? "rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap"
              : "rounded-md bg-white px-2 py-1 text-xs font-bold text-gray-800 shadow-md whitespace-nowrap";
            const dot = document.createElement("div");
            dot.className = selected
              ? "h-5 w-5 rounded-full border-[3px] border-white shadow-lg ring-2 ring-blue-500"
              : "h-4 w-4 rounded-full border-2 border-white shadow";
            dot.style.backgroundColor = color;
            wrap.appendChild(chip);
            wrap.appendChild(dot);
            new maplibre.Marker({ element: wrap, anchor: "bottom" }).setLngLat(marker.lngLat).addTo(map);
          } else {
            const el = document.createElement(marker.id && onMarkerSelect ? "button" : "div");
            el.textContent = marker.label ?? "";
            el.className = selected
              ? "pointer-events-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[3px] border-white text-[10px] font-bold text-white shadow-lg ring-2 ring-blue-500"
              : `flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow ${marker.id && onMarkerSelect ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`;
            el.style.backgroundColor = color;
            if (el instanceof HTMLButtonElement) {
              el.type = "button";
              el.setAttribute("aria-label", `${marker.chipLabel ?? marker.label ?? "地点"}を選択`);
              el.setAttribute("aria-pressed", String(selected));
              el.addEventListener("click", (event) => {
                event.stopPropagation();
                onMarkerSelect?.(marker.id!);
              });
            }
            new maplibre.Marker({ element: el, anchor: "center" }).setLngLat(marker.lngLat).addTo(map);
          }
        }
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibre.LngLatBounds(coords[0], coords[0])
        );
        // 周囲の道路・建物が見えて「どこか」が分かる程度に引く（寄りすぎると場所が分からない）
        map.fitBounds(bounds, { padding: 24, animate: false, maxZoom: boundary ? 16 : 15.5 });
      });
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      map?.remove();
    };
    // depKeyでboundary/points/markers/label/pickableの変化を検知するため個別列挙はしない。
    // onPickはクリックハンドラ内で直接参照するため、差し替わった時に古い関数を掴んだままに
    // ならないよう依存配列に含める（レビュー指摘: 2026-08-11）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, onPick, onMarkerSelect]);

  if (!boundary && points.length === 0 && markers.length === 0) return null;

  if (pickable) {
    return (
      <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
        <div ref={containerRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-2">
          <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white">
            タップして位置を指定
          </span>
        </div>
      </div>
    );
  }

  if (onMarkerSelect) {
    return (
      <div role="group" aria-label={ariaLabel} className={`relative overflow-hidden bg-gray-200 ${className}`}>
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={`relative block overflow-hidden bg-gray-200 ${className}`}>
      <div ref={containerRef} className="pointer-events-none h-full w-full" />
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/35 p-1 text-white">
        <IconExpand className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
