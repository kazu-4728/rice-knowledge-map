import { redirect } from "next/navigation";

/**
 * 旧ホームURL（Issue #72）。「/」がランディングとホームを統合した唯一の常設ホームになった
 * ため（2026-07-16再考）、後方互換のリダイレクトだけを残す。
 */
export default function HomePage() {
  redirect("/");
}
