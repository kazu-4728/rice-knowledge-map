import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { recentRecords } from "@/features/preview/demo-data";
import type { RecordItem } from "@/features/preview/types";

const filters = ["すべて", "写真", "音声", "作業", "水管理"];

function categoryTone(category: RecordItem["category"]) {
  if (category === "異常") return "orange";
  if (category === "水管理") return "blue";
  return "green";
}

function pointIcon(pointType: RecordItem["pointType"]): IconName {
  if (pointType === "outlet") return "waves";
  if (pointType === "caution") return "warning";
  if (pointType === "weed") return "sprout";
  return "drop";
}

function RecordCard({ record }: { record: RecordItem }) {
  return (
    <article className="recordRow">
      <time>{record.time}</time>
      <div className={`recordThumb thumb-${record.pointType}`}>
        {record.media === "audio" ? <span className="audioPulse">{record.audioDuration}</span> : null}
      </div>
      <div className="recordBody">
        <strong>
          <Icon name={pointIcon(record.pointType)} />
          {record.title}
        </strong>
        <span>
          <Icon name="pin" size={17} />
          {record.fieldName}（{record.fieldArea}）
        </span>
      </div>
      <Chip tone={categoryTone(record.category)}>{record.category}</Chip>
      <Icon name="pin" className="recordMapIcon" />
    </article>
  );
}

export function RecordsScreen() {
  const grouped = recentRecords.reduce<Record<string, RecordItem[]>>((acc, record) => {
    acc[record.date] = acc[record.date] ?? [];
    acc[record.date].push(record);
    return acc;
  }, {});

  return (
    <div className="screenContent recordsScreen">
      <div className="recordFilters">
        {filters.map((filter, index) => (
          <Chip key={filter} tone={index === 0 ? "green" : "white"} selected={index === 0}>
            {filter}
          </Chip>
        ))}
      </div>

      <label className="searchBox">
        <Icon name="search" />
        <input type="search" placeholder="キーワードで検索（圃場名・作業内容など）" />
        <button type="button" aria-label="詳細フィルター">
          <Icon name="filter" />
        </button>
      </label>

      {Object.entries(grouped).map(([date, records]) => (
        <section key={date} className="recordDateGroup">
          <h2>{date}</h2>
          <Card className="recordGroupCard">
            {records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}
