import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import RecordsScreen from "../../features/records/RecordsScreen";

export default function RecordsPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <RecordsScreen />
      </Suspense>
    </AppShell>
  );
}
