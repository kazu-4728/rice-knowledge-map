# マップ操作モデル（状態遷移）

`/map`（`MapCanvas`）の操作状態を、矛盾しない単一のモードとして管理する。
実装前にこの遷移図を確定し、これに沿って実装する。

## モード一覧

地図上の「いま何をしているか」を 1 つの排他的モードとして持つ。

| モード | 説明 | 地図操作 | 主なUI |
| --- | --- | --- | --- |
| `browse` | 通常閲覧 | 自由（移動・拡大縮小） | 上部メニュー＋「田んぼを選ぶ」、現在地/ズーム、「記録する」 |
| `picker` | 登録田んぼ一覧 | プログラムによるプレビューのパンのみ（手動操作は一覧で代替） | 下部シート「登録田んぼ（N件）」、固定ヘッダ／固定「田んぼを登録する」、中央スクロールプレビュー |
| `placing` | 新規/描き直しの**場所合わせ** | 自由（移動・拡大縮小・現在地） | 中央の照準、案内文、「この場所で輪郭を描く」「キャンセル」 |
| `drawing` | **輪郭描画**（`useFieldDraw` が頂点を保持） | 移動を止め、一本指のなぞり／タップを頂点入力にする | 描画バナー、「完成」「戻す」「場所を合わせ直す」「キャンセル」 |
| `naming` | 名前入力（`useFieldDraw`） | ― | 名前入力ダイアログ |
| `field` | 田んぼ詳細 | 自由 | 上部メニュー＋下部詳細シート（記録/ピン追加/名前変更・描き直し・削除） |
| `point` | ピン詳細 | 自由 | 上部メニュー＋下部詳細シート（この地点を記録/編集） |
| `addPin` | ピン追加（場所選択→種別入力） | タップ座標を取得 | 「地図をタップ」バナー → `AddPinSheet` |

`drawing` / `naming` は頂点データを持つ `useFieldDraw`（`drawState`）が一次情報。
それ以外の排他モードは `MapCanvas` の `mode`（discriminated union）で管理する。
描画中は `drawState` の表示が `mode` より優先される。

## 状態遷移

```
browse ──「田んぼを選ぶ」──────────────▶ picker
browse ──地図の田んぼをタップ──────────▶ field
browse ──ピンをタップ──────────────────▶ point

picker ──行をタップ（正式選択）────────▶ field（flyTo）
picker ──スクロール（中央=プレビュー）─▶ picker（previewField 更新・アンバー強調・上側へパン）
picker ──「閉じる」/背景タップ─────────▶ browse（選択は確定しない）
picker ──「田んぼを登録する」───────────▶ placing（新規）

field  ──「ピン追加」──────────────────▶ addPin（fieldId 指定）
field  ──「描き直す」──────────────────▶ placing（redrawTarget=この田んぼ）
field  ──「閉じる」────────────────────▶ browse
point  ──「閉じる」────────────────────▶ browse

placing ──「この場所で輪郭を描く」──────▶ drawing（startDraw）
placing ──「キャンセル」────────────────▶ browse（redrawTarget クリア）

drawing ──「場所を合わせ直す」──────────▶ placing（輪郭破棄・redrawTarget 保持）
drawing ──「完成」（3点以上）──────────▶ naming
drawing ──「キャンセル」────────────────▶ browse（redrawTarget クリア）

naming  ──「保存」────────────────────▶ field（保存した田んぼを選択・flyTo）
naming  ──「キャンセル」────────────────▶ browse（redrawTarget クリア）

addPin  ──地図タップ──────────────────▶ addPin（pendingPinLngLat 取得→AddPinSheet）
addPin  ──「ここに追加」確定───────────▶ point（新規ピンを選択）
addPin  ──「キャンセル」────────────────▶ browse
```

## どのモードから browse へ戻る時も保証すること

`returnToBrowse()` を単一の出口とし、次を必ず行う:

- `mode = browse` に戻す
- `previewField` / `pendingPinLngLat` / `redrawTarget` / `recordPopOpen` をクリア
- プレビューの debounce タイマーをクリア
- 上部メニューと「田んぼを選ぶ」が表示される状態へ戻す
- MapLibre のサイズを **DOM 更新・シートアニメーション完了後**に再計算する
  - `requestAnimationFrame` 1 回に依存せず、`ResizeObserver`（常設）＋ rAF ＋ 約 250ms 後の resize ＋ `visualViewport` 監視を併用
- 横スワイプでしか戻れない状態を作らない（各オーバーレイに明示的な閉じる/キャンセルを置く）

## 地図サイズ復帰の多重防御

1. `ResizeObserver` をマップコンテナに常設し、サイズ変化で `map.resize()`
2. `window.resize` / `visualViewport.resize`（iOS Safari アドレスバー、PWA viewport 変化）
3. `mode` が変わるたびに rAF ＋ 250ms 後の resize（シート開閉アニメーション完了後）

## iPhone のタッチ競合対策（picker）

- 下部シートは「固定ヘッダ＋スクロール一覧（`flex-1 min-h-0 overflow-y-auto`）＋固定フッタ」の縦フレックス
- シート全体は画面の約 48% に固定（`max-h-[48vh]`）。一覧領域だけが縦スクロール
- スクロール領域に `touch-action: pan-y` / `overscroll-contain` / `-webkit-overflow-scrolling: touch`
- 一覧の `touchmove` は伝播を止め、MapLibre の地図操作へ奪われないようにする
