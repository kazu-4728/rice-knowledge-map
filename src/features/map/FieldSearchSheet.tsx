"use client";

import { useState, useMemo } from "react";
import type { FieldListItem } from "./MapBottomSheet";
import {
  IconChevronRight,
  IconPlus,
  IconSearch,
} from "../../components/ui/icons";

type Props = {
  fieldList: FieldListItem[];
  anonMode: boolean;
  liveEmpty: boolean;
  loaded: boolean;
  onFieldSelect: (field: FieldListItem) => void;
  onStartDraw: () => void;
  onClose: () => void;
};

export default function FieldSearchSheet({
  fieldList,
  anonMode,
  liveEmpty,
  loaded,
  onFieldSelect,
  onStartDraw,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return fieldList;
    const q = query.trim().toLowerCase();
    return fieldList.filter((f) => (f.name || "").toLowerCase().includes(q));
  }, [fieldList, query]);

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md md:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-3xl bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.18)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">田んぼを探す</h2>
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
              className="flex items-center justify-between rounded-xl bg-green-700 px-4 py-3.5 text-white transition-colors hover:bg-green-800"
            >
              <div>
                <p className="text-sm font-bold">ログインして田んぼを管理</p>
                <p className="mt-0.5 text-xs text-green-100">家族と記録を共有できます</p>
              </div>
              <IconChevronRight className="h-5 w-5 shrink-0" />
            </a>
          ) : liveEmpty ? (
            <>
              <p className="text-sm font-bold text-gray-900">まず田んぼを登録しましょう</p>
              <p className="mt-0.5 text-xs text-gray-500">
                地図をなぞって田んぼの輪郭を登録できます
              </p>
              <button
                onClick={() => { onStartDraw(); onClose(); }}
                className="mt-3 w-full rounded-xl bg-green-700 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
              >
                田んぼを登録する
              </button>
            </>
          ) : (
            <>
              {/* 検索フィールド */}
              {fieldList.length > 0 && (
                <div className="relative mb-3">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="田んぼ名で検索"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              )}

              {/* 田んぼ一覧 */}
              {fieldList.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  {loaded ? "登録された田んぼはありません" : "読み込み中…"}
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  「{query}」に一致する田んぼはありません
                </p>
              ) : (
                <ul className="-mx-1 max-h-[40vh] space-y-0.5 overflow-y-auto px-1">
                  {filtered.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => { onFieldSelect(f); onClose(); }}
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

              {/* 田んぼを登録する */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => { onStartDraw(); onClose(); }}
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
