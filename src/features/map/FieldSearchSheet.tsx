"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import type { FieldListItem } from "./MapBottomSheet";
import {
  IconChevronRight,
  IconPlus,
} from "../../components/ui/icons";

const ITEM_H = 52;
const VISIBLE = 5;
const VIEWPORT_H = VISIBLE * ITEM_H;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

type Props = {
  fieldList: FieldListItem[];
  anonMode: boolean;
  liveEmpty: boolean;
  loaded: boolean;
  onFieldSelect: (field: FieldListItem) => void;
  onPreview: (field: FieldListItem | null) => void;
  onStartRegister: () => void;
  onClose: () => void;
};

export default function FieldSearchSheet({
  fieldList,
  anonMode,
  liveEmpty,
  loaded,
  onFieldSelect,
  onPreview,
  onStartRegister,
  onClose,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const centerIdxRef = useRef(-1);
  const recenterRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readyRef = useRef(false);

  const n = fieldList.length;
  const repeats = useMemo(
    () => (n > 0 ? Math.max(21, Math.ceil(201 / n)) | 1 : 0),
    [n],
  );
  const totalItems = n * repeats;
  const midStart = Math.floor(repeats / 2) * n;

  const showWheel = !anonMode && !liveEmpty && n > 0;

  const getCenterReal = useCallback(
    (scrollTop: number) => {
      if (n === 0) return -1;
      const vi = Math.round((scrollTop + PAD) / ITEM_H);
      return ((vi % n) + n) % n;
    },
    [n],
  );

  const scrollToReal = useCallback(
    (realIdx: number, behavior: ScrollBehavior = "instant") => {
      const el = scrollRef.current;
      if (!el) return;
      const vi = midStart + realIdx;
      el.scrollTo({ top: vi * ITEM_H - PAD, behavior });
    },
    [midStart],
  );

  useEffect(() => {
    if (!showWheel) return;
    readyRef.current = false;
    requestAnimationFrame(() => {
      scrollToReal(0, "instant");
      centerIdxRef.current = 0;
      onPreview(fieldList[0] ?? null);
      requestAnimationFrame(() => {
        readyRef.current = true;
      });
    });
  }, [fieldList, showWheel, scrollToReal, onPreview]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !readyRef.current) return;

    const ri = getCenterReal(el.scrollTop);
    if (ri >= 0 && ri !== centerIdxRef.current) {
      centerIdxRef.current = ri;
      onPreview(fieldList[ri] ?? null);
    }

    clearTimeout(recenterRef.current);
    recenterRef.current = setTimeout(() => {
      const el2 = scrollRef.current;
      if (!el2 || n === 0) return;
      const vi = Math.round((el2.scrollTop + PAD) / ITEM_H);
      const group = Math.floor(vi / n);
      const midGroup = Math.floor(repeats / 2);
      if (Math.abs(group - midGroup) > repeats / 4) {
        const cur = ((vi % n) + n) % n;
        scrollToReal(cur, "instant");
      }
    }, 300);
  }, [n, repeats, getCenterReal, scrollToReal, fieldList, onPreview]);

  useEffect(() => () => clearTimeout(recenterRef.current), []);

  const handleItemClick = useCallback(
    (virtualIdx: number) => {
      const ri = virtualIdx % n;
      if (ri === centerIdxRef.current) {
        onFieldSelect(fieldList[ri]);
      } else {
        scrollRef.current?.scrollTo({
          top: virtualIdx * ITEM_H - PAD,
          behavior: "smooth",
        });
      }
    },
    [n, fieldList, onFieldSelect],
  );

  const showList = !anonMode && !liveEmpty;

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md md:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-300" />

          {/* ── 固定ヘッダ ── */}
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              登録田んぼ
              {showList && n > 0 && (
                <span className="ml-1.5 text-sm font-medium text-gray-400">
                  {n}件
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              閉じる
            </button>
          </div>

          {anonMode ? (
            <a
              href="/login?redirect=%2Fmap"
              className="flex shrink-0 items-center justify-between rounded-xl bg-green-700 px-4 py-3.5 text-white transition-colors hover:bg-green-800"
            >
              <div>
                <p className="text-sm font-bold">ログインして田んぼを管理</p>
                <p className="mt-0.5 text-xs text-green-100">
                  家族と記録を共有できます
                </p>
              </div>
              <IconChevronRight className="h-5 w-5 shrink-0" />
            </a>
          ) : liveEmpty ? (
            <div className="shrink-0">
              <p className="text-sm font-bold text-gray-900">
                まず田んぼを登録しましょう
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                地図を動かして場所を合わせてから、田んぼの輪郭を登録できます
              </p>
              <button
                onClick={onStartRegister}
                className="mt-3 w-full rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                田んぼを登録する
              </button>
            </div>
          ) : (
            <>
              {n === 0 ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height: VIEWPORT_H }}
                >
                  <p className="text-sm text-gray-400">
                    {loaded
                      ? "登録された田んぼはありません"
                      : "読み込み中…"}
                  </p>
                </div>
              ) : (
                <div className="relative" style={{ height: VIEWPORT_H }}>
                  {/* 中央ハイライトバー */}
                  <div
                    className="pointer-events-none absolute inset-x-2 z-10 rounded-xl border border-amber-200 bg-amber-50/80"
                    style={{ top: PAD, height: ITEM_H }}
                  />

                  {/* ホイールスクロール */}
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="relative z-0 h-full overflow-y-auto overscroll-contain"
                    style={{
                      scrollSnapType: "y mandatory",
                      touchAction: "pan-y",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none",
                    }}
                  >
                    {Array.from({ length: totalItems }, (_, vi) => {
                      const ri = vi % n;
                      const f = fieldList[ri];
                      return (
                        <div
                          key={vi}
                          onClick={() => handleItemClick(vi)}
                          className="flex cursor-pointer items-center gap-3 px-3"
                          style={{
                            height: ITEM_H,
                            scrollSnapAlign: "center",
                          }}
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
                        </div>
                      );
                    })}
                  </div>

                  {/* 上下フェードグラデーション */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 rounded-t-xl bg-gradient-to-b from-white via-white/80 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 rounded-b-xl bg-gradient-to-t from-white via-white/80 to-transparent" />
                </div>
              )}

              {/* ── 固定フッタ: 田んぼを登録する ── */}
              <div className="mt-3 shrink-0 border-t border-gray-100 pt-3">
                <button
                  onClick={onStartRegister}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-500 bg-green-50 py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-100"
                >
                  <IconPlus className="h-4 w-4" />
                  田んぼを登録する
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
