"use client";

import AppShell from "../../components/layout/AppShell";
import LandingScreen from "../landing/LandingScreen";
import HomeDashboard from "./HomeDashboard";
import { useAuth } from "../auth/useAuth";

/**
 * 「/」の出し分け（再設計フェーズ5・モード分離）。
 * - ログイン時: AppShell+ボトムタブ内の「今日のダッシュボード」（現場モードのアプリ画面）
 * - 未ログイン時: LP（LandingScreen。課題提起・機能紹介はこちらだけが持つ）
 * loading中はどちらとも判定できないため、点滅を避ける無地の背景だけを出す。
 */
export default function HomeGate() {
  const { loading, session } = useAuth();

  if (loading) {
    return <div className="min-h-dvh bg-flow-cream" />;
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
