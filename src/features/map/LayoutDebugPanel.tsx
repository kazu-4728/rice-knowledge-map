"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Map as MLMap } from "maplibre-gl";

type Snapshot = {
  label: string;
  ts: number;
  win: {
    innerWidth: number;
    innerHeight: number;
    devicePixelRatio: number;
    scrollX: number;
    scrollY: number;
  };
  vv: {
    width: number | null;
    height: number | null;
    scale: number | null;
    offsetLeft: number | null;
    offsetTop: number | null;
  };
  doc: {
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
  };
  body: {
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
  };
  rects: {
    rootEl: DOMRect | null;
    mapContainer: DOMRect | null;
    mlContainer: DOMRect | null;
    mlCanvas: DOMRect | null;
  };
  canvas: {
    clientWidth: number | null;
    clientHeight: number | null;
    pixelWidth: number | null;
    pixelHeight: number | null;
  };
  map: {
    zoom: number | null;
    center: [number, number] | null;
  };
  ancestors: AncestorInfo[];
};

type AncestorInfo = {
  tag: string;
  className: string;
  rect: { width: number; height: number; left: number; top: number; right: number; bottom: number };
  transform: string;
  zoom: string;
  position: string;
  overflow: string;
};

function getAncestors(el: HTMLElement | null): AncestorInfo[] {
  const result: AncestorInfo[] = [];
  let cur = el;
  while (cur && cur !== document.documentElement) {
    const style = getComputedStyle(cur);
    const r = cur.getBoundingClientRect();
    result.push({
      tag: cur.tagName.toLowerCase(),
      className: cur.className?.toString().slice(0, 60) || "",
      rect: { width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom },
      transform: style.transform || "none",
      zoom: style.zoom || "1",
      position: style.position,
      overflow: `${style.overflowX}/${style.overflowY}`,
    });
    cur = cur.parentElement;
  }
  return result;
}

function takeSnapshot(
  label: string,
  rootEl: HTMLDivElement | null,
  mapContainer: HTMLDivElement | null,
  map: MLMap | null,
): Snapshot {
  const vv = window.visualViewport;
  const mlContainer = map?.getContainer() ?? null;
  const mlCanvas = map?.getCanvas() ?? null;

  return {
    label,
    ts: Date.now(),
    win: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    vv: {
      width: vv?.width ?? null,
      height: vv?.height ?? null,
      scale: vv?.scale ?? null,
      offsetLeft: vv?.offsetLeft ?? null,
      offsetTop: vv?.offsetTop ?? null,
    },
    doc: {
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    },
    body: {
      clientWidth: document.body.clientWidth,
      clientHeight: document.body.clientHeight,
      scrollWidth: document.body.scrollWidth,
      scrollHeight: document.body.scrollHeight,
    },
    rects: {
      rootEl: rootEl?.getBoundingClientRect() ?? null,
      mapContainer: mapContainer?.getBoundingClientRect() ?? null,
      mlContainer: mlContainer?.getBoundingClientRect() ?? null,
      mlCanvas: mlCanvas?.getBoundingClientRect() ?? null,
    },
    canvas: {
      clientWidth: mlCanvas?.clientWidth ?? null,
      clientHeight: mlCanvas?.clientHeight ?? null,
      pixelWidth: mlCanvas?.width ?? null,
      pixelHeight: mlCanvas?.height ?? null,
    },
    map: {
      zoom: map?.getZoom() ?? null,
      center: map ? [map.getCenter().lng, map.getCenter().lat] : null,
    },
    ancestors: getAncestors(mapContainer),
  };
}

type Props = {
  rootRef: React.RefObject<HTMLDivElement | null>;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<MLMap | null>;
};

export function useLayoutDebug(
  rootRef: React.RefObject<HTMLDivElement | null>,
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
  mapRef: React.RefObject<MLMap | null>,
) {
  const [enabled, setEnabled] = useState(false);
  const snapshotsRef = useRef<Snapshot[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(new URLSearchParams(window.location.search).has("layoutDebug"));
  }, []);

  const captureSequence = useCallback(
    (triggerLabel: string) => {
      if (!enabled) return;

      const snap = (label: string) => {
        const s = takeSnapshot(label, rootRef.current, mapContainerRef.current, mapRef.current);
        snapshotsRef.current = [...snapshotsRef.current.slice(-19), s];
        setSnapshots([...snapshotsRef.current]);
        console.log(`[LayoutDebug] ${label}`, s);
      };

      snap(`${triggerLabel} (即時)`);

      requestAnimationFrame(() => {
        snap(`${triggerLabel} (rAF-1)`);
        requestAnimationFrame(() => {
          snap(`${triggerLabel} (rAF-2)`);
        });
      });

      setTimeout(() => snap(`${triggerLabel} (250ms)`), 250);
      setTimeout(() => snap(`${triggerLabel} (500ms)`), 500);
    },
    [enabled, rootRef, mapContainerRef, mapRef],
  );

  return { debugEnabled: enabled, snapshots, captureSequence };
}

