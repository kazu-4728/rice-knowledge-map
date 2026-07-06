"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadSchedules, createSchedule, toggleScheduleDone, deleteSchedule,
  type ScheduleCategory, type ScheduleItem,
} from "../../../lib/data/schedule";
import { loadFarmData, getMyRole, ensureGroupId } from "../../../lib/data/farm";
import { loadImageSlots } from "../../../lib/data/siteContent";
import { resolveCalendarCoverUrl } from "../../../lib/data/media";
import type { ImageSlots } from "../../../lib/supabase/types";

export type FieldOption = { id: string; name: string };

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type CalendarMonth = {
  schedules: ScheduleItem[];
  schedulesByDate: Record<string, ScheduleItem[]>;
  fields: FieldOption[];
  canEdit: boolean;
  createItem: (input: { title: string; scheduledDate: string; category: ScheduleCategory; fieldId: string | null; memo: string | null }) => Promise<ScheduleItem | null>;
  toggleItem: (item: ScheduleItem) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  coverImageUrl: string | undefined;
};

/** /calendar のデータ取得を1本化するフック。フォームのローカル状態はコンポーネント側に残す */
export function useCalendarMonth(viewYear: number, viewMonth: number): CalendarMonth {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  // viewer は予定の追加/完了/削除が RLS で拒否されるため、書き込み操作を隠す（デモ/未ログインは操作可）
  const [canEdit, setCanEdit] = useState(true);
  const [imageSlots, setImageSlots] = useState<ImageSlots>({});

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const from = toYMD(firstDay);
  const to = toYMD(lastDay);

  useEffect(() => {
    loadSchedules(from, to).then(setSchedules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  useEffect(() => {
    loadImageSlots().then(setImageSlots);
  }, []);

  const coverImageUrl = useMemo(() => resolveCalendarCoverUrl(viewMonth + 1, imageSlots), [viewMonth, imageSlots]);

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

  const schedulesByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    schedules.forEach((s) => {
      if (!map[s.scheduledDate]) map[s.scheduledDate] = [];
      map[s.scheduledDate].push(s);
    });
    return map;
  }, [schedules]);

  const createItem: CalendarMonth["createItem"] = async (input) => {
    const result = await createSchedule(input);
    if (result) {
      setSchedules((prev) => [...prev, result].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
    }
    return result;
  };

  const toggleItem = async (item: ScheduleItem) => {
    const ok = await toggleScheduleDone(item.id, !item.done);
    if (ok) setSchedules((prev) => prev.map((s) => (s.id === item.id ? { ...s, done: !s.done } : s)));
    return ok;
  };

  const deleteItem = async (id: string) => {
    const ok = await deleteSchedule(id);
    if (ok) setSchedules((prev) => prev.filter((s) => s.id !== id));
    return ok;
  };

  return { schedules, schedulesByDate, fields, canEdit, createItem, toggleItem, deleteItem, coverImageUrl };
}
