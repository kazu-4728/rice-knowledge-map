"use client";

import { useRef, useCallback, useEffect } from "react";
import type { FieldListItem } from "./MapBottomSheet";
import {
  IconChevronRight,
  IconPlus,
} from "../../components/ui/icons";

type Props = {
  fieldList: FieldListItem[];
  anonMode: boolean;
  liveEmpty: boolean;
  loaded: boolean;
  onFieldSelect: (field: FieldListItem) => void;
  onPreview: (field: FieldListItem | null) => void;
  /** 「田んぼを登録する」: 場所合わせ（placing）へ進む */
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
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const itemRefsMap = useRef<Map<string, HTMLLIElement>>(new Map());

  const detectCenterItem = useCallback(() => {
    const list = listRef.current;
    if (!list || fieldList.length === 0) return;

    const listRect = list.getBoundingClientRect();
    const centerY = listRect.top + listRect.height / 2;

    let closest: FieldListItem | null = null;
    let minDist = Infinity;

    for (const field of fieldList) {
      const el = itemRefsMap.current.get(field.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(itemCenterY - centerY);
      if (dist < minDist) {
        minDist = dist;
        closest = field;
      }
    }

    onPreview(closest);
  }, [fieldList, onPreview]);

  const handleScroll = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(detectCenterItem, 200);
  }, [detectCenterItem]);

  useEffect(() => {
    const timer = setTimeout(detectCenterItem, 100);
    return () => clearTimeout(timer);
  }, [detectCenterItem]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const showList = !anonMode && !liveEmpty;

  return (
    <div
      className="absolute inset-0 z-40 flex items-end"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-md md:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 縦フレックス: ヘッダ固定 / 一覧スクロール / フッタ固定。全体は画面の約48%に固定 */}
        <div className="flex max-h-[48vh] flex-col rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-300" />

          {/* ── 固定ヘッダ ── */}
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              登録田んぼ
              {showList && fieldList.length > 0 && (
                <span className="ml-1.5 text-sm font-medium text-gray-400">
                  {fieldList.length}件
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
                <p className="mt-0.5 text-xs text-green-100">家族と記録を共有できます</p>
              </div>
              <IconChevronRight className="h-5 w-5 shrink-0" />
            </a>
          ) : liveEmpty ? (
            <div className="shrink-0">
              <p className="text-sm font-bold text-gray-900">まず田んぼを登録しましょう</p>
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
              {/* ── スクロールする一覧領域（ここだけが縦スクロール） ── */}
              {fieldList.length === 0 ? (
                <p className="shrink-0 py-4 text-center text-sm text-gray-400">
                  {loaded ? "登録された田んぼはありません" : "読み込み中…"}
                </p>
              ) : (
                <ul
                  ref={listRef}
                  onScroll={handleScroll}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
                  className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1"
                >
                  {fieldList.map((f) => (
                    <li
                      key={f.id}
                      ref={(el) => {
                        if (el) itemRefsMap.current.set(f.id, el);
                        else itemRefsMap.current.delete(f.id);
                      }}
                    >
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
