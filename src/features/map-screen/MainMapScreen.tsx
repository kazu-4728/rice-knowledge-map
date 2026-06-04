import { AppRoot } from "./AppRoot";
import type { MobileTab } from "./MobileBottomNav";

type Props = {
  initialTab?: MobileTab;
};

export function MainMapScreen({ initialTab = "map" }: Props) {
  return <AppRoot activeTab={initialTab} />;
}
