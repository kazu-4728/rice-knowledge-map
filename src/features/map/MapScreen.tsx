"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { fieldPoints, fields } from "@/features/preview/demo-data";
import type { FieldPoint } from "@/features/preview/types";
import { MapCanvas } from "./MapCanvas";
import { MapDetailSheet } from "./MapDetailSheet";

const filterLabels = ["すべて", "水口", "異常", "圃場", "フィルター"];

export function MapScreen() {
  const [selectedPointId, setSelectedPointId] = useState(fieldPoints[0].id);
  const selectedPoint = useMemo(
    () => fieldPoints.find((point) => point.id === selectedPointId) ?? fieldPoints[0],
    [selectedPointId],
  );

  function handlePointSelect(point: FieldPoint) {
    setSelectedPointId(point.id);
  }

  return (
    <div className="mapScreen">
      <div className="mapTopPanel">
        <div className="mapToolbar">
          <div className="screenTitleRow">
            <Icon name="map" size={36} />
            <h2>マップ</h2>
          </div>
          <Button variant="secondary" icon={<Icon name="field" />}>
            圃場一覧
          </Button>
        </div>

        <div className="filterRail" aria-label="マップフィルター">
          {filterLabels.map((label, index) => (
            <Chip key={label} tone={index === 0 ? "green" : "white"} selected={index === 0}>
              {index === filterLabels.length - 1 ? <Icon name="filter" size={18} /> : null}
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <section className="mapStage" aria-label="実画像マップPreview">
        <MapCanvas
          fields={fields}
          points={fieldPoints}
          selectedPointId={selectedPoint.id}
          onSelectPoint={handlePointSelect}
        />
        <div className="mapLegend">
          <span>
            <i className="legendPin inletPin" />
            入水口
          </span>
          <span>
            <i className="legendPin outletPin" />
            出水口
          </span>
          <span>
            <i className="legendPin cautionPin" />
            異常箇所
          </span>
        </div>
        <div className="mapControls" aria-label="地図操作（Previewでは無効）">
          <button type="button" aria-label="現在地（Previewでは無効）" disabled>
            <Icon name="pin" />
          </button>
          <button type="button" aria-label="拡大（Previewでは無効）" disabled>
            +
          </button>
          <button type="button" aria-label="縮小（Previewでは無効）" disabled>
            -
          </button>
        </div>
        <MapDetailSheet point={selectedPoint} />
      </section>
    </div>
  );
}
