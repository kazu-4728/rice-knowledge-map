# ARCHITECTURE.md

## 1. 全体方針

このアプリは、実画像マップを中心にした稲作ナレッジ記録PWAです。

業務データは地図サービスに依存させず、Supabase Postgresに保存します。地図は表示レイヤーであり、田んぼ・ポイント・記録・写真・音声・コメントは自前DBで管理します。

## 2. 技術構成

```text
Frontend: Next.js + TypeScript + PWA
Map: MapLibre GL JS
Base map: 国土地理院 空中写真タイル
Backend: Supabase Auth / Postgres / Storage / RLS
AI: 音声文字起こし、記録分類、要約、入力補助
Deploy: Vercel Preview → 本番
Repository: GitHub private repo
```

## 3. レイヤー構成

```text
src/
├─ app/                  # Next.js App Router
├─ components/           # 汎用UIコンポーネント
├─ features/             # 機能単位の実装
│  ├─ map/               # 実画像マップ、ポリゴン、ピン
│  ├─ fields/            # 田んぼ管理
│  ├─ points/            # 入水口・出水口・注意箇所
│  ├─ records/           # 写真/音声記録
│  ├─ groups/            # グループ・招待
│  └─ auth/              # Google認証
├─ lib/                  # Supabase client、地図設定、共通関数
├─ styles/               # グローバルCSS
└─ types/                # 型定義
```

## 4. 初期画面構成

### 4.1 ホーム

- 今日の確認事項
- 未対応記録
- 写真で記録
- 音声で記録
- マップへの導線

### 4.2 実画像マップ

- 国土地理院空中写真タイル
- 田んぼ区画ポリゴン
- 入水口/出水口/水路/注意箇所ピン
- 記録ピン
- 下部詳細カード

### 4.3 田んぼ詳細

- 田んぼの基本情報
- 区画表示
- 固定ポイント一覧
- 最近の記録
- 未対応/要確認

### 4.4 写真で記録

- 写真撮影/アップロード
- EXIF位置情報またはスマホGPS取得
- 田んぼ候補推定
- ピン位置手動補正
- 音声メモ追加

### 4.5 保存前確認

- AI整理結果
- 田んぼ
- 地点
- カテゴリ
- 状態
- メモ
- 次の対応
- 保存ボタン

### 4.6 記録詳細

- 写真
- 音声
- 文字起こし
- 位置
- コメント
- 対応済み/未対応

## 5. Supabase構成

Supabaseは以下を担います。

- Google認証
- グループ共有
- 田んぼ・地点・記録・コメントの保存
- 写真/音声ファイル保存
- RLSによるアクセス制御

## 6. 認証と共有

共有はユーザー個人所有ではなく、グループ単位にします。

```text
profiles
  ↓
farm_group_members
  ↓
farm_groups
  ↓
fields / field_points / records / comments
```

Google認証後、招待URLを使ってグループに参加します。未ログインの匿名編集は不可。

## 7. 地図設計

- 背景地図は差し替え可能にする。
- 初期はMapLibre + 国土地理院空中写真タイル。
- 田んぼポリゴン、ポイント、記録ピンはDB由来。
- 緯度経度はWGS84を基本とする。
- 手動補正を前提にする。

## 8. 開発順序

1. ドキュメント・タスク固定
2. ダミーデータによる実画像マップUI
3. 写真/音声記録UI
4. 保存前確認UI
5. Supabaseスキーマレビュー
6. 承認後にマイグレーション
7. Supabase接続
8. Vercel Preview
9. スマホ確認

## 9. 原則

- UIは視覚確認しながら進める。
- DBは後から壊れにくい構造にする。
- 大規模リファクタリングを避ける。
- 1タスクずつ進める。
- 完了証拠なしにDONEにしない。
