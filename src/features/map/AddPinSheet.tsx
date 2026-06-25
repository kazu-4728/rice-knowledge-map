"use client";

import { useState } from "react";
import type { FieldPointType } from "../../types";
import { TYPE_LABELS } from "./mapPins";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";

const ADD_TYPES: FieldPointType[] = [
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
  /** 選択候補の田んぼ名一覧（id→name） */
  fields: { id: string; name: string }[];
  /** 田んぼ詳細から開いた場合に初期選択する田んぼ id */
  initialFieldId?: string | null;
  onConfirm: (params: { name: string; pointType: FieldPointType; fieldId: string | null }) => void;
  onCancel: () => void;
};

export default function AddPinSheet({ fields, initialFieldId, onConfirm, onCancel }: Props) {
  const [pointType, setPointType] = useState<FieldPointType>("inlet");
  const [name, setName] = useState("");
  const [fieldId, setFieldId] = useState<string | null>(initialFieldId ?? null);

  const defaultName = TYPE_LABELS[pointType];

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <h2 className="text-base font-bold text-gray-900">ピンを追加</h2>
        <p className="mt-0.5 text-xs text-gray-500">タップした場所にピンを追加します</p>

        <div className="mt-3 space-y-3">
          {/* 種別 */}
          <div>
            <label className="text-xs font-semibold text-gray-600">種別</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ADD_TYPES.map((t) => (
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

          {/* 名前（任意） */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">名前（省略時は種別名）</label>
              <VoiceInputButton onText={(t) => setName((prev) => prev ? prev + " " + t : t)} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-base text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
            />
          </div>

          {/* 田んぼ（任意） */}
          {fields.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-600">田んぼ（任意）</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {fields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFieldId(fieldId === f.id ? null : f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      f.id === fieldId
                        ? "bg-green-700 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600"
          >
            キャンセル
          </button>
          <button
            onClick={() =>
              onConfirm({
                name: name.trim() || defaultName,
                pointType,
                fieldId,
              })
            }
            className="flex-1 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            ここに追加
          </button>
        </div>
      </div>
    </div>
  );
}
