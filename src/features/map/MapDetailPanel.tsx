"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { FieldPoint } from "../../types";
import { PIN_COLORS, STATUS_LABELS } from "./mapPins";
import {
  IconCalendar,
  IconCamera,
  IconChevronRight,
  IconClose,
  IconDropFill,
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
  selectedPoint: FieldPoint | null;
  selectedField: { id: string; name: string } | null;
  onFieldClose: () => void;
  onAddPin: (fieldId?: string | null) => void;
  onEditPin: (point: FieldPoint) => void;
  onRenameField: () => void;
  onRedrawField: () => void;
  onDeleteField: () => void;
};

export default function MapDetailPanel({
  selectedPoint,
  selectedField,
  onFieldClose,
  onAddPin,
  onEditPin,
  onRenameField,
  onRedrawField,
  onDeleteField,
}: Props) {
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setShowEdit(false);
  }, [selectedField?.id]);

  if (!selectedPoint && !selectedField) return null;

  return (
    <div className="hidden lg:block absolute right-0 top-0 bottom-0 z-30 w-96">
      <div className="h-full overflow-y-auto border-l border-gray-200 bg-white/96 backdrop-blur-md p-5">
        {/* close */}
        <button
          onClick={onFieldClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <IconClose className="h-5 w-5" />
        </button>

        {/* ── ピン詳細 ── */}
        {selectedPoint && (
          <>
            <div className="mb-3 flex items-center gap-2 pr-8">
              <IconPinFill
                className="h-5 w-5 shrink-0"
                style={{ color: PIN_COLORS[selectedPoint.type] }}
              />
              <h2 className="flex-1 truncate text-base font-bold text-gray-900">
                {selectedPoint.name}
              </h2>
            </div>
            <span
              className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                STATUS_CHIP[selectedPoint.status] ?? STATUS_CHIP.resolved
              }`}
            >
              {STATUS_LABELS[selectedPoint.status] ?? selectedPoint.status}
            </span>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 shrink-0 text-gray-400" />
                最終記録: {selectedPoint.lastRecord}
              </p>
              {selectedPoint.waterLevel && (
                <p className="flex items-center gap-2">
                  <IconDropFill className="h-4 w-4 shrink-0 text-sky-400" />
                  水位: {selectedPoint.waterLevel}
                </p>
              )}
            </div>
            <div className="mt-5 space-y-2">
              <Link
                href={`/records/new?field=${encodeURIComponent(selectedPoint.fieldId)}&point=${encodeURIComponent(selectedPoint.id)}&pointType=${encodeURIComponent(selectedPoint.type)}&returnTo=${encodeURIComponent(`/map?field=${selectedPoint.fieldId}&point=${selectedPoint.id}`)}`}
                className="flex w-full items-center justify-center rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                この地点を記録
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/fields/${encodeURIComponent(selectedPoint.fieldId)}?point=${encodeURIComponent(selectedPoint.id)}`}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  詳細
                </Link>
                <button
                  onClick={() => onEditPin(selectedPoint)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  編集
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── 田んぼ詳細 ── */}
        {!selectedPoint && selectedField && (
          <>
            <div className="mb-4 flex items-center gap-2 pr-8">
              <span className="h-3 w-3 shrink-0 rounded-sm bg-green-600 shadow-sm" />
              <h2 className="flex-1 truncate text-base font-bold text-gray-900">
                {selectedField.name || "名前のない田んぼ"}
              </h2>
            </div>

            {selectedField.id.startsWith("user-field-") ? (
              <p className="rounded-xl bg-gray-100 px-4 py-3.5 text-center text-sm text-gray-500">
                保存後に記録できます
              </p>
            ) : (
              <Link
                href={`/records/new?field=${encodeURIComponent(selectedField.id)}&returnTo=${encodeURIComponent(`/map?field=${selectedField.id}`)}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                <IconCamera className="h-5 w-5" />
                この田んぼに記録する
              </Link>
            )}

            <div className="mt-3 space-y-2">
              {!selectedField.id.startsWith("user-field-") && (
                <Link
                  href={`/fields/${encodeURIComponent(selectedField.id)}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  詳細を見る
                  <IconChevronRight className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={() =>
                  onAddPin(
                    selectedField.id.startsWith("user-field-")
                      ? null
                      : selectedField.id
                  )
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <IconPin className="h-4 w-4 text-green-700" />
                ピン追加
              </button>
            </div>

            <button
              onClick={() => setShowEdit((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600"
            >
              {showEdit ? "閉じる" : "名前変更・描き直し・削除"}
              <IconChevronRight
                className={`h-3.5 w-3.5 transition-transform ${showEdit ? "-rotate-90" : "rotate-90"}`}
              />
            </button>
            {showEdit && (
              <div className="mt-2 space-y-2">
                <button
                  onClick={() => {
                    setShowEdit(false);
                    onRenameField();
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  名前変更
                </button>
                <button
                  onClick={() => {
                    setShowEdit(false);
                    onRedrawField();
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  描き直す
                </button>
                <button
                  onClick={() => {
                    setShowEdit(false);
                    onDeleteField();
                  }}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  削除
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
