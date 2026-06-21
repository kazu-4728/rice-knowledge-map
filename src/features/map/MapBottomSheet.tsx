"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { FieldPoint } from "../../types";
import { PIN_COLORS, STATUS_LABELS } from "./mapPins";
import {
  IconCalendar,
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconPin,
  IconPinFill,
  IconPlus,
} from "../../components/ui/icons";

const STATUS_CHIP: Record<string, string> = {
  normal: "border-green-600 text-green-700 bg-green-50",
  needs_check: "border-orange-400 text-orange-600 bg-orange-50",
  issue: "border-red-400 text-red-600 bg-red-50",
  resolved: "border-gray-300 text-gray-500 bg-gray-50",
};

export type FieldListItem = {
  id: string;
  name: string;
  pendingCount?: number;
  lastRecord?: string;
};

type Props = {
  selectedPoint: FieldPoint | null;
  selectedField: { id: string; name: string } | null;
  fieldList: FieldListItem[];
  anonMode: boolean;
  liveEmpty: boolean;
  onFieldSelect: (field: FieldListItem) => void;
  onFieldClose: () => void;
  onAddPin: (fieldId?: string | null) => void;
  onEditPin: (point: FieldPoint) => void;
  onStartDraw: () => void;
  onRenameField: () => void;
  onRedrawField: () => void;
  onDeleteField: () => void;
};

export default function MapBottomSheet({
  selectedPoint,
  selectedField,
  fieldList,
  anonMode,
  liveEmpty,
  onFieldSelect,
  onFieldClose,
  onAddPin,
  onEditPin,
  onStartDraw,
  onRenameField,
  onRedrawField,
  onDeleteField,
}: Props) {
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setShowEdit(false);
  }, [selectedField?.id]);

  const mode = selectedPoint ? "pin" : selectedField ? "field" : "list";

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="mx-auto w-full max-w-md md:max-w-2xl pointer-events-auto">
        <div className="rounded-t-3xl bg-white/96 backdrop-blur-md px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />

          {/* ── ピン詳細 ── */}
          {mode === "pin" && selectedPoint && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <IconPinFill
                  className="h-5 w-5 shrink-0"
                  style={{ color: PIN_COLORS[selectedPoint.type] }}
                />
                <h2 className="flex-1 truncate text-base font-bold text-gray-900">{selectedPoint.name}</h2>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                    STATUS_CHIP[selectedPoint.status] ?? STATUS_CHIP.resolved
                  }`}
                >
                  {STATUS_LABELS[selectedPoint.status] ?? selectedPoint.status}
                </span>
              </div>
              <div className="mb-3 space-y-1 text-sm text-gray-500">
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
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  詳細
                </Link>
                <button
                  onClick={() => onEditPin(selectedPoint)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  編集
                </button>
                <Link
                  href={`/records/new?field=${encodeURIComponent(selectedPoint.fieldId)}&point=${encodeURIComponent(selectedPoint.id)}&pointType=${encodeURIComponent(selectedPoint.type)}`}
                  className="flex-1 rounded-xl bg-green-700 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-green-800"
                >
                  この地点を記録
                </Link>
              </div>
            </>
          )}

          {/* ── 田んぼ詳細 ── */}
          {mode === "field" && selectedField && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm bg-green-600 shadow-sm" />
                <h2 className="flex-1 truncate text-base font-bold text-gray-900">
                  {selectedField.name || "名前のない田んぼ"}
                </h2>
                <button
                  onClick={onFieldClose}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  一覧へ
                </button>
              </div>

              {selectedField.id.startsWith("user-field-") ? (
                <p className="rounded-xl bg-gray-100 px-4 py-3.5 text-center text-sm text-gray-500">
                  保存後に記録できます
                </p>
              ) : (
                <Link
                  href={`/records/new?field=${encodeURIComponent(selectedField.id)}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
                >
                  <IconCamera className="h-5 w-5" />
                  この田んぼに記録する
                </Link>
              )}

              <div className="mt-2 flex gap-2">
                {!selectedField.id.startsWith("user-field-") && (
                  <Link
                    href={`/fields/${encodeURIComponent(selectedField.id)}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <IconPin className="h-4 w-4 text-green-700" />
                  ピン追加
                </button>
              </div>

              <button
                onClick={() => setShowEdit((v) => !v)}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600"
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
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    名前変更
                  </button>
                  <button
                    onClick={() => { setShowEdit(false); onRedrawField(); }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
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

          {/* ── 田んぼ一覧 ── */}
          {mode === "list" && (
            <>
              {anonMode ? (
                <Link
                  href="/login?redirect=%2Fmap"
                  className="flex items-center justify-between rounded-xl bg-green-700 px-4 py-3.5 text-white transition-colors hover:bg-green-800"
                >
                  <div>
                    <p className="text-sm font-bold">ログインして田んぼを管理</p>
                    <p className="mt-0.5 text-xs text-green-100">家族と記録を共有できます</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 shrink-0" />
                </Link>
              ) : liveEmpty ? (
                <>
                  <p className="text-sm font-bold text-gray-900">まず田んぼを登録しましょう</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    右下の ＋ ボタンから地図をなぞって登録できます
                  </p>
                  <button
                    onClick={onStartDraw}
                    className="mt-3 w-full rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
                  >
                    田んぼを登録する
                  </button>
                </>
              ) : fieldList.length === 0 ? (
                <p className="py-2 text-center text-sm text-gray-400">読み込み中…</p>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-bold text-gray-900">田んぼを選ぶ</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      登録済みの田んぼを選ぶと、地図がその場所へ移動します
                    </p>
                  </div>
                  <ul className="-mx-1 max-h-48 space-y-0.5 overflow-y-auto px-1">
                    {fieldList.map((f) => (
                      <li key={f.id}>
                        <button
                          onClick={() => onFieldSelect(f)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-green-50 active:bg-green-100"
                        >
                          <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-green-600" />
                          <span className="flex-1 truncate text-sm font-semibold text-gray-900">
                            {f.name || "名前のない田んぼ"}
                          </span>
                          {f.pendingCount != null && f.pendingCount > 0 && (
                            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                              未対応 {f.pendingCount}
                            </span>
                          )}
                          {f.lastRecord && f.lastRecord !== "記録なし" && (
                            <span className="hidden shrink-0 text-xs text-gray-400 sm:block">
                              {f.lastRecord}
                            </span>
                          )}
                          <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={onStartDraw}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-500 bg-green-50 py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-100"
                    >
                      <IconPlus className="h-4 w-4" />
                      一覧にない田んぼを登録する
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
