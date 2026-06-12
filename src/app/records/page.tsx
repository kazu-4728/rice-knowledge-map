import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import RecordsScreen from "../../features/records/RecordsScreen";

export default function RecordsPage() {
  return (
    <AppShell>
      <Suspense>
        <RecordsScreen />
      </Suspense>
    </AppShell>
  );
}
