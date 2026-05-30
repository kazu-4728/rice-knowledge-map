import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import type { FieldPoint } from "@/features/preview/types";

type MapDetailSheetProps = {
  point: FieldPoint;
};

function statusLabel(status: FieldPoint["status"]) {
  if (status === "needs_check") return "要確認";
  if (status === "issue") return "異常";
  if (status === "resolved") return "対応済み";
  return "良好";
}

export function MapDetailSheet({ point }: MapDetailSheetProps) {
  const pointIcon = point.type === "inlet" ? "drop" : point.type === "outlet" ? "waves" : "warning";

  return (
    <aside className="mapDetailSheet" aria-label="選択中の固定ポイント">
      <div className="sheetHandle" />
      <div className="sheetTitleRow">
        <Icon name={pointIcon} size={38} />
        <div>
          <h3>{point.name}</h3>
        </div>
        <Chip tone={point.status === "needs_check" ? "orange" : "green"}>{statusLabel(point.status)}</Chip>
      </div>
      <div className="sheetDetailGrid">
        <dl className="sheetMeta">
          <div>
            <dt>
              <Icon name="calendar" size={18} />
              最終記録
            </dt>
            <dd>{point.lastRecord}</dd>
          </div>
          <div>
            <dt>
              <Icon name="drop" size={18} />
              水位
            </dt>
            <dd>{point.waterLevel ?? "未確認"}</dd>
          </div>
          <div>
            <dt>
              <Icon name="field" size={18} />
              メモ
            </dt>
            <dd>{point.status === "needs_check" ? "夕方に再確認" : "詰まりなし"}</dd>
          </div>
        </dl>
        <div className={`sheetPreview thumb-${point.type}`} aria-hidden="true">
          <span className="sheetPreviewArrow">›</span>
        </div>
      </div>
      <div className="sheetActions">
        <Button variant="secondary" icon={<Icon name="field" />}>詳細</Button>
        <Button icon={<Icon name="edit" />}>記録する</Button>
      </div>
    </aside>
  );
}
