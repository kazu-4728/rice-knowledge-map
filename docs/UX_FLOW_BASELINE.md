# UX フロー基準線（UX-060）

最終更新: 2026-06-26

UI/UX 改修の「壊してはいけない動作」を確認するための基準表。
以後の PR では、対象フローの確認項目を PR 本文に転記して証跡を残す。

---

## 証跡状態の凡例

| 記号 | 意味 |
|---|---|
| 仕様確認済み | コードを読んで実装仕様を把握済み |
| Preview未確認 | Vercel Preview URL で動作未確認 |
| iPhone未確認 | iPhone 実機で動作未確認 |
| 証跡あり | 実機確認の OK が TASKS.md に記録されている |
| 計測値未記録 | `?layoutDebug=1` の数値が記録されていない |

---

## F-01: マップ → 田んぼ登録 → 場所合わせ → 描画 → 命名 → 保存

### 開始画面

`/map`（`MapCanvas.tsx`、`mode = { kind: "browse" }`）

### 操作

1. 上部「田んぼを選ぶ」ボタン（`IconListBullet`）をタップ → `mode = { kind: "picker" }`
2. `FieldSearchSheet.tsx` 下部「田んぼを登録する」ボタンをタップ → `mode = { kind: "placing" }`
3. `FieldPlaceOverlay.tsx` 表示。地図を自由移動・拡大縮小して場所を決める
4. 「この場所で輪郭を描く」ボタンをタップ → `startDraw()`、`mode = { kind: "browse" }`（`drawState.mode = "drawing"` が優先表示）
5. 田んぼの輪郭を指でなぞる（`useFieldDraw.ts` が頂点を追記。最低 3 点）
6. 「完成」ボタンをタップ → `drawState.mode = "naming"`、`FieldNameDialog.tsx` 表示
7. 名前を入力して「保存」

### 期待結果

- **新規保存後**: `mode = { kind: "browse" }` に戻る。田んぼポリゴンがマップ上に描画される
- 「田んぼを保存しました」トーストが表示される（`Toast.tsx`）
- FieldNameDialog の input blur → DB 保存の順序が保たれる（iOS ズーム解除のため）

### 関係コンポーネント

| ファイル | 役割 |
|---|---|
| `src/features/map/MapCanvas.tsx` | Mode 状態管理・全フローの司令塔（`handleSaveField`） |
| `src/features/map/FieldSearchSheet.tsx` | ホイールピッカー（「田んぼを登録する」CTA） |
| `src/features/map/FieldPlaceOverlay.tsx` | 場所合わせ画面（照準・案内文） |
| `src/features/map/FieldDrawOverlay.tsx` | 輪郭描画画面（完成・戻す・場所を合わせ直す） |
| `src/features/map/FieldNameDialog.tsx` | 名前入力ダイアログ（input font-size 16px、blur-before-action） |
| `src/features/map/useFieldDraw.ts` | 頂点データ管理フック（drawState 一次情報） |
| `src/lib/data/farm.ts:saveFieldPolygon()` | Supabase 保存 |

### Preview 確認要否

必要（特に placing → drawing → naming → 保存 の遷移）

### iPhone 実機確認要否

**必須（U-011）**
- iOS Safari アドレスバー変化中も上部「地図へ戻る」が見えるか
- `FieldNameDialog` の input（16px）でキーボード開閉後に地図サイズが復帰するか
- 一本指なぞりがブラウザスクロールに奪われないか
- 「田んぼを登録する」が placing 経由になっているか（旧: 即 drawing）

### 確認手段

Vercel Preview → iPhone Safari で各ステップを実行。`?layoutDebug=1` でビューポートサイズを記録

### 証跡状態

- 仕様確認済み
- Preview未確認
- iPhone未確認（U-011 残タスク）
- 計測値未記録（`?layoutDebug=1` の数値）

> **PR #40 補足**: iOS Safari の入力ズーム根本原因（input 16px化・blur-before-action）の修正は実機で不具合解消が確認済み（PR #40 マージ時）。ただし `?layoutDebug=1` でのビューポートサイズ計測値は未記録。実機での OK 証拠と数値証跡は別物として管理する。

### 注意点

- `drawing` / `naming` 中は `drawState` が一次情報。`mode` は browse のまま（`beginDrawing()` で `setMode({ kind: "browse" })` が実行される）
- `handleSaveField()` は **新規のみ** browse に戻る。描き直しは成功後に `field` へ遷移する（F-01 とは別フロー）
- demo モード（未ログイン）ではローカル保存のみ。`farmLiveRef.current === false` の分岐に注意
- `returnToBrowse()` が単一の出口。どのモードからでも呼べる（冪等）

