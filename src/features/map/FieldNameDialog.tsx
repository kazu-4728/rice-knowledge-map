"use client";

import { useRef, useEffect } from "react";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import { formatAreaSqm } from "../../lib/utils/geo";
import { useAreaUnit } from "../../lib/hooks/useAreaUnit";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  title?: string;
  areaSqm?: number | null;
};

export default function FieldNameDialog({
  value,
  onChange,
  onSave,
  onCancel,
  title = "田んぼの名前を入力",
  areaSqm = null,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [areaUnit, cycleAreaUnit] = useAreaUnit();

  useEffect(() => {
    // ダイアログ表示時にフォーカス
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const blurInput = () => {
    inputRef.current?.blur();
  };

  const handleSave = () => {
    blurInput();
    onSave();
  };

  const handleCancel = () => {
    blurInput();
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    /* 背景オーバーレイ */
    <div className="absolute inset-0 z-30 flex items-end justify-center pb-20 bg-black/40">
      <button
        onClick={handleCancel}
        className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white active:bg-gray-50"
      >
        ← 地図へ戻る
      </button>
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <VoiceInputButton onText={(t) => { const v = valueRef.current; onChange(v ? v + " " + t : t); }} />
        </div>
        <p className="text-xs text-gray-500 mb-3">後から変更できます</p>
        {areaSqm != null && (
          <button
            onClick={cycleAreaUnit}
            className="mb-3 -mt-1 block rounded border-b border-dotted border-green-300 text-xs font-semibold text-green-700 active:opacity-70"
          >
            推定面積 約{formatAreaSqm(areaSqm, areaUnit)}（タップで単位切替）
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例: A田、北の田んぼ、実家前"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={30}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
