"use client";

import { useState } from "react";
import type { FieldPoint, FieldPointType } from "../../types";
import { TYPE_LABELS } from "./mapPins";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";

const ALL_TYPES: FieldPointType[] = [
  "inlet",
  "outlet",
  "canal",
  "caution",
  "weed",
  "levee_damage",
  "poor_drainage",
  "other",
];

type Props = {
  point: FieldPoint;
  onSave: (patch: { name: string; pointType: FieldPointType; status: FieldPoint["status"] }) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function PointEditDialog({ point, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(point.name);
  const [pointType, setPointType] = useState<FieldPointType>(point.type);
  const [status, setStatus] = useState<FieldPoint["status"]>(point.status);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <h2 className="text-base font-bold text-gray-900">地点を編集</h2>

        <div className="mt-3 space-y-3">
          {/* 名前 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">名前</label>
              <VoiceInputButton onText={(t) => setName((prev) => prev ? prev + " " + t : t)} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-base text-gray-800 outline-none focus:border-green-600"
            />
          </div>

          {/* 種別 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">種別</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setPointType(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    t === pointType
                      ? "bg-green-700 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 状態 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">状態</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(
                [
                  { value: "normal", label: "良好" },
                  { value: "needs_check", label: "要確認" },
                  { value: "issue", label: "異常" },
                  { value: "resolved", label: "解決済み" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    status === value
                      ? "bg-green-700 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {confirmDelete ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">このピンを削除しますか？</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={onDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white"
              >
                削除する
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border border-red-300 bg-white px-3 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              削除
            </button>
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={() => onSave({ name: name.trim() || point.name, pointType, status })}
              className="flex-1 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
            >
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
