"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../components/ui/Toast";
import {
  loadSchedules, createSchedule, toggleScheduleDone, deleteSchedule,
  CATEGORY_LABELS, type ScheduleCategory, type ScheduleItem,
} from "../../lib/data/schedule";
import { loadFarmData, getMyRole, ensureGroupId } from "../../lib/data/farm";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";
import { IconCheck, IconChevronLeft, IconChevronRight, IconPlus, IconTrash } from "../../components/ui/icons";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type FieldOption = { id: string; name: string };

export default function CalendarScreen() {
  const { showToast } = useToast();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState<FieldOption[]>([]);
  // viewer は予定の追加/完了/削除が RLS で拒否されるため、書き込み操作を隠す（デモ/未ログインは操作可）
  const [canEdit, setCanEdit] = useState(true);

  // 入力フォーム状態
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(toYMD(today));
  const [formCategory, setFormCategory] = useState<ScheduleCategory>("other");
  const [formFieldId, setFormFieldId] = useState<string>("");
  const [formMemo, setFormMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const from = toYMD(firstDay);
  const to = toYMD(lastDay);

  useEffect(() => {
    loadSchedules(from, to).then(setSchedules);
  }, [viewYear, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // 田んぼ選択とロール判定をアクティブグループ（最初の所属）に限定する（単一グループ運用）。
  // これで予定作成/読込/権限がすべて同一グループに揃い、別グループ選択での保存失敗や
  // 再読込での消失、権限の取り違えを防ぐ
  useEffect(() => {
    (async () => {
      const gid = await ensureGroupId();
      const f = await loadFarmData();
      setFields(
        f.fieldsGeoJSON.features
          .filter((ft) => !gid || (ft.properties?.group_id ?? f.groupId) === gid)
          .map((ft) => ({ id: String(ft.id ?? ft.properties?.id ?? ""), name: String(ft.properties?.name ?? "") }))
      );
      if (gid) {
        const role = await getMyRole(gid);
        setCanEdit(role === null || role === "owner" || role === "editor");
      }
    })();
  }, []);

  const schedulesByDate: Record<string, ScheduleItem[]> = {};
  schedules.forEach((s) => {
    if (!schedulesByDate[s.scheduledDate]) schedulesByDate[s.scheduledDate] = [];
    schedulesByDate[s.scheduledDate].push(s);
  });

  // カレンダーセル構築
  const startPad = firstDay.getDay();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ];

  const handleSave = async () => {
    if (!formTitle.trim()) { showToast("タイトルを入力してください", "error"); return; }
    setSaving(true);
    const result = await createSchedule({
      title: formTitle.trim(),
      scheduledDate: formDate,
      category: formCategory,
      fieldId: formFieldId || null,
      memo: formMemo || null,
    });
    setSaving(false);
    if (!result) { showToast("保存できませんでした", "error"); return; }
    showToast("予定を追加しました");
    setSchedules((prev) => [...prev, result].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
    setFormTitle(""); setFormMemo(""); setFormCategory("other"); setFormFieldId("");
    setShowForm(false);
  };

  const handleToggle = async (item: ScheduleItem) => {
    const ok = await toggleScheduleDone(item.id, !item.done);
    if (!ok) return;
    setSchedules((prev) => prev.map((s) => s.id === item.id ? { ...s, done: !s.done } : s));
    showToast(item.done ? "未完了に戻しました" : "完了しました");
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteSchedule(id);
    if (!ok) return;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast("削除しました");
  };

  const selectedItems = selectedDate ? (schedulesByDate[selectedDate] ?? []) : [];
  const todayStr = toYMD(today);

  return (
    <div className="space-y-3 px-3 pb-24 pt-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-1">
        <button onClick={() => {
          const d = new Date(viewYear, viewMonth - 1, 1);
          setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
        }} className="rounded-lg p-1.5 hover:bg-gray-100 active:scale-90 transition-transform">
          <IconChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {viewYear}年 {MONTHS[viewMonth]}
        </h1>
        <button onClick={() => {
          const d = new Date(viewYear, viewMonth + 1, 1);
          setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
        }} className="rounded-lg p-1.5 hover:bg-gray-100 active:scale-90 transition-transform">
          <IconChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 text-center text-xs font-bold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
              {w}
            </div>
          ))}
        </div>
        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="h-14 border-b border-gray-50" />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const items = schedulesByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = (startPad + day - 1) % 7;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex flex-col items-center border-b border-gray-50 pt-1.5 pb-1 min-h-[3.5rem] transition-colors active:scale-95
                  ${isSelected ? "bg-green-50" : "hover:bg-gray-50"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                  ${isToday ? "bg-green-600 text-white" : dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-700"}`}>
                  {day}
                </span>
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5 px-0.5">
                  {items.slice(0, 3).map((item) => (
                    <span key={item.id}
                      className={`h-1.5 w-1.5 rounded-full ${item.done ? "bg-gray-300" : CATEGORY_LABELS[item.category]?.bg.replace("bg-", "bg-").replace("-50", "-400")}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択日の予定 */}
      {selectedDate && (
        <section className="rounded-2xl bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">
              {selectedDate.replace(/(\d+)-(\d+)-(\d+)/, "$2/$3")} の予定
            </p>
            {canEdit && (
              <button
                onClick={() => { setFormDate(selectedDate); setShowForm(true); }}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-transform"
              >
                <IconPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                追加
              </button>
            )}
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">この日の予定はありません</p>
          ) : (
            <ul className="space-y-2">
              {selectedItems.map((item) => {
                const meta = CATEGORY_LABELS[item.category];
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <button
                      onClick={canEdit ? () => handleToggle(item) : undefined}
                      disabled={!canEdit}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                        ${item.done ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"} ${canEdit ? "" : "cursor-default"}`}
                    >
                      {item.done && <IconCheck className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${item.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${meta.color} ${meta.bg}`}>
                          {meta.label}
                        </span>
                        {item.fieldName && (
                          <span className="text-xs text-gray-400">{item.fieldName}</span>
                        )}
                      </div>
                      {item.memo && <p className="text-xs text-gray-400 mt-0.5">{item.memo}</p>}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors active:scale-90"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* 今月の予定一覧 */}
      {!selectedDate && schedules.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 mb-3">今月の予定</p>
          <ul className="space-y-2">
            {schedules.map((item) => {
              const meta = CATEGORY_LABELS[item.category];
              const d = new Date(item.scheduledDate + "T00:00:00");
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-xs text-gray-400">{d.getMonth() + 1}/{d.getDate()}</p>
                    <p className="text-xs text-gray-300">{WEEKDAYS[d.getDay()]}</p>
                  </div>
                  <button
                    onClick={canEdit ? () => handleToggle(item) : undefined}
                    disabled={!canEdit}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                      ${item.done ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"} ${canEdit ? "active:scale-95" : "cursor-default"}`}
                  >
                    {item.done && <IconCheck className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.done ? "line-through text-gray-400" : "text-gray-800"}`}>{item.title}</p>
                    <span className={`text-xs rounded px-1.5 py-0.5 ${meta.color} ${meta.bg}`}>{meta.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!selectedDate && schedules.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">今月の予定はありません</p>
          {canEdit ? (
            <p className="mt-1 text-xs text-gray-400">＋ボタンから作業予定を追加できます</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">閲覧のみのメンバーのため、予定の追加はできません</p>
          )}
        </div>
      )}

      {/* FAB風の追加ボタン（編集権限のあるメンバーのみ） */}
      {canEdit && (
        <button
          onClick={() => { setFormDate(selectedDate ?? toYMD(today)); setShowForm(true); }}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-xl active:scale-90 transition-transform"
          aria-label="予定を追加"
        >
          <IconPlus className="h-7 w-7 text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* 追加フォーム（モーダル風ボトムシート） */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">予定を追加</h2>
              <button onClick={() => setShowForm(false)} className="text-sm text-gray-400">閉じる</button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">タイトル</label>
                  <VoiceInputButton onText={(t) => setFormTitle((p) => p ? p + " " + t : t)} />
                </div>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例: 北田 取水開始"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">日付</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">種別</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ScheduleCategory)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
                  >
                    {(Object.keys(CATEGORY_LABELS) as ScheduleCategory[]).map((k) => (
                      <option key={k} value={k}>{CATEGORY_LABELS[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {fields.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">田んぼ（任意）</label>
                  <select
                    value={formFieldId}
                    onChange={(e) => setFormFieldId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
                  >
                    <option value="">指定しない</option>
                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">メモ（任意）</label>
                  <VoiceInputButton onText={(t) => setFormMemo((p) => p ? p + " " + t : t)} />
                </div>
                <textarea
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-600"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:bg-gray-300 active:scale-95"
              >
                {saving ? "保存中…" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