---

## F-02: マップ → 田んぼ選択 → ホイール → 正式選択 → 詳細

### 開始画面

`/map`（`MapCanvas.tsx`、`mode = { kind: "browse" }`）

### 操作

1. 上部「田んぼを選ぶ」ボタンをタップ → `mode = { kind: "picker" }`
2. `FieldSearchSheet.tsx`（無限ループホイールピッカー）が下部から表示される
3. 一覧を縦スクロール → 中央に来たアイテムが `previewField` に設定され、地図上でアンバー色（`#F59E0B`）プレビュー + 300ms debounce 後にパン（`easeTo 400ms`）
4. 目的の田んぼが中央に来たらタップ → `onFieldSelect(f)` → `mode = { kind: "field", field }` + `flyToField` + `resizeMapSoon()`
5. 地図が flyTo、下部詳細シート（`MapBottomSheet.tsx`）が表示される
6. 「この田んぼの詳細を見る」ボタンで `/fields/[id]` へ遷移

### 期待結果

- スクロール中は `previewField` のみ更新（アンバーハイライト + パン）。`mode` は `picker` のまま
- タップで正式選択後のみ `mode = field`、緑ポリゴンと詳細シートが表示される
- 「閉じる」または背景タップで picker を閉じると `browse` に戻り、`previewField` がクリアされ、地図幅・高さが崩れない
- 検索欄は存在しない（`FieldSearchSheet` v2 で削除済み）

### 関係コンポーネント

| ファイル | 役割 |
|---|---|
| `src/features/map/MapCanvas.tsx` | `openPicker()`、`handlePreview()`、`handlePickerSelect()`、`previewField` state、`panToField()` |
| `src/features/map/FieldSearchSheet.tsx` | 無限ループホイールピッカー（`scroll-snap-type: y mandatory`、中央アイテム検出） |
| `src/features/map/MapBottomSheet.tsx` | field モード時の詳細シート |
| `src/features/map/MapDetailPanel.tsx` | PC 向け右サイドパネル（lg 以上で常時表示） |

### Preview 確認要否

必要（スクロールプレビュー・正式選択・シート閉じ後の復帰）

### iPhone 実機確認要否

**必須（U-010・U-011）**
- 指でホイールスクロールできるか（MapLibre タッチ競合なし）
- 中央プレビューが下部シートの裏に隠れず地図の上側に見えるか
- 選ばず閉じた後に地図幅・高さ・操作性が崩れないか

### 確認手段

Vercel Preview → iPhone Safari でスクロール動作確認。シート開閉前後に地図が縮んでいないか目視

### 証跡状態

- 仕様確認済み
- Preview未確認
- iPhone未確認（U-010・U-011 残タスク）
- 計測値未記録

### 注意点

- `FieldSearchSheet` のスクロール領域は `touch-action: pan-y`、`overscroll-contain`、`touchmove` の伝播停止で MapLibre のタッチを奪わない
- `panToField` は `offsetY = container.clientHeight * 0.22` で下部シートの裏に隠れないよう上側にずらす
- PC では `MapDetailPanel.tsx` が右サイドに常時表示（lg 以上）

---

## F-03: 田んぼ詳細 → ピン追加 → 保存

### 開始画面

`/map`（`MapCanvas.tsx`、`mode = { kind: "field", field: {...} }`）

### 操作

1. 下部詳細シート（`MapBottomSheet.tsx`）の「ピン追加」ボタンをタップ → `startAddPin(selectedField.id)` → `mode = { kind: "addPin", fieldId }`
2. 「地図をタップしてピンの場所を選んでください」トーストが表示される
3. 地図上の任意の場所をタップ → `pendingPinLngLat` に座標をセット（`setPendingPinLngLat([lng, lat])`）
4. `AddPinSheet.tsx` が表示される。田んぼは `fieldId` で初期選択済み
5. 種別・名前を入力して「追加」ボタンをタップ
6. 楽観的に `mode = { kind: "point", point: newPoint }` でピン詳細表示 → Marker をマップへ追加 → DB 保存
7. DB 保存成功後: local ID → DB ID の差し替え（`replaceSavedFieldId`、Marker 作り直し）
8. 保存失敗時: Marker 削除 + `mode = browse`

