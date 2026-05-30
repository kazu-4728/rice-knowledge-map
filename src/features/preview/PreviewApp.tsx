"use client";

import { useState } from "react";
import { BottomTabs } from "@/components/ui/BottomTabs";
import { Icon } from "@/components/ui/Icon";
import { MapScreen } from "@/features/map/MapScreen";
import { RecordsScreen } from "@/features/records/RecordsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MenuScreen } from "./screens/MenuScreen";
import type { TabKey } from "./types";

export function PreviewApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("map");

  return (
    <main className="phoneApp" data-active-tab={activeTab}>
      <header className="appHeader">
        <div className="brandLockup" aria-hidden="true">
          <div className="brandMark">
            <span className="brandGrain" />
            <Icon name="sprout" size={30} />
          </div>
        </div>
        <h1>みらい稲作管理</h1>
        <button type="button" className="iconButton" aria-label="通知">
          <Icon name="bell" />
        </button>
      </header>

      <div className="screenViewport">
        {activeTab === "home" ? <HomeScreen onNavigate={setActiveTab} /> : null}
        {activeTab === "map" ? <MapScreen /> : null}
        {activeTab === "records" ? <RecordsScreen /> : null}
        {activeTab === "menu" ? <MenuScreen /> : null}
      </div>

      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}
