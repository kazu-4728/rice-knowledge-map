import { getSupabase } from "../supabase/client";

export type MemberRole = "owner" | "editor" | "viewer";
/** 招待で付与できる権限（owner は招待では付与しない。0001_init.sql の invite_role） */
export type InviteRole = "editor" | "viewer";

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "管理者",
  editor: "編集者",
  viewer: "閲覧者",
};

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "記録・田んぼの編集に加えて、メンバーの権限変更と招待ができます",
  editor: "記録・田んぼの追加と編集ができます",
  viewer: "記録や田んぼを見るだけできます（追加・編集はできません）",
};

export type GroupMember = {
  userId: string;
  displayName: string;
  role: MemberRole;
  /** ログイン中の自分自身か */
  isMe: boolean;
  joinedAt: string;
};

export type GroupMembersData = {
  /**
   * demo: Supabase未設定
   * anon: 未ログイン
   * live: ログイン済み（グループ未作成なら members が空）
   * error: 取得失敗
   */
  mode: "demo" | "anon" | "live" | "error";
  groupId: string | null;
  groupName: string;
  /** ログイン中の自分の権限（未所属なら null） */
  myRole: MemberRole | null;
  members: GroupMember[];
};

const VALID_ROLES: readonly MemberRole[] = ["owner", "editor", "viewer"];

function toRole(value: unknown): MemberRole {
  return (VALID_ROLES as readonly string[]).includes(value as string) ? (value as MemberRole) : "viewer";
}

function formatJoinedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

type MemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string } | null;
};

/**
 * 所属グループのメンバー一覧を読み込む。
 * グループが無いユーザーに対してここでグループを作りはしない（閲覧が作成の副作用を持たないようにする）。
 */
export async function loadGroupMembers(): Promise<GroupMembersData> {
  const empty = { groupId: null, groupName: "", myRole: null, members: [] };
  const sb = getSupabase();
  if (!sb) return { mode: "demo", ...empty };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { mode: "anon", ...empty };
    const userId = sessionData.session.user.id;

    const { data: mine, error: mineError } = await sb
      .from("farm_group_members")
      .select("group_id, role, farm_groups(name)")
      .eq("user_id", userId)
      .order("joined_at")
      .limit(1);
    if (mineError) {
      console.warn("[members] my membership fetch failed", mineError);
      return { mode: "error", ...empty };
    }
    const myRow = mine?.[0] as unknown as
      | { group_id: string; role: string; farm_groups: { name: string } | null }
      | undefined;
    if (!myRow) return { mode: "live", ...empty };

    const { data, error } = await sb
      .from("farm_group_members")
      .select("user_id, role, joined_at, profiles(display_name)")
      .eq("group_id", myRow.group_id)
      .order("joined_at");
    if (error) {
      console.warn("[members] fetch failed", error);
      return { mode: "error", ...empty };
    }

    const rows = (data ?? []) as unknown as MemberRow[];
    return {
      mode: "live",
      groupId: myRow.group_id,
      groupName: myRow.farm_groups?.name ?? "",
      myRole: toRole(myRow.role),
      members: rows.map((r) => ({
        userId: r.user_id,
        displayName: r.profiles?.display_name || "名前未設定",
        role: toRole(r.role),
        isMe: r.user_id === userId,
        joinedAt: formatJoinedAt(r.joined_at),
      })),
    };
  } catch (err) {
    console.warn("[members] load error", err);
    return { mode: "error", ...empty };
  }
}

export type UpdateRoleResult =
  | { status: "saved" }
  | { status: "denied" }
  | { status: "last_owner" }
  | { status: "demo" }
  | { status: "error"; message: string };

/**
 * メンバーの権限を変更する。
 *
 * 制約3（tasks/TASKS.md PR1）: 最後の管理者を降格させると、以後グループの誰も
 * 権限変更・招待発行・グループ更新ができなくなり、自己回復もできない
 * （members_update / invites_insert / groups_update がいずれも owner 権限を要求するため）。
 * そのため「グループに owner が1人しか居ないとき、その owner を降格する」変更は
 * 送信前にここで止める。UI側でもボタンを無効化しているが、
 * 一覧が古いまま操作された場合に備えて最新のメンバー構成を読み直して判定する。
 */
export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  nextRole: MemberRole
): Promise<UpdateRoleResult> {
  const sb = getSupabase();
  if (!sb) return { status: "demo" };

  try {
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { status: "denied" };

    const { data: current, error: currentError } = await sb
      .from("farm_group_members")
      .select("user_id, role")
      .eq("group_id", groupId);
    if (currentError) {
      console.warn("[members] role precheck failed", currentError);
      return { status: "error", message: currentError.message };
    }

    const rows = (current ?? []) as { user_id: string; role: string }[];
    const target = rows.find((r) => r.user_id === targetUserId);
    if (!target) return { status: "denied" };
    if (toRole(target.role) === nextRole) return { status: "saved" };

    const owners = rows.filter((r) => toRole(r.role) === "owner");
    if (nextRole !== "owner" && toRole(target.role) === "owner" && owners.length <= 1) {
      return { status: "last_owner" };
    }

    // RLSで弾かれた更新はエラーにならず0件成功になるため、結果行で判定する
    const { data, error } = await sb
      .from("farm_group_members")
      .update({ role: nextRole })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select("user_id");
    if (error) {
      console.warn("[members] role update failed", error);
      return { status: "error", message: error.message };
    }
    if (!data || data.length === 0) return { status: "denied" };
    return { status: "saved" };
  } catch (err) {
    console.warn("[members] role update error", err);
    return { status: "error", message: "権限の変更に失敗しました" };
  }
}
