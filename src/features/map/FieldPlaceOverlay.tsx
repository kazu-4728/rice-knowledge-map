"use client";

import { IconPencil } from "../../components/ui/icons";

type Props = {
  /** 描き直し時は文言を変える */
  redraw: boolean;
  onStart: () => void;
  onCancel: () => void;
};

/**
 * 新規/描き直しの「場所合わせ」状態。
 * この状態では地図を自由に移動・拡大縮小でき、頂点や輪郭は一切追加しない。
 * 「この場所で輪郭を描く」を押して初めて描画モードへ入る。
 */
export default function FieldPlaceOverlay({ redraw, onStart, onCancel }: Props) {
  return (
    <>
      {/* 中央の照準（地図の基準点） */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-white bg-green-600/30 shadow-[0_0_0_4px_rgba(22,163,74,0.25)]" />
      </div>

      {/* 上部案内 */}
      <div className="absolute inset-x-3 top-3 z-30">
        <div className="mx-auto max-w-md rounded-xl bg-gray-900/90 px-4 py-3 text-center text-white shadow-lg backdrop-blur-sm md:max-w-2xl">
          <p className="text-sm font-bold">
            {redraw ? "描き直す田んぼの場所を地図で合わせてください" : "登録したい田んぼの場所を地図で合わせてください"}
          </p>
          <p className="mt-0.5 text-xs text-gray-300">
            地図を動かして中央の○を田んぼに合わせます
          </p>
        </div>
      </div>

      {/* 下部アクション */}
      <div className="absolute inset-x-3 bottom-6 z-30">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-2xl">
          <button
            onClick={onCancel}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-600 shadow-md transition-colors hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={onStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-green-800 active:bg-green-900"
          >
            <IconPencil className="h-5 w-5" />
            この場所で輪郭を描く
          </button>
        </div>
      </div>
    </>
  );
}
