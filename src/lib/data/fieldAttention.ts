import type { FieldPoint } from "../../types";
import { loadFarmData, type FarmData } from "./farm";
import { excludePointBackedIssues, loadOpenIssueRecords } from "./records";

/**
 * 田んぼ単位の異常/要確認集計（田んぼOS共通）。
 * 以前は HomeScreen.tsx / MapSummarySheet.tsx / TodayStory.tsx / fields/page.tsx の
 * 4箇所にほぼ同一のロジックが重複していたため、ここに一本化する。
 * 計算ロジック自体は移設元と完全に同一（件数の食い違いを起こさないことを最優先）。
 */
export type FieldAttention = {
  id: string;
  name: string;
  issueCount: number;
  needsCheckCount: number;
};

export type FieldAttentionSummary = {
  mode: FarmData["mode"];
  /** 登録済み田んぼの基本一覧（id/nameのみ） */
  fields: { id: string; name: string }[];
  /** 要注意順（issue+needsCheck降順）にソート済み */
  attentionFields: FieldAttention[];
  totalIssue: number;
  totalNeedsCheck: number;
  /** バナー等の件数表示用の正確な総数（COUNTベース。loadOpenIssueRecordsのcountをそのまま透過） */
  openIssueCount: number;
};

export async function loadFieldAttention(): Promise<FieldAttentionSummary> {
  const [farm, { records: issueRecords, count }] = await Promise.all([
    loadFarmData(),
    loadOpenIssueRecords(),
  ]);

  const items = farm.fieldsGeoJSON.features.map((f) => ({
    id: String(f.id ?? f.properties?.id ?? ""),
    name: String(f.properties?.name ?? ""),
  }));

  const fieldNameMap = new Map(items.map((f) => [f.id, f.name]));
  const attnMap = new Map<string, { issueCount: number; needsCheckCount: number }>();
  farm.points.forEach((p: FieldPoint) => {
    if (p.status !== "issue" && p.status !== "needs_check") return;
    if (!p.fieldId) return;
    const entry = attnMap.get(p.fieldId) ?? { issueCount: 0, needsCheckCount: 0 };
    if (p.status === "issue") entry.issueCount++;
    else entry.needsCheckCount++;
    attnMap.set(p.fieldId, entry);
  });
  // ピンに紐付いた異常記録はピン側で数え済みのため、「記録のみ」の異常だけを加算する
  excludePointBackedIssues(issueRecords, farm.points).forEach(({ fieldId, isIssue }) => {
    if (!fieldId) return;
    const entry = attnMap.get(fieldId) ?? { issueCount: 0, needsCheckCount: 0 };
    if (isIssue) entry.issueCount++;
    else entry.needsCheckCount++;
    attnMap.set(fieldId, entry);
  });

  const attentionFields: FieldAttention[] = [];
  attnMap.forEach((counts, fid) => {
    attentionFields.push({ id: fid, name: fieldNameMap.get(fid) ?? "", ...counts });
  });
  attentionFields.sort((a, b) => (b.issueCount + b.needsCheckCount) - (a.issueCount + a.needsCheckCount));

  let totalIssue = 0;
  let totalNeedsCheck = 0;
  attentionFields.forEach((f) => {
    totalIssue += f.issueCount;
    totalNeedsCheck += f.needsCheckCount;
  });

  return {
    mode: farm.mode,
    fields: items,
    attentionFields,
    totalIssue,
    totalNeedsCheck,
    openIssueCount: count,
  };
}
