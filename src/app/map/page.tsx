import AppShell from "../../components/layout/AppShell";
import MapClientWrapper from "../../features/map/MapClientWrapper";

export default function MapPage() {
  return (
    <AppShell hideHeader>
      <div className="h-[calc(100dvh-56px)]">
        <MapClientWrapper />
      </div>
    </AppShell>
  );
}
