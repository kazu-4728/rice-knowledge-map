"use client";

type Props = {
  vertexCount: number;
  onFinish: () => void;
  onCancel: () => void;
  onUndo: () => void;
  /** 輪郭を捨てて「場所合わせ」へ戻る */
  onReposition: () => void;
};

export default function FieldDrawOverlay({ vertexCount, onFinish, onCancel, onUndo, onReposition }: Props) {
  const canFinish = vertexCount >= 3;

  return (
    <>
      {/* 上部バナー */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold">田んぼの輪郭を描いています</p>
              <p className="text-xs mt-0.5 text-blue-100">
                指でなぞるか、タップで点を打って輪郭を描く — {vertexCount} 点
                {vertexCount < 3 && `（あと ${3 - vertexCount} 点で完成できます）`}
              </p>
            </div>
            <button
              onClick={onReposition}
              className="shrink-0 rounded-lg bg-blue-500/60 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              場所を合わせ直す
            </button>
          </div>
        </div>
      </div>

      {/* 下部操作ボタン */}
      <div className="absolute bottom-4 left-3 right-3 z-20 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-white text-gray-600 text-sm font-semibold py-3 rounded-xl shadow border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onUndo}
          disabled={vertexCount === 0}
          className="bg-white text-gray-500 text-sm font-semibold px-4 py-3 rounded-xl shadow border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          ↩ 戻す
        </button>
        <button
          onClick={onFinish}
          disabled={!canFinish}
          className={`flex-1 text-sm font-bold py-3 rounded-xl shadow transition-colors ${
            canFinish
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          ✓ 完成
        </button>
      </div>
    </>
  );
}
