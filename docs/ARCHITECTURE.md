# ARCHITECTURE.md

## 1. 全体方針

このアプリは、実画像マップを中心にした稲作ナレッジ記録PWAです。

業務データは地図サービスに依存させず、Supabase Postgresに保存します。地図は表示レイヤーであり、田んぼ・ポイント・記録・写真・音声・コメントは自前DBで管理します。

用語、DBテーブル名、状態値は `docs/GLOSSARY.md` を正とします。

## 2. 技術構成

```text
Frontend : Next.js 15 (App Router) + TypeScript
Styling  : Tailwind CSS
Map      : MapLibre GL JS
Base map : 国土地理院 空中写真タイル
Map data : GeoJSON（田んぼポリゴン・ピンをMapLibreレイヤーとして描画）
Backend  : Supabase Auth / Postgres / Storage / RLS
AI       : 音声文字起こし、記録分類、要約、入力補助
Deploy   : Vercel Preview → 本番
Repository: GitHub (public)
```

### 技術選定の根拠

| 項目 | 選定 | 理由 |
|---|---|---|
| CSS | Tailwind CSS | カスタムCSSの散在を防ぐ。再現性が高くエージェント間で一貫した実装が可能 |
| マップ描画 | MapLibre GeoJSON レイヤー | CSSオーバーレイは地図座標と独立するため本来の実画像マップを実現できない |
| コード構成 | src/ を設計通りに新規作成 | preview/ と本体の混在を解消し、後工程のDB接続を見据えた構造にする |

## 3. レイヤー構成

```text
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # PWA設定、フォント、グローバルCSS読み込み
│   ├── page.tsx                # ホーム画面
│   ├── map/
│   │   └── page.tsx            # 実画像マップ画面
│   ├── records/
│   │   └── page.tsx            # 記録一覧
│   └── menu/
│       └── page.tsx            # メニュー
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # ヘッダー + BottomNav + スクロール領域
│   │   └── BottomNav.tsx       # 下部タブナビゲーション
│   └── ui/                     # Button, Chip, Card, Icon など汎用UI
├── features/
│   ├── map/                    # MapLibreコンポーネント、ポリゴン、ピン、詳細カード
│   ├── farm-fields/            # 田んぼ一覧・詳細。DBは farm_fields
│   ├── field-points/           # 入水口・出水口・注意箇所。DBは field_points
│   ├── records/                # 写真/音声記録フロー
│   ├── groups/                 # グループ・招待
│   └── auth/                   # Google認証
├── data/
│   └── dummy.ts                # ダミーデータ（Phase完了後にSupabase接続へ差し替え）
├── lib/                        # Supabase client、地図設定、共通関数
├── styles/
│   └── globals.css             # Tailwind base のみ
└── types/                      # 型定義
```

## 4. 画面構成

### 4.1 ホーム

- 挨拶・日付
- 今日の予定
- クイックアクション（写真で記録・音声で記録・マップ・作業記録）
- 最近の記録

### 4.2 実画像マップ（アプリの中心）

- 国土地理院空中写真タイル（MapLibre）
- 地図タイルの出典表記（必須）
- タイル取得失敗時のエラー表示または代替背景
- 田んぼ区画ポリゴン（GeoJSON fill レイヤー）
- 入水口/出水口/水路/注意箇所ピン（MapLibre Marker）
- 記録ピン
- 下部詳細カード（ピン選択時）

### 4.3 田んぼ詳細

- 田んぼの基本情報（品種・面積・作付・生育ステージ）
- 区画表示（ミニマップ）
- 最近の水管理・作業記録
- 固定ポイント一覧
- 最近の写真

### 4.4 写真で記録

- 写真撮影/アップロード
- EXIF位置情報またはスマホGPS取得
- 田んぼ候補推定
- ピン位置手動補正
- 音声メモ追加

### 4.5 保存前確認

- AI整理結果の表示と編集
- 田んぼ・地点・カテゴリ・状況・メモ・次のアクション
- 位置情報地図
- 音声の文字起こし（元の内容）
- 保存ボタン

### 4.6 記録詳細

- 写真・音声・文字起こし
- タグ（田んぼ名・ポイント種別・状態）
- 位置情報地図
- 記録者・記録日時・状況概要
- 家族のコメント
- 対応済みにする / 追記するボタン

## 5. マップ実装方針

### Phase 1（UI確認）: MapLibre + ダミーGeoJSON

```text
国土地理院タイル（背景）
+ GeoJSON ポリゴン → MapLibre の fill / fill-extrusion レイヤー
+ MapLibre Marker  → 入水口 / 出水口 / 異常ピン
+ click イベント   → 下部詳細カード表示
```

- 座標はダミー（新潟県長岡市近辺）で固定
- ダミーデータは `src/data/dummy.ts` に集約

### Phase 2（DB接続後）: Supabase からGeoJSON取得

- `farm_fields.boundary_geojson` をそのままMapLibreに渡す
- `field_points` の緯度経度をMarkerに渡す
- Phase 1 との差し替えは `src/data/dummy.ts` → Supabase クライアント呼び出しのみ

## 6. Supabase構成

Supabaseは以下を担います。

- Google認証
- グループ共有
- 田んぼ・地点・記録・コメントの保存
- 写真/音声ファイル保存（Storage）
- RLSによるアクセス制御

## 7. 認証と共有

共有はユーザー個人所有ではなく、グループ単位にします。

```text
profiles
  ↓
farm_group_members
  ↓
farm_groups
  ↓
farm_fields / field_points / records / record_comments
```

Google認証後、招待URLを使ってグループに参加します。未ログインの匿名編集は不可。

## 8. 開発順序

1. ドキュメント・設定ファイル整備（現在）
2. Tailwind CSS 導入 + AppShell（ヘッダー・BottomNav）
3. ホーム画面（ダミーデータ）
4. 実画像マップ（MapLibre + GeoJSON + ピン + 詳細カード）
5. 田んぼ詳細画面
6. 記録フロー画面（写真・音声・保存前確認・記録詳細）
7. Supabaseスキーマレビュー・承認
8. Supabase migration 適用
9. Supabase接続・型生成
10. Vercel Preview
11. スマホ実機確認

## 9. 原則

- UIは視覚確認しながら進める（スクショまたはPreview URL必須）
- DBは後から壊れにくい構造にする
- 大規模リファクタリングを避ける
- 1タスクずつ進める
- 完了証拠なしにDONEにしない
- エラーは回避せず原因を追究する
