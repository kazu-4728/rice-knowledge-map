import type { TabKey } from "@/features/preview/types";
import { Icon, type IconName } from "./Icon";

type TabItem = {
  key: TabKey;
  label: string;
  icon: IconName;
};

const tabs: TabItem[] = [
  { key: "home", label: "ホーム", icon: "home" },
  { key: "map", label: "マップ", icon: "map" },
  { key: "records", label: "記録", icon: "edit" },
  { key: "menu", label: "メニュー", icon: "menu" },
];

type BottomTabsProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <nav className="bottomTabs" aria-label="主ナビゲーション">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <button
            key={tab.key}
            type="button"
            className="bottomTab"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.key)}
          >
            <Icon name={tab.icon} size={27} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
