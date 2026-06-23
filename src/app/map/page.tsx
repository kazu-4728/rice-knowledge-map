import AppShell from "../../components/layout/AppShell";
import MapScreen from "../../features/map/MapScreen";

export default function MapPage() {
  return (
    <AppShell fullBleed showHeader={false}>
      <MapScreen />
    </AppShell>
  );
}
