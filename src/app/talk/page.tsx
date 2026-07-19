import { redirect } from "next/navigation";

/**
 * みんなの記録（/talk）は再設計フェーズ5で記録タイムライン（/records）へ統合した。
 * 旧URLの互換のためリダイレクトする。
 */
export default function TalkPage() {
  redirect("/records");
}
