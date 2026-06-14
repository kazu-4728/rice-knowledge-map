import { getSupabase } from "../supabase/client";
import { ensureGroupId } from "./farm";

export type ScheduleCategory =
  | "water_in" | "water_out" | "fertilize" | "pesticide"
  | "weed" | "harvest" | "other";

export const CATEGORY_LABELS: Record<ScheduleCategory, { label: string; color: string; bg: string }> = {
  water_in:   { label: "取水",   color: "text-sky-600",   bg: "bg-sky-50"   },
  water_out:  { label: "排水",   color: "text-blue-600",  bg: "bg-blue-50"  },
  fertilize:  { label: "施肥",   color: "text-lime-700",  bg: "bg-lime-50"  },
  pesticide:  { label: "農薬",   color: "text-orange-600",bg: "bg-orange-50"},
  weed:       { label: "除草",   color: "text-green-700", bg: "bg-green-50" },
  harvest:    { label: "収穫",   color: "text-yellow-700",bg: "bg-yellow-50"},
  other:      { label: "その他", color: "text-gray-600",  bg: "bg-gray-50"  },
};

export type ScheduleItem = {
  id: string;
  groupId: string;
  fieldId: string | null;
  fieldName?: string | null;
  title: string;
  scheduledDate: string; // "YYYY-MM-DD"
  category: ScheduleCategory;
  memo: string | null;
  done: boolean;
  doneAt: string | null;
  createdBy: string | null;
  createdAt: string;
};

export async function loadSchedules(from: string, to: string): Promise<ScheduleItem[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const groupId = await ensureGroupId();
  if (!groupId) return [];

  const { data, error } = await sb
    .from("farm_schedules")
    .select(`
      id, group_id, field_id, title, scheduled_date, category, memo,
      done, done_at, created_by, created_at,
      farm_fields(name)
    `)
    .eq("group_id", groupId)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date", { ascending: true });

  if (error) { console.warn("[schedule] load failed", error); return []; }

  return (data ?? []).map((r) => ({
    id: r.id,
    groupId: r.group_id,
    fieldId: r.field_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldName: (r as any).farm_fields?.name ?? null,
    title: r.title,
    scheduledDate: r.scheduled_date,
    category: (r.category as ScheduleCategory) ?? "other",
    memo: r.memo,
    done: r.done,
    doneAt: r.done_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

export async function createSchedule(input: {
  title: string;
  scheduledDate: string;
  category: ScheduleCategory;
  fieldId?: string | null;
  memo?: string | null;
}): Promise<ScheduleItem | null> {
  const sb = getSupabase();
  if (!sb) return null;
  // 田んぼを選んだ場合はその田んぼのグループに合わせる（複数グループ所属時に
  // ensureGroupId()=最初の所属 を入れると field_id とグループ不一致で整合トリガーに弾かれる）
  let groupId: string | null = null;
  if (input.fieldId) {
    const { data: field } = await sb.from("farm_fields").select("group_id").eq("id", input.fieldId).maybeSingle();
    groupId = (field?.group_id as string | undefined) ?? null;
  }
  if (!groupId) groupId = await ensureGroupId();
  if (!groupId) return null;

  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("farm_schedules")
    .insert({
      group_id: groupId,
      field_id: input.fieldId ?? null,
      title: input.title,
      scheduled_date: input.scheduledDate,
      category: input.category,
      memo: input.memo ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) { console.warn("[schedule] create failed", error); return null; }
  return {
    id: data.id, groupId: data.group_id, fieldId: data.field_id,
    title: data.title, scheduledDate: data.scheduled_date,
    category: data.category as ScheduleCategory, memo: data.memo,
    done: data.done, doneAt: data.done_at, createdBy: data.created_by, createdAt: data.created_at,
  };
}

export async function toggleScheduleDone(id: string, done: boolean): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb
    .from("farm_schedules")
    .update({ done, done_at: done ? new Date().toISOString() : null, done_by: done ? (user?.id ?? null) : null })
    .eq("id", id);
  if (error) { console.warn("[schedule] toggle failed", error); return false; }
  return true;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from("farm_schedules").delete().eq("id", id);
  if (error) { console.warn("[schedule] delete failed", error); return false; }
  return true;
}