### 期待結果

- AddPinSheet に前の田んぼ選択（`fieldId`）が引き継がれる
- 保存後、新しいピンが地図上に Marker として表示され、ピン詳細シートが開く
- placing / addPin / picker モード中に誤タップしてもピン詳細が開かない（`activatePoint` ガード）

### 関係コンポーネント

| ファイル | 役割 |
|---|---|
| `src/features/map/MapCanvas.tsx` | `startAddPin()`、`pendingPinLngLat`、`handleAddPinConfirm()`、`activatePoint()` |
| `src/features/map/AddPinSheet.tsx` | 種別・名前入力シート（input font-size 16px） |
| `src/features/map/MapBottomSheet.tsx` | field モードの「ピン追加」ボタン |
| `src/lib/data/farm.ts:saveFieldPoint()` | Supabase 保存 |

### Preview 確認要否

必要（楽観的追加 → DB 保存成功/失敗 → Marker 差し替え）

### iPhone 実機確認要否

必要（U-008）
- 地図タップのピン座標取得精度
- AddPinSheet の input（16px）で iOS 自動ズームが発生しないか

### 確認手段

Vercel Preview → iPhone Safari でタップ座標確認

### 証跡状態

- 仕様確認済み
- Preview未確認
- iPhone未確認（U-008 残タスク）
- 計測値未記録

### 注意点

- `activatePoint` は `modeRef.current.kind` が `placing` / `addPin` / `picker` の場合と `isDrawingOrNamingRef.current === true` の場合に早期リターンする（`MapCanvas.tsx:199-204`）
- FAB からピン追加する場合は `fieldId = null`（田んぼ未指定）
- DB 保存完了前にユーザーが Marker を削除していた場合、DB にも取り消し（`deleteFieldPoint(id)`）を実行する（`MapCanvas.tsx:493-498`）

---

## F-04: 写真・音声記録 → 保存前確認 → 保存 → 詳細

### 開始画面（複数の入口）

| 入口 | URL |
|---|---|
| ホームの「写真で記録」 | `/records/new` |
| ホームの「音声メモ」 | `/records/new?type=audio` |
| 田んぼ詳細の「写真で記録」 | `/records/new?field=<fieldId>` |
| 田んぼ詳細のポイント行タップ | `/records/new?field=<fieldId>&point=<pointId>&pointType=<type>` |
| 記録詳細の「追記する」 | `/records/new?type=audio&field=<fieldId>&point=<pointId>&pointType=<type>` |

### 操作（写真記録）

1. `/records/new`（`PhotoRecordScreen.tsx`）が `AppShell backDynamic` で表示される
2. URL クエリまたは `getRecordDraft()` から `field` / `point` / `pointType` を復元
3. 「写真を撮る・選ぶ」ボタンでカメラ/ライブラリから写真を選択
4. 長辺 1600px に圧縮（`compressImage`）してプレビュー表示
5. 田んぼ・ポイント種別・メモを入力（`VoiceInputButton` で音声入力も可）
6. 「確認する」ボタン → `setRecordDraft(draft)` → `/records/new/confirm` へ遷移
7. `ConfirmRecordScreen.tsx` で内容確認
8. 「修正する」→ `router.back()` で戻り、`getRecordDraft()` で復元
9. 「保存する」→ Supabase に保存 → `setJustSaved(true)` → `/fields/[id]` または `/records/[id]`

### 期待結果

- 保存前確認で写真・音声・田んぼ・ポイント・メモが表示される
- 「修正する」でも写真・下書きが復元される
- 保存後に遷移先でトーストが出る（`consumeJustSaved()` で消費）
- 田んぼ・ポイントの引き継ぎが保存後の記録に反映されている

### 関係コンポーネント

| ファイル | 役割 |
|---|---|
| `src/features/records/PhotoRecordScreen.tsx` | 写真記録入力（`VALID_POINT_TYPES`、`compressImage` ローカル版） |
| `src/features/records/AudioRecordScreen.tsx` | 音声記録入力（MediaRecorder API） |
| `src/features/records/ConfirmRecordScreen.tsx` | 保存前確認（AppShell 未使用・独立ヘッダー） |
| `src/features/records/recordDraft.ts` | localStorage 下書き保存・復元・justSaved フラグ |
| `src/features/records/useRecordFields.ts` | 田んぼ・ポイント・GPS 共通フック |
| `src/lib/data/recordSave.ts` | Supabase 保存（record + media + point_id） |
| `src/app/records/new/page.tsx` | `type=audio` で AudioRecordScreen 分岐 |

