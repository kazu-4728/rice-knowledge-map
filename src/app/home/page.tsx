import AppShell from "../../components/layout/AppShell";
import HomeScreen from "../../features/home/HomeScreen";

export const metadata = { title: "ホーム | みらい稲作管理" };

/**
 * アプリの顔となる常設ホーム（Issue #72）。
 * 通常起動・通常ログイン後の入口。明確なディープリンクはここを経由しない。
 */
export default function HomePage() {
  return (
    <AppShell>
      <HomeScreen />
    </AppShell>
  );
}
