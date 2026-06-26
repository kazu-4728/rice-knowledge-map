# REF-001: MapCanvas 分割計画

最終更新: 2026-06-26  
対象ファイル: `src/features/map/MapCanvas.tsx`（現在 1529 行）  
状態: TODO（実装前の設計文書）

---

## 0. 目的と制約

MapCanvas.tsx は現在 1529 行あり、MapLibre 初期化・地図イベント・描画ジェスチャー・モード制御・田んぼ操作・ピン操作・UI 描画・診断パネルが 1 ファイルに混在している。

**この分割の目的は責務の明確化のみ。外見・操作結果・モード遷移ロジックは変えない。**

---

## 1. 分離する責務（8 項目）

| # | 責務 | 移動先（案） | 概要 |
|---|---|---|---|
| R-01 | MapLibre 初期化 | `hooks/useMapInit.ts` | `mapRef` 生成、スタイル URL、タイル設定、`onLoad` コールバック |
| R-02 | 地図イベント（クリック・ドラッグ） | `hooks/useMapEvents.ts` | `map.on('click', ...)` など。タップ座標取得と `activateField` / `activatePoint` の委譲 |
| R-03 | 描画ジェスチャー管理 | `hooks/useFieldDraw.ts`（既存・拡張） | タッチ/マウスの頂点追加、`liveEmpty` フラグ。既存 hook に統合 |
| R-04 | MapLibre サイズ復帰（多重防御） | `hooks/useMapResize.ts` | `ResizeObserver`・`window.resize`・`visualViewport.resize`・`returnToBrowse` 後 rAF をまとめる |
| R-05 | 田んぼ GeoJSON 描画 | `hooks/useFieldLayers.ts` | Source / Layer 追加・更新。ポリゴン・アウトライン・ラベルの styleExpression |
| R-06 | ピン Marker 管理 | `hooks/usePinMarkers.ts` | `field_points` から Marker を生成・更新・削除 |
| R-07 | モード制御と遷移ロジック | `hooks/useMapMode.ts` | `Mode` discriminated union の `useState`・`returnToBrowse`・`beginDrawing`・`selectAndFly` |
| R-08 | UI 描画（JSX） | `MapCanvas.tsx`（残す） | 上記 hooks を組み合わせて JSX を返す「組立て中心」のファイルにする |

---

## 2. 対象外（この PR では変更しない）

- `src/features/map/FieldSearchSheet.tsx` - ホイールピッカー。分割後も独立
- `src/features/map/FieldPlaceOverlay.tsx` - 場所合わせ UI
- `src/features/map/FieldDrawOverlay.tsx` - 描画バナー UI
- `src/features/map/FieldNameDialog.tsx` - 名前入力ダイアログ
- `src/features/map/AddPinSheet.tsx` - ピン追加シート
- `src/features/map/MapBottomSheet.tsx` - モバイル詳細シート
- `src/features/map/MapDetailPanel.tsx` - PC 右サイドバー
- `src/features/map/LayoutDebugPanel.tsx` - デバッグパネル
- `useFieldDraw` の既存インタフェース（`startDraw`, `cancelDraw`, `addPoint` など）
- Supabase クエリ（`saveField`, `deleteField`, `addPin` など）の変更
- UI の見た目・余白・アニメーション
- モード遷移ロジックの変更（遷移先・条件を変えない）

---

## 3. 保持すべき不変条件（10 項目）

| # | 不変条件 | 根拠 |
|---|---|---|
| I-01 | `Mode` は discriminated union で 1 つの排他的状態 | MAP_STATE_MACHINE.md のモデル |
| I-02 | `drawing` / `naming` は `drawState`（useFieldDraw）が表示を制御し、`mode` より優先される | beginDrawing() が mode を browse に戻す設計 |
| I-03 | `returnToBrowse()` は単一の出口。cancelDraw・mode リセット・各フラグクリア・map.resize を必ず行う | MAP_STATE_MACHINE.md「どのモードから browse へ戻る時も保証すること」 |
| I-04 | `placing`・`drawing`・`naming` 時は画面上部に「地図へ戻る」ボタンが常時表示される | iOS Safari でアドレスバーが出て下部ボタンが隠れた時の退避導線 |
| I-05 | 描画中（drawState.mode = "drawing"）の 1 本指はジェスチャーに奪われない | `touch-action: none` の適用範囲。既存の iOS Safari 対策 |
| I-06 | `activatePoint` は `placing` / `addPin` / `picker` / `isDrawingOrNaming` 中は何もしない（ガード） | ピン誤タップ防止（PR #40 修正） |
| I-07 | map.resize は DOM 更新後に必ず 1 回呼ばれる（rAF 経由） | resize を呼ばないと地図の描画領域がずれる |
| I-08 | `visualViewport.resize` のデバウンスは 400ms | 実装値（250ms ではない） |
| I-09 | 新規田んぼ保存後は `browse` モードへ戻る。描き直し保存後は `field` モードへ遷移する | handleSaveField() の分岐 |
| I-10 | `FieldSearchSheet` への `previewField` と `selectedField` は分離する | スクロール中プレビュー ≠ 正式選択。PR #39 の設計 |

