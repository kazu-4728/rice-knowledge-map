"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { FieldPoint } from "../../types";
import { PIN_COLORS, STATUS_LABELS } from "./mapPins";
import StatusBadge, { type StatusKey } from "../../components/ui/StatusBadge";
import {
  IconCalendar,
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconPin,
  IconPinFill,
} from "../../components/ui/icons";

export type FieldListItem = {
  id: string;
  name: string;
  pendingCount?: number;
  lastRecord?: string;
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

export default function MapBottomSheet({
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
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <div className="rounded-t-3xl glass-light-strong px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />

          {/* ── ピン詳細 ── */}
          {selectedPoint && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <IconPinFill
                  className="h-5 w-5 shrink-0"
                  style={{ color: PIN_COLORS[selectedPoint.type] }}
                />
                <h2 className="flex-1 truncate text-lg font-bold text-gray-900">{selectedPoint.name}</h2>
                <StatusBadge
                  status={(selectedPoint.status as StatusKey) ?? "monitoring"}
                  label={STATUS_LABELS[selectedPoint.status] ?? selectedPoint.status}
                  className="shrink-0"
                />
              </div>
              <div className="mb-3 space-y-1 text-sm text-gray-600">
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
              <div className="flex gap-2">
                <Link
                  href={`/records?point=${encodeURIComponent(selectedPoint.id)}`}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  詳細
                </Link>
                <button
                  onClick={() => onEditPin(selectedPoint)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  編集
                </button>
                <Link
                  href={`/records/new?field=${encodeURIComponent(selectedPoint.fieldId)}&point=${encodeURIComponent(selectedPoint.id)}&pointType=${encodeURIComponent(selectedPoint.type)}&returnTo=${encodeURIComponent(`/map?field=${selectedPoint.fieldId}&point=${selectedPoint.id}`)}`}
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-emerald-600"
                >
                  この地点を記録
                </Link>
              </div>
            </>
          )}

          {/* ── 田んぼ詳細 ── */}
          {!selectedPoint && selectedField && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm bg-emerald-400 shadow-sm" />
                <h2 className="flex-1 truncate text-lg font-bold text-gray-900">
                  {selectedField.name || "名前のない田んぼ"}
                </h2>
                <button
                  onClick={onFieldClose}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  閉じる
                </button>
              </div>

              {selectedField.id.startsWith("user-field-") ? (
                <p className="rounded-xl bg-gray-100 px-4 py-3.5 text-center text-sm text-gray-600">
                  保存後に記録できます
                </p>
              ) : (
                <Link
                  href={`/records/new?field=${encodeURIComponent(selectedField.id)}&returnTo=${encodeURIComponent(`/map?field=${selectedField.id}`)}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-base font-bold text-white transition-colors hover:bg-emerald-600"
                >
                  <IconCamera className="h-5 w-5" />
                  この田んぼに記録する
                </Link>
              )}

              <div className="mt-2 flex gap-2">
                {!selectedField.id.startsWith("user-field-") && (
                  <Link
                    href={`/fields/${encodeURIComponent(selectedField.id)}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    詳細を見る
                    <IconChevronRight className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={() =>
                    onAddPin(
                      selectedField.id.startsWith("user-field-") ? null : selectedField.id
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <IconPin className="h-4 w-4 text-emerald-600" />
                  ピン追加
                </button>
              </div>

              <button
                onClick={() => setShowEdit((v) => !v)}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700"
              >
                {showEdit ? "閉じる" : "名前変更・描き直し・削除"}
                <IconChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${showEdit ? "-rotate-90" : "rotate-90"}`}
                />
              </button>
              {showEdit && (
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => { setShowEdit(false); onRenameField(); }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    名前変更
                  </button>
                  <button
                    onClick={() => { setShowEdit(false); onRedrawField(); }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    描き直す
                  </button>
                  <button
                    onClick={() => { setShowEdit(false); onDeleteField(); }}
                    className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
