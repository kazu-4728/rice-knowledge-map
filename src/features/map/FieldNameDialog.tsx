"use client";

import { useRef, useEffect } from "react";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  title?: string;
};

export default function FieldNameDialog({
  value,
  onChange,
  onSave,
  onCancel,
  title = "田んぼの名前を入力",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // ダイアログ表示時にフォーカス
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    /* 背景オーバーレイ */
    <div className="absolute inset-0 z-30 flex items-end justify-center pb-20 bg-black/40">
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <VoiceInputButton onText={(t) => onChange(value ? value + " " + t : t)} />
        </div>
        <p className="text-xs text-gray-500 mb-3">後から変更できます</p>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例: A田、北の田んぼ、実家前"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={30}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
