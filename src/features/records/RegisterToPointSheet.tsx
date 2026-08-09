"use client";

import { useEffect, useState } from "react";
import { loadFarmData } from "../../lib/data/farm";
import { POINT_TYPE_META } from "../map/pointTypeMeta";
import type { FieldPoint } from "../../types";

type Props = {
  fieldId: string;
  onSelect: (point: FieldPoint) => void;
  onClose: () => void;
};

/**
 * 記録の写真をピンの台帳に登録する際、記録に point_id が無い場合に出す
 * 「どのピンに登録するか」選択シート。同じ田んぼのピンだけに絞って出す。
 */
export default function RegisterToPointSheet({ fieldId, onSelect, onClose }: Props) {
  const [points, setPoints] = useState<FieldPoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFarmData().then((farm) => {
      if (cancelled) return;
      setPoints(farm.points.filter((p) => p.fieldId === fieldId));
    });
    return () => {
      cancelled = true;
    };
  }, [fieldId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <h2 className="text-base font-bold text-gray-900">どのピンの台帳に登録しますか？</h2>
        <p className="mt-0.5 text-xs text-gray-500">この田んぼに登録済みのピンから選びます</p>

        <div className="mt-3 max-h-[50vh] space-y-1.5 overflow-y-auto">
          {points === null ? (
            <div className="space-y-1.5">
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : points.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
              この田んぼにはまだピンがありません。マップでピンを追加してから登録できます
            </p>
          ) : (
            points.map((point) => {
              const meta = POINT_TYPE_META[point.type] ?? POINT_TYPE_META.other;
              return (
                <button
                  key={point.id}
                  onClick={() => onSelect(point)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 text-left shadow-sm transition-colors hover:bg-gray-50"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <meta.Icon className={`h-4 w-4 ${meta.color}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{point.name || meta.label}</p>
                    <p className="text-xs text-gray-400">{meta.label}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