---

## 4. 分割順序と移動リスク

分割は **リスクの低い順**に行い、各ステップで既存 5 フローの動作確認を行う。

| ステップ | 内容 | リスク | 確認点 |
|---|---|---|---|
| Step 1 | `useMapResize`（R-04）を抽出 | 低 | returnToBrowse 後に地図サイズが正常に復帰する |
| Step 2 | `useFieldLayers`（R-05）を抽出 | 低 | 田んぼポリゴン・アウトライン・ラベルが正常表示される |
| Step 3 | `usePinMarkers`（R-06）を抽出 | 低〜中 | ピンが地図上に正常表示され、タップで `activatePoint` が呼ばれる |
| Step 4 | `useMapInit`（R-01）を抽出 | 中 | 地図が正常に初期化され、タイルが読み込まれる |
| Step 5 | `useMapEvents`（R-02）を抽出 | 中 | 田んぼタップ・ピンタップ・地図タップ（addPin モード）が正常動作する |
| Step 6 | `useMapMode`（R-07）を抽出 | 高 | 全モード遷移（5 フロー）が正常動作する。I-01〜I-10 を確認 |
| Step 7 | MapCanvas.tsx をレビュー | ― | 残った JSX が「組立て」のみであることを確認。200 行以下が目標 |

---

## 5. 各 Hook のインタフェース（案）

### useMapInit

```typescript
function useMapInit(containerRef: RefObject<HTMLDivElement>): {
  mapRef: RefObject<maplibregl.Map | null>;
  mapLoaded: boolean;
}
```

### useMapResize

```typescript
function useMapResize(
  mapRef: RefObject<maplibregl.Map | null>,
  containerRef: RefObject<HTMLDivElement>
): {
  resizeMapSoon: () => void; // rAF 経由の 1 回 resize
}
```

### useMapMode

```typescript
function useMapMode(params: {
  mapRef: RefObject<maplibregl.Map | null>;
  drawState: DrawState;
  cancelDraw: () => void;
  resizeMapSoon: () => void;
}): {
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  returnToBrowse: () => void;
  beginDrawing: () => void;
  selectAndFly: (field: SelectedField) => void;
  previewField: SelectedField | null;
  setPreviewField: (f: SelectedField | null) => void;
  redrawTarget: SelectedField | null;
  setRedrawTarget: (f: SelectedField | null) => void;
  pendingPinLngLat: maplibregl.LngLat | null;
  setPendingPinLngLat: (ll: maplibregl.LngLat | null) => void;
}
```

### useFieldLayers

```typescript
function useFieldLayers(params: {
  mapRef: RefObject<maplibregl.Map | null>;
  mapLoaded: boolean;
  fieldsGeoJSON: FeatureCollection;
  mode: Mode;
  previewField: SelectedField | null;
}): void
```

### usePinMarkers

```typescript
function usePinMarkers(params: {
  mapRef: RefObject<maplibregl.Map | null>;
  mapLoaded: boolean;
  pins: FieldPoint[];
  onActivate: (point: FieldPoint) => void;
}): void
```

### useMapEvents

```typescript
function useMapEvents(params: {
  mapRef: RefObject<maplibregl.Map | null>;
  mapLoaded: boolean;
  mode: Mode;
  drawState: DrawState;
  onActivateField: (feature: GeoJSON.Feature) => void;
  onActivatePoint: (point: FieldPoint) => void;
  onMapTap: (lngLat: maplibregl.LngLat) => void;
  addDrawPoint: (lngLat: maplibregl.LngLat) => void;
}): void
```

---

## 6. 完了条件

- `MapCanvas.tsx` の行数が大幅に削減され、JSX 組立て中心のファイルになっている
- 既存 5 フロー（F-01〜F-05、docs/UX_FLOW_BASELINE.md 参照）が全て維持される
- `npx tsc --noEmit` / `npm run lint` / `npm run build` がすべて通る
- I-01〜I-10 の不変条件を PR 本文でチェックリスト確認する

---

## 7. 実装前に決めること（着手時に補足）

- `useMapMode` の `redrawTarget` と `previewField` は `useFieldDraw` との依存関係を整理してから移動する
- `useMapEvents` 内の描画ジェスチャー処理（`addPoint` 呼び出し）を R-03 と R-02 のどちらに置くか確認する
- `modeRef`（useRef で mode の最新値を保持）を hook に持ち込む場合の命名を揃える
