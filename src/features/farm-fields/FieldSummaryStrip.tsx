import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { fields } from "@/features/preview/demo-data";

export function FieldSummaryStrip() {
  const mainField = fields[0];

  return (
    <div className="fieldSummaryStrip" aria-label="選択中の田んぼ概要">
      <Card>
        <Icon name="sprout" />
        <span>品種</span>
        <strong>{mainField.crop}</strong>
      </Card>
      <Card>
        <Icon name="field" />
        <span>面積</span>
        <strong>{mainField.area}</strong>
      </Card>
      <Card>
        <Icon name="calendar" />
        <span>作付</span>
        <strong>2026年作</strong>
      </Card>
      <Card>
        <Icon name="sprout" />
        <span>生育</span>
        <strong>{mainField.season}</strong>
      </Card>
    </div>
  );
}
