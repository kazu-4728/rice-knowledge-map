"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import LandingScreen from "../landing/LandingScreen";
import HomeDashboard from "./HomeDashboard";
import { useAuth } from "../auth/useAuth";
import { IconClose } from "../../components/ui/icons";

/**
 * 「/」の出し分け（再設計フェーズ5・モード分離）。
 * - ログイン時: AppShell+ボトムタブ内の「今日のダッシュボード」（現場モードのアプリ画面）
 * - 未ログイン時: LP（LandingScreen。課題提起・機能紹介はこちらだけが持つ）
 * - ?lp=preview: ログイン中でもLP全体を表示する確認モード（サイト設定から開く。
 *   ログイン後は通常LPを見る手段が無いため、ヒーロー・バナー差し替えの確認用）
 * loading中はどちらとも判定できないため、点滅を避ける無地の背景だけを出す。
 */
export default function HomeGate() {
  const { loading, session } = useAuth();
  const searchParams = useSearchParams();
  const lpPreview = searchParams.get("lp") === "preview";

  if (loading) {
    return <div className="min-h-dvh bg-flow-cream" />;
  }

  if (session && lpPreview) {
    return (
      <div>
        <div className="sticky top-0 z-[60] flex items-center justify-between gap-2 bg-amber-400 px-4 py-2 text-xs font-bold text-amber-950">
          未ログイン時に表示されるランディングをプレビュー中
          <Link
            href="/menu/site"
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-950/10 px-3 py-1"
          >
            <IconClose className="h-3.5 w-3.5" />
            閉じる
          </Link>
        </div>
        <LandingScreen includeHomeBanners />
      </div>
    );
  }

  if (session) {
    return (
      <AppShell>
        <HomeDashboard />
      </AppShell>
    );
  }

  return <LandingScreen />;
}
