import { redirect } from "next/navigation";

/**
 * 各場所の記録タブは再設計フェーズ5で廃止（Issue #64時点の4タブ構成から変更）。
 * 場所詳細（/fields/[id]）は「入り口」ではなく「着地先」のため、
 * 一覧タブを持たずマップ・ホーム・記録タイムライン経由で到達する構造にする。
 * 旧URLの互換のためマップへリダイレクトする。
 */
export default function FieldsPage() {
  redirect("/map");
}
