import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import MapScreen from "../../features/map/MapScreen";

export const metadata = { title: "現場OS | みらい稲作管理" };

export default function MapPage() {
  return (
    <AppShell fullBleed showHeader={false}>
      <Suspense fallback={null}>
        <MapScreen />
      </Suspense>
    </AppShell>
  );
}
