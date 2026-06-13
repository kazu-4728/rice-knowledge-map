"use client";

import Link from "next/link";
import type { FieldPoint } from "../../types";
import { PIN_COLORS, STATUS_LABELS } from "./mapPins";
import {
  IconCalendar,
  IconCamera,
  IconDropFill,
  IconMic,
  IconPin,
  IconPinFill,
} from "../../components/ui/icons";

const STATUS_CHIP: Record<string, string> = {
  normal: "border-green-600 text-green-700 bg-green-50",
  needs_check: "border-orange-400 text-orange-600 bg-orange-50",
  issue: "border-red-400 text-red-600 bg-red-50",
  resolved: "border-gray-300 text-gray-500 bg-gray-50",
};

type Props = {
  point: FieldPoint | null;
  onAddPin?: () => void;
  onEditPin?: (point: FieldPoint) => void;
};

/**
 * マップ下部の常設ボトムシート。
 * ピン選択時は地点情報＋「詳細 / 記録する」、未選択時は写真・音声の記録導線を出す。
 */
export default function MapBottomSheet({ point, onAddPin, onEditPin }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30">
      <div className="rounded-t-3xl bg-white px-4 pb-4 pt-2 shadow-[0_-6px_24px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-gray-300" />

        {point ? (
          <>
            <div className="flex items-center gap-2">
              <IconPinFill
                className="h-6 w-6 shrink-0"
                style={{ color: PIN_COLORS[point.type] }}
              />
              <h2 className="truncate text-base font-bold text-gray-900">{point.name}</h2>
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                  STATUS_CHIP[point.status] ?? STATUS_CHIP.resolved
                }`}
              >
                {STATUS_LABELS[point.status] ?? point.status}
              </span>
            </div>

            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <IconCalendar className="h-4.5 w-4.5 text-gray-500" />
                最終記録：{point.lastRecord}
              </p>
              {point.waterLevel && (
                <p className="flex items-center gap-2">
                  <IconDropFill className="h-4.5 w-4.5 text-sky-500" />
                  水位：{point.waterLevel}
                </p>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/records?point=${encodeURIComponent(point.id)}`}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                詳細
              </Link>
              {onEditPin && (
                <button
                  onClick={() => onEditPin(point)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  編集
                </button>
              )}
              <Link
                href={`/records/new?field=${encodeURIComponent(point.fieldId)}&point=${encodeURIComponent(point.id)}`}
                className="flex-1 rounded-xl bg-green-700 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                記録する
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm font-bold text-gray-900">きょうの様子を記録しましょう</h2>
            <p className="mt-0.5 text-xs text-gray-500">地点を選ぶと最新の状態を確認できます</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link
                href="/records/new"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                <IconCamera className="h-5 w-5" />
                写真で記録
              </Link>
              <Link
                href="/records/new?type=audio"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-white py-3.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
              >
                <IconMic className="h-5 w-5" />
                音声メモ
              </Link>
              {onAddPin && (
                <button
                  onClick={onAddPin}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <IconPin className="h-5 w-5 text-green-700" />
                  ピン追加
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
