import { redirect } from "next/navigation";

/**
 * 旧ホーム（管理）はフェーズ2で現場OS（/map）へ統合された（Issue #67）。
 * 旧URLのブックマーク・PWA起動を壊さないためリダイレクトとして残す。
 */
export default function HomePage() {
  redirect("/map");
}
