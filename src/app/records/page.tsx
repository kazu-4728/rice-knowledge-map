import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import RecordsScreen from "../../features/records/RecordsScreen";

export const metadata = { title: "記録タイムライン | みらい稲作管理" };

export default function RecordsPage() {
  return (
    <AppShell fullBleed>
      <Suspense fallback={null}>
        <RecordsScreen />
      </Suspense>
    </AppShell>
  );
}
