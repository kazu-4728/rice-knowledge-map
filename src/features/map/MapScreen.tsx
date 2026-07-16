"use client";

import { useCallback, useEffect, useState } from "react";
import MapClientWrapper from "./MapClientWrapper";
import MapSummarySheet from "./MapSummarySheet";

export default function MapScreen() {
  const [mapMode, setMapMode] = useState("browse");
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // MapSummarySheetの「最初の田んぼを登録する」CTAからMapCanvasの場所合わせを起動する（Issue #69）
  const [registerTrigger, setRegisterTrigger] = useState(0);
  // 新規田んぼの保存成功のたびに増え、MapSummarySheetに集計の再取得を促す（Issue #69）
  const [fieldsVersion, setFieldsVersion] = useState(0);

  // /map?register=1 で田んぼ登録（場所合わせ）を直接開始する。
  // /fieldsの「田んぼを追加（マップで描く）」などマップ外からの登録導線用
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "1") {
      setRegisterTrigger((n) => n + 1);
      // リロードや戻る操作で再度描画モードに入らないようURLからクエリを外す
      history.replaceState(null, "", "/map");
    }
  }, []);

  const handleModeChange = useCallback((mode: string) => {
    setMapMode(mode);
  }, []);

  const handleExpandChange = useCallback((expanded: boolean) => {
    setSheetExpanded(expanded);
  }, []);

  const handleRegisterField = useCallback(() => {
    setRegisterTrigger((n) => n + 1);
  }, []);

  const handleFieldRegistered = useCallback(() => {
    setFieldsVersion((n) => n + 1);
  }, []);

  const isBrowse = mapMode === "browse";

  return (
    <div className="relative h-full w-full">
      <MapClientWrapper
        onModeChange={handleModeChange}
        hideControls={sheetExpanded}
        registerTrigger={registerTrigger}
        onFieldRegistered={handleFieldRegistered}
      />
      <MapSummarySheet
        visible={isBrowse}
        onExpandChange={handleExpandChange}
        onRegisterField={handleRegisterField}
        refreshKey={fieldsVersion}
      />
    </div>
  );
}
