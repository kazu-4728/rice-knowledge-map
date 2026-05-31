"use client";

import type { FieldPoint } from "../../types";

type Props = {
  point: FieldPoint | null;
  onClose: () => void;
};

const statusLabel: Record<string, string> = {
  normal: "良好",
  needs_check: "要確認",
  issue: "異常",
  resolved: "解決済み",
};

const statusStyle: Record<string, string> = {
  normal: "bg-green-100 text-green-700",
  needs_check: "bg-orange-100 text-orange-700",
  issue: "bg-red-100 text-red-700",
  resolved: "bg-gray-100 text-gray-600",
};

export default function MapDetailCard({ point, onClose }: Props) {
  if (!point) return null;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 max-w-md mx-auto px-3 pb-3">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-800 truncate">{point.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusStyle[point.status]}`}>
                {statusLabel[point.status]}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">最終記録: {point.lastRecord}</p>
            {point.waterLevel && (
              <p className="text-xs text-gray-500 mt-0.5">💧 水位: {point.waterLevel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 記録するボタン */}
        <button className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
          📝 記録する
        </button>
      </div>
    </div>
  );
}
