"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldPointType } from "../../types";
import { TYPE_LABELS } from "./mapPins";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import { IconCamera, IconClose } from "../../components/ui/icons";

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
  onConfirm: (params: {
    name: string;
    pointType: FieldPointType;
    fieldId: string | null;
    photoFile: File | null;
  }) => void;
  onCancel: () => void;
};

export default function AddPinSheet({ fields, initialFieldId, onConfirm, onCancel }: Props) {
  const [pointType, setPointType] = useState<FieldPointType>("inlet");
  const [name, setName] = useState("");
  const [fieldId, setFieldId] = useState<string | null>(initialFieldId ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // プレビュー用のObject URLはファイル差し替え・閉じる時に必ず解放する
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

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

          {/* 設備の写真（任意）: 入水口の様子など変わらない情報をピン自体に残す */}
          <div>
            <label className="text-xs font-semibold text-gray-600">設備の写真（任意）</label>
            {photoPreview ? (
              <div className="relative mt-1 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- ローカルプレビュー（Object URL）のため next/image を使わない */}
                <img src={photoPreview} alt="添付する写真" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  aria-label="写真の添付を取り消す"
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <IconCamera className="h-4.5 w-4.5 text-green-700" />
                写真を付ける
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhotoFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
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
                photoFile,
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