### Preview 確認要否

必要（confirm → 修正 → 戻り → 下書き復元の往復）

### iPhone 実機確認要否

**必須（U-002）**
- カメラ撮影後の写真圧縮・プレビュー表示
- MediaRecorder 録音・再生
- VoiceInputButton（Web Speech API）の動作

### 確認手段

Vercel Preview（写真・音声・下書き復元の往復確認）。iPhone 実機で録音・保存まで通す

### 証跡状態

- 仕様確認済み
- Preview未確認
- iPhone未確認（U-002 残タスク）
- 計測値未記録（対象外）

### 注意点

- `PhotoRecordScreen.tsx` にローカル版 `compressImage` が存在する（`src/lib/utils/imageCompress.ts` の共通版と重複）
- `VALID_POINT_TYPES` バリデーションが外れると無効 pointType が DB に保存される
- `recordedAtRef` は写真を撮り直したらリセット（撮影日時の引き継ぎ）
- draft の `kind: "photo"` / `kind: "audio"` 型分岐を壊すと ConfirmRecordScreen で型エラー

---

## F-05: 記録詳細 → コメント → 対応済み

### 開始画面

`/records/[id]`（`src/app/records/[id]/page.tsx`、AppShell 未使用・独立ヘッダー）

### 操作

1. 記録一覧 or ホーム最近の記録からタップ → 記録詳細ページが表示される（`loadRecordDetail(id)`）
2. 「家族のコメント」セクションの「コメントする」ボタンをタップ → `showCommentInput = true`
3. テキスト入力または `VoiceInputButton` で音声入力 → 「送信」ボタン
4. `addComment(id, text)` → `loadRecordDetail(id)` 再取得 → `commentText` / `showCommentInput` をリセット
5. 下部アクションの「対応済みにする」をタップ → `resolveRecord(id)` → `loadRecordDetail` 再取得
6. ボタンが「対応済み」（無効化・グレー）に変わる

### 期待結果

- コメント送信後に一覧が更新される（ページ全体リロードではなく再取得）
- 「対応済みにする」が `resolved` 時は無効化
- 下部アクションの「追記する」で `followupQuery`（`field` / `point` / `pointType`）を引き継いで `/records/new` へ遷移

### 関係コンポーネント

| ファイル | 役割 |
|---|---|
| `src/app/records/[id]/page.tsx` | 記録詳細ページ全体（自前ヘッダー・SideNav/MenuDrawer なし） |
| `src/lib/data/recordDetail.ts` | `loadRecordDetail`、`addComment`、`resolveRecord`、`deleteRecord` |
| `src/components/ui/VoiceInputButton.tsx` | コメント欄の音声入力 |

### Preview 確認要否

必要（コメント追加・対応済みトグル・追記クエリ引き継ぎ）

### iPhone 実機確認要否

必要（テキストエリアのフォーカス時 iOS ズーム・safe-area 下部の余白確認）

### 確認手段

Vercel Preview でコメント投稿 → 再表示を確認。iPhone でキーボード表示中の下部アクションバー確認

### 証跡状態

- 仕様確認済み
- Preview未確認
- iPhone未確認
- 計測値未記録（対象外）

### 注意点

- コメントの `IconMore`（各コメント行の編集・削除ボタン）は現在ダミー（T-052・未実装）
- `canDelete` は `farm_group_members` の role を取得して計算（owner または自分の記録のみ）
- 削除後は `router.replace()` で遷移先 URL を上書きする（`router.back()` で 404 URL に戻らないように）
- `records/[id]/page.tsx` は AppShell を使わないため SideNav/MenuDrawer が表示されない（孤立した画面）

---

## 改修 PR での使い方

### PR 作成前

1. 対象フローを本表から特定する
2. PR 本文の「確認項目」に「操作」「注意点」の該当部分を転記する
3. Preview で各手順を実行し「Preview確認済み」に更新する
4. iPhone 実機確認が必要なフローは、確認後にのみマージする

### 証跡の記録場所

- iPhone 実機確認の結果 → `tasks/TASKS.md` の U-xxx 行に「OK 確認済み」と日付を追記
- `?layoutDebug=1` の計測値 → 同上（数値をスクリーンショットで添付 or 転記）
- Preview 確認 → PR 本文に確認手順と結果を記載