export default function LayoutDebugPanel({ rootRef, mapContainerRef, mapRef }: Props) {
  const { debugEnabled, snapshots, captureSequence } = useLayoutDebug(rootRef, mapContainerRef, mapRef);
  const [expanded, setExpanded] = useState(false);

  if (!debugEnabled) return null;

  const latest = snapshots[snapshots.length - 1];
  const swMatch = latest ? latest.doc.scrollWidth === latest.win.innerWidth : null;
  const shOk = latest ? latest.doc.scrollHeight <= latest.win.innerHeight + 1 : null;

  return (
    <div
      className="fixed left-1 bottom-28 z-[100] max-h-[50dvh] w-64 overflow-y-auto rounded-lg bg-black/85 p-2 text-[10px] leading-tight text-green-300 font-mono backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-white">Layout Debug</span>
        <div className="flex gap-1">
          <button
            onClick={() => captureSequence("手動")}
            className="rounded bg-green-700 px-1.5 py-0.5 text-white"
          >
            計測
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded bg-gray-700 px-1.5 py-0.5 text-white"
          >
            {expanded ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {latest && (
        <div className="space-y-0.5">
          <div>
            scrollW===innerW:{" "}
            <span className={swMatch ? "text-green-400" : "text-red-400 font-bold"}>
              {swMatch ? "OK" : `NG (${latest.doc.scrollWidth} vs ${latest.win.innerWidth})`}
            </span>
          </div>
          <div>
            scrollH ok:{" "}
            <span className={shOk ? "text-green-400" : "text-yellow-400"}>
              {shOk ? "OK" : `${latest.doc.scrollHeight} vs ${latest.win.innerHeight}`}
            </span>
          </div>
          <div>vv: {latest.vv.width}x{latest.vv.height} scale={latest.vv.scale}</div>
          <div>dpr: {latest.win.devicePixelRatio} scroll: {latest.win.scrollX},{latest.win.scrollY}</div>
          {latest.rects.mlCanvas && (
            <div>canvas: {Math.round(latest.rects.mlCanvas.width)}x{Math.round(latest.rects.mlCanvas.height)}</div>
          )}
          {latest.canvas.pixelWidth != null && (
            <div>canvas px: {latest.canvas.pixelWidth}x{latest.canvas.pixelHeight}</div>
          )}
          <div>zoom: {latest.map.zoom?.toFixed(2)}</div>
        </div>
      )}

      {expanded && snapshots.length > 0 && (
        <div className="mt-2 space-y-2 border-t border-green-800 pt-2">
          {snapshots.map((s, i) => (
            <div key={`${s.ts}-${i}`} className="border-b border-green-900 pb-1">
              <div className="font-bold text-yellow-300">{s.label}</div>
              <div>win: {s.win.innerWidth}x{s.win.innerHeight}</div>
              <div>doc: cw={s.doc.clientWidth} sw={s.doc.scrollWidth}</div>
              <div>doc: ch={s.doc.clientHeight} sh={s.doc.scrollHeight}</div>
              <div>body: cw={s.body.clientWidth} sw={s.body.scrollWidth}</div>
              <div>vv: {s.vv.width}x{s.vv.height} s={s.vv.scale} oL={s.vv.offsetLeft} oT={s.vv.offsetTop}</div>
              {s.rects.rootEl && <div>root: {Math.round(s.rects.rootEl.width)}x{Math.round(s.rects.rootEl.height)} L={Math.round(s.rects.rootEl.left)}</div>}
              {s.rects.mapContainer && <div>mapCont: {Math.round(s.rects.mapContainer.width)}x{Math.round(s.rects.mapContainer.height)} L={Math.round(s.rects.mapContainer.left)}</div>}
              {s.rects.mlContainer && <div>mlCont: {Math.round(s.rects.mlContainer.width)}x{Math.round(s.rects.mlContainer.height)} L={Math.round(s.rects.mlContainer.left)}</div>}
              {s.rects.mlCanvas && <div>mlCanvas: {Math.round(s.rects.mlCanvas.width)}x{Math.round(s.rects.mlCanvas.height)} L={Math.round(s.rects.mlCanvas.left)}</div>}
              {s.canvas.pixelWidth != null && <div>canvas px: {s.canvas.pixelWidth}x{s.canvas.pixelHeight} client: {s.canvas.clientWidth}x{s.canvas.clientHeight}</div>}
              <div>zoom: {s.map.zoom?.toFixed(2)} center: {s.map.center?.[0].toFixed(4)},{s.map.center?.[1].toFixed(4)}</div>
              <div className="mt-0.5 text-gray-400">ancestors ({s.ancestors.length}):</div>
              {s.ancestors.map((a, ai) => (
                <div key={ai} className="ml-1">
                  {"  ".repeat(ai)}{a.tag} {Math.round(a.rect.width)}x{Math.round(a.rect.height)} L={Math.round(a.rect.left)} pos={a.position} ovf={a.overflow}
                  {a.transform !== "none" && <span className="text-red-400"> tf={a.transform}</span>}
                  {a.zoom !== "1" && a.zoom !== "" && <span className="text-red-400"> zoom={a.zoom}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
