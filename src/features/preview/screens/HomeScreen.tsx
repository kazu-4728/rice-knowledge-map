import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FieldSummaryStrip } from "@/features/farm-fields/FieldSummaryStrip";
import { recentRecords, scheduleItems } from "../demo-data";
import type { TabKey } from "../types";

type HomeScreenProps = {
  onNavigate: (tab: TabKey) => void;
};

const quickActions = [
  { label: "写真で記録", icon: "camera" as const },
  { label: "音声で記録", icon: "mic" as const },
  { label: "マップ", icon: "pin" as const },
  { label: "作業記録", icon: "field" as const },
];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="screenContent homeScreen">
      <Card className="greetingCard">
        <div className="avatarIcon">
          <Icon name="users" />
        </div>
        <div>
          <strong>おはようございます</strong>
          <p>今日の確認箇所をマップで整理しています。</p>
        </div>
        <div className="todayBlock">
          <span>2025年</span>
          <strong>5月24日（土）</strong>
        </div>
      </Card>

      <Card className="weatherCard">
        <div className="weatherSun" aria-hidden="true" />
        <strong>24℃</strong>
        <p>最高 27℃ / 最低 16℃</p>
        <p>降水確率 10% / 湿度 62%</p>
        <Chip tone="green">サンプル地域</Chip>
      </Card>

      <SectionHeader title="今日の予定" icon={<Icon name="calendar" />} action="すべて見る" />
      <Card className="scheduleList">
        {scheduleItems.map((item) => (
          <article key={`${item.time}-${item.title}`} className="scheduleRow">
            <time>{item.time}</time>
            <div>
              <strong>{item.title}</strong>
              <span>圃場：{item.fieldName}</span>
            </div>
            <Icon name={item.icon} />
            <Chip tone={item.status === "進行中" ? "orange" : "blue"}>{item.status}</Chip>
          </article>
        ))}
      </Card>

      <SectionHeader title="クイックアクション" icon={<Icon name="warning" />} />
      <div className="quickGrid">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="quickActionCard"
            onClick={() => (action.label === "マップ" ? onNavigate("map") : undefined)}
          >
            <Icon name={action.icon} size={34} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <FieldSummaryStrip />

      <SectionHeader title="最近の記録" icon={<Icon name="calendar" />} action="すべて見る" />
      <Card className="compactRecordList">
        {recentRecords.slice(0, 3).map((record) => (
          <article key={record.id} className="compactRecordRow">
            <div className={`recordThumb thumb-${record.pointType}`} />
            <div>
              <strong>{record.title}</strong>
              <span>
                {record.date.replace("（土）", "")} {record.time}
              </span>
            </div>
            <Chip tone={record.fieldName === "B田" ? "orange" : record.fieldName === "C田" ? "gray" : "green"}>
              {record.fieldName}
            </Chip>
          </article>
        ))}
      </Card>

      <Button className="wideCta" icon={<Icon name="map" />} onClick={() => onNavigate("map")}>
        マップで確認する
      </Button>
    </div>
  );
}
