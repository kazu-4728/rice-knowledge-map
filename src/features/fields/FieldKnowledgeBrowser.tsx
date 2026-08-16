"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON } from "geojson";
import { FieldMiniMap } from "../../components/map/FieldMiniMap";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import {
  IconBookOpen,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconClose,
  IconMap,
  IconPencil,
  IconPlus,
} from "../../components/ui/icons";
import type { FieldPoint, FieldPointType, RecordItem } from "../../types";
import { PIN_COLORS, TYPE_LABELS } from "../map/mapPins";

const FIXED_SLOT_TYPES: FieldPointType[] = ["inlet", "outlet", "machine_entry"];

const POINT_FALLBACKS: Partial<Record<FieldPointType, string>> = {
  inlet: "/assets/knowledge/inlet.webp",
  outlet: "/assets/knowledge/canal.webp",
  canal: "/assets/knowledge/canal.webp",
  machine_entry: "/assets/knowledge/machine-entry.webp",
};

function shortPointName(fieldName: string, point: FieldPoint): string {
  return point.name.replace(fieldName, "").trim() || TYPE_LABELS[point.type];
}

function inheritedFacts(point: FieldPoint): string[] {
  const facts = (point.memo ?? "")
    .split(/[。\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return facts.length > 0 ? facts : ["まだ手順が登録されていません"];
}

function KnowledgeManualSheet({
  fieldName,
  point,
  photoUrl,
  boundary,
  onClose,
  onEdit,
}: {
  fieldName: string;
  point: FieldPoint;
  photoUrl: string;
  boundary: GeoJSON.Polygon | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const facts = inheritedFacts(point);
  const warning = facts.find((fact) => fact.includes("二人") || fact.includes("危険") || fact.includes("注意"));

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/55" role="dialog" aria-modal="true" aria-label={`${point.name}の詳しい手順`}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-[#fffdf7] pb-28">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-emerald-950 px-3 text-white">
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="閉じる">
            <IconClose className="h-6 w-6" />
          </button>
          <span className="rounded-lg border border-white/55 px-2 py-1 text-xs font-bold">{fieldName}</span>
          <h2 className="truncate text-lg font-bold">{shortPointName(fieldName, point)}</h2>
        </header>

        <div className="relative h-72 overflow-hidden bg-gray-200">
          <RemotePhoto src={photoUrl} alt={point.name} className="h-full w-full" fallbackVariant="water" />
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-5 py-4 text-white">
            <p className="text-3xl font-black tracking-tight">いつもの手順</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold"><IconCamera className="h-4 w-4" />写真付き・{facts.length}手順</p>
          </div>
        </div>

        <section className="px-5 py-5">
          <ol className="divide-y divide-stone-200">
            {facts.map((fact, index) => (
              <li key={`${fact}-${index}`} className="grid grid-cols-[3rem_1fr] gap-3 py-5 first:pt-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-xl font-black text-white">{index + 1}</span>
                <div>
                  <p className="text-lg font-bold leading-relaxed text-stone-900">{fact}</p>
                  {index === 0 && <p className="mt-1 text-sm leading-relaxed text-stone-600">写真と現地の状態を見比べて確認します</p>}
                </div>
              </li>
            ))}
          </ol>

          {warning && (
            <div className="mt-2 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-center text-base font-bold text-amber-800">
              {warning}
            </div>
          )}

          <FieldMiniMap
            boundary={boundary}
            points={[point.lngLat]}
            markers={[{ id: point.id, lngLat: point.lngLat, chipLabel: shortPointName(fieldName, point), color: PIN_COLORS[point.type] }]}
            selectedMarkerId={point.id}
            onMarkerSelect={() => undefined}
            label={fieldName}
            className="mt-5 h-36 rounded-2xl"
            ariaLabel="同じ画面で位置を確認"
          />
          <p className="mt-2 text-center text-sm font-bold text-emerald-800">同じ画面で位置を確認</p>

          <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4 text-sm text-stone-600">
            <span>知識の確認日　{point.lastRecord.split(" ")[0]}</span>
            <button type="button" onClick={onEdit} className="flex min-h-11 items-center gap-1.5 font-bold text-emerald-800">
              <IconPencil className="h-4 w-4" />写真を追加
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

type Props = {
  fieldId: string;
  fieldName: string;
  boundary: GeoJSON.Polygon | null;
  coverImageUrl?: string;
  points: FieldPoint[];
  pointThumbs: Record<string, string>;
  records: RecordItem[];
  initialPointId?: string | null;
  onRegisterPoint: (type: FieldPointType) => void;
  onEditPoint: (point: FieldPoint) => void;
  onCoverPhotoSelect: (file: File) => Promise<void>;
};

export default function FieldKnowledgeBrowser({
  fieldId,
  fieldName,
  boundary,
  coverImageUrl,
  points,
  pointThumbs,
  records,
  initialPointId,
  onRegisterPoint,
  onEditPoint,
  onCoverPhotoSelect,
}: Props) {
  const [view, setView] = useState<"photos" | "map">("map");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(initialPointId ?? points[0]?.id ?? null);
  const [manualOpen, setManualOpen] = useState(false);
  const [coverPhotoError, setCoverPhotoError] = useState<string | null>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPointId && points.some((point) => point.id === initialPointId)) setSelectedPointId(initialPointId);
  }, [initialPointId, points]);

  useEffect(() => {
    if (!selectedPointId && points.length > 0) setSelectedPointId(points[0].id);
  }, [points, selectedPointId]);

  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? points[0] ?? null;
  const selectedPhoto = selectedPoint
    ? pointThumbs[selectedPoint.id] ?? POINT_FALLBACKS[selectedPoint.type] ?? coverImageUrl ?? "/assets/knowledge/canal.webp"
    : coverImageUrl ?? "/assets/knowledge/canal.webp";
  const selectedRecords = selectedPoint ? records.filter((record) => record.pointId === selectedPoint.id) : [];
  const latestChange = selectedRecords[0];

  const slots = useMemo(() => {
    const ordered: Array<{ key: string; type: FieldPointType; point: FieldPoint | null }> = [];
    for (const type of FIXED_SLOT_TYPES) {
      const matches = points.filter((point) => point.type === type);
      if (matches.length === 0) ordered.push({ key: `empty-${type}`, type, point: null });
      else matches.forEach((point) => ordered.push({ key: point.id, type, point }));
    }
    points.filter((point) => !FIXED_SLOT_TYPES.includes(point.type)).forEach((point) => ordered.push({ key: point.id, type: point.type, point }));
    return ordered;
  }, [points]);

  const selectPoint = useCallback((pointId: string, revealTile: boolean) => {
    setSelectedPointId(pointId);
    if (revealTile) requestAnimationFrame(() => tileRefs.current[pointId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
  }, []);
  const selectPointFromMap = useCallback((pointId: string) => selectPoint(pointId, true), [selectPoint]);

  return (
    <section className="overflow-hidden rounded-3xl bg-[#fffdf7] shadow-[0_18px_55px_-32px_rgba(20,83,45,0.55)]">
      <div className="grid grid-cols-2 border-b border-stone-200 bg-white p-2">
        <button type="button" onClick={() => setView("photos")} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${view === "photos" ? "bg-emerald-950 text-white" : "text-stone-700"}`} aria-pressed={view === "photos"}>
          <IconCamera className="h-5 w-5" />写真で探す
        </button>
        <button type="button" onClick={() => setView("map")} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${view === "map" ? "bg-emerald-950 text-white" : "text-stone-700"}`} aria-pressed={view === "map"}>
          <IconMap className="h-5 w-5" />地図で探す
        </button>
      </div>

      {view === "map" ? (
        <FieldMiniMap
          boundary={boundary}
          points={points.map((point) => point.lngLat)}
          markers={points.map((point) => ({ id: point.id, lngLat: point.lngLat, chipLabel: shortPointName(fieldName, point), color: PIN_COLORS[point.type] }))}
          selectedMarkerId={selectedPoint?.id}
          onMarkerSelect={selectPointFromMap}
          label={fieldName}
          className="h-72 w-full"
          ariaLabel="写真と連動する場所の地図"
        />
      ) : (
        <div className="relative h-72 bg-stone-200">
          <RemotePhoto src={selectedPhoto} alt={selectedPoint?.name ?? fieldName} className="h-full w-full" fallbackVariant="field" />
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-white">
            <p className="text-xl font-bold">{selectedPoint ? shortPointName(fieldName, selectedPoint) : fieldName}</p>
            <p className="mt-0.5 text-xs">写真を選ぶと地図のピンも切り替わります</p>
          </div>
          <button type="button" onClick={() => coverInputRef.current?.click()} className="absolute right-3 top-3 flex min-h-11 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-emerald-900 shadow-md">
            <IconCamera className="h-4 w-4" />田んぼ写真を変更
          </button>
        </div>
      )}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setCoverPhotoError(null);
            void onCoverPhotoSelect(file).catch(() => {
              setCoverPhotoError("写真を変更できませんでした。通信環境を確認して、もう一度お試しください");
            });
          }
          event.currentTarget.value = "";
        }}
      />
      {coverPhotoError && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {coverPhotoError}
        </p>
      )}

      <div className="border-b border-stone-200 px-3 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slots.map(({ key, type, point }) => {
            const active = !!point && point.id === selectedPoint?.id;
            const photo = point ? pointThumbs[point.id] ?? POINT_FALLBACKS[type] : POINT_FALLBACKS[type];
            return (
              <button
                key={key}
                ref={(node) => { if (point) tileRefs.current[point.id] = node; }}
                type="button"
                onClick={() => point ? selectPoint(point.id, false) : onRegisterPoint(type)}
                className={`relative w-28 shrink-0 overflow-hidden rounded-2xl border-2 bg-white text-left ${active ? "border-blue-600 shadow-md" : "border-stone-200"}`}
                aria-pressed={active}
              >
                <RemotePhoto src={photo} alt="" className="h-20 w-full" fallbackVariant={type === "inlet" || type === "outlet" || type === "canal" ? "water" : "field"} />
                <span className="block truncate px-2 py-2 text-xs font-bold text-stone-900">{point ? shortPointName(fieldName, point) : TYPE_LABELS[type]}</span>
                {!point && <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-800 shadow"><IconPlus className="h-4 w-4" /></span>}
                {active && <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow"><IconCheck className="h-4 w-4" /></span>}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs font-bold text-blue-700">ピンと写真は連動します</p>
      </div>

      {selectedPoint ? (
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black tracking-tight text-stone-950">{shortPointName(fieldName, selectedPoint)}</p>
              <p className="mt-1 text-sm text-stone-500">{TYPE_LABELS[selectedPoint.type]}・最終確認 {selectedPoint.lastRecord}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">通常どおり</span>
          </div>

          <div className="rounded-2xl border border-emerald-900/20 bg-white p-4">
            <div className="flex items-center gap-2 text-emerald-900"><IconBookOpen className="h-5 w-5" /><h3 className="text-base font-black">引き継ぐ知識</h3></div>
            <ul className="mt-3 divide-y divide-stone-100">
              {inheritedFacts(selectedPoint).map((fact, index) => <li key={`${fact}-${index}`} className="py-2.5 text-base font-semibold leading-relaxed text-stone-800">{fact}</li>)}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-black text-amber-800">今年の記録</p>
            {latestChange ? (
              <Link href={`/records/${latestChange.id}`} className="mt-1 flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-800">
                <span className="min-w-0 flex-1 truncate">{latestChange.date}　{latestChange.title}</span><IconChevronRight className="h-4 w-4" />
              </Link>
            ) : <p className="mt-1 text-sm text-stone-600">この場所の今年の記録はまだありません</p>}
          </div>

          <button type="button" onClick={() => setManualOpen(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-base font-black text-white shadow-sm active:scale-[0.99]">
            <IconBookOpen className="h-5 w-5" />手順と写真を見る<IconChevronRight className="h-5 w-5" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setView("map")} className="min-h-12 rounded-2xl border border-emerald-900/30 bg-white text-sm font-bold text-emerald-900">地図で位置を確認</button>
            <button type="button" onClick={() => onEditPoint(selectedPoint)} className="min-h-12 rounded-2xl border border-stone-300 bg-white text-sm font-bold text-stone-700">写真を確認・追加</button>
          </div>
          <Link href={`/records/new?field=${encodeURIComponent(fieldId)}&returnTo=${encodeURIComponent(`/fields/${fieldId}`)}`} className="flex min-h-12 items-center justify-center gap-2 text-sm font-bold text-emerald-800">
            <IconCamera className="h-4.5 w-4.5" />この場所の変化を記録する
          </Link>
        </div>
      ) : (
        <div className="p-6 text-center"><p className="text-sm text-stone-600">写真または地図から場所を選んでください</p></div>
      )}

      {manualOpen && selectedPoint && (
        <KnowledgeManualSheet fieldName={fieldName} point={selectedPoint} photoUrl={selectedPhoto} boundary={boundary} onClose={() => setManualOpen(false)} onEdit={() => { setManualOpen(false); onEditPoint(selectedPoint); }} />
      )}
    </section>
  );
}
