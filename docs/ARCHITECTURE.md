# ARCHITECTURE.md

`rice-knowledge-map` の実装方針です。

## 1. 全体方針

このアプリは、実画像マップを中心にした稲作ナレッジ記録PWAです。

地図は表示レイヤーです。田んぼ、固定ポイント、記録、写真、音声、コメントはアプリ側のデータとして管理します。

最初から全国向けSaaSを作るのではなく、まず自分の田んぼで使えるMVPを完成させます。

## 2. 技術構成

```text
Frontend : Next.js App Router
Language : TypeScript
UI       : React + Tailwind CSS
Map      : MapLibre GL JS
Base map : 国土地理院 空中写真タイル
Data     : Supabase Auth / Postgres / Storage / RLS
Deploy   : Vercel Preview
```

方針:

- UI確認も最終実装もNext.js内で行う。
- HTMLだけの別モックは原則作らない。
- Tailwind CSSを標準にする。
- `globals.css` は必要最小限にする。
- UIは共通コンポーネントとTailwindクラスで統一する。
- MapLibreは背景地図と地理座標表示を担当する。
- アプリの記録データはSupabaseに保存する。

## 3. UIアーキテクチャ

最初に品質を上げる基準画面は、メインマップ画面です。

```text
実画像マップ
  + 田んぼ区画
  + 入水口 / 出水口 / 異常箇所ピン
  + フローティング操作
  + 下部ボトムシート
```

優先するUI:

- フルスクリーンに近い実画像マップ
- 薄く軽いヘッダー
- 下部ボトムシート
- フローティング操作ボタン
- 写真で記録 / 音声メモへの導線
- 片手操作しやすい画面密度

主役にしないもの:

- 予定表
- 天気カード
- 同期状態
- データ出力
- 一覧中心の画面
- 管理ダッシュボード

## 4. ディレクトリ構成（実際の src/ 構造）

```text
src/
├── app/               App Router ページ（16 ルート）
│   ├── layout.tsx
│   ├── page.tsx         /: スプラッシュ
│   ├── home/            /home: ステータスダッシュボード
│   ├── map/             /map: メインマップ（MapCanvas）
│   ├── fields/          /fields: 田んぼ一覧
│   ├── fields/[id]/     /fields/[id]: 田んぼ詳細
│   ├── records/         /records: 記録一覧
│   ├── records/[id]/    /records/[id]: 記録詳細
│   ├── records/new/     /records/new: 記録作成（写真/音声）
│   ├── records/new/confirm/  /records/new/confirm: 保存前確認
│   ├── calendar/        /calendar: カレンダー
│   ├── guide/           /guide: 使い方
│   ├── export/          /export: エクスポート（PDF）
│   ├── menu/            /menu: メニュー
│   ├── menu/site/       /menu/site: サイト設定（owner のみ）
│   ├── login/           /login: ログイン
│   └── invite/          /invite: 招待引き換え
├── components/
│   ├── layout/          AppShell / MenuDrawer / SideNav / BackButton / DrawerContext ほか
│   ├── ui/              icons / PaddyPhoto / Toast / VoiceInputButton / WeatherHeader ほか
│   └── pwa/             PwaRegister
├── features/
│   ├── auth/
│   ├── calendar/
│   ├── fields/
│   ├── guide/
│   ├── home/
│   ├── map/             MapCanvas / FieldSearchSheet / useFieldDraw ほか
│   ├── menu/
│   └── records/
├── data/
│   └── dummy.ts
├── lib/
│   ├── data/            farm / records / recordSave / schedule / siteContent / weather ほか
│   ├── hooks/
│   ├── supabase/        client / types
│   └── utils/
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

## 5. マップ設計

初期MVPでは、MapLibre + 国土地理院 空中写真タイルを第一候補にします。

方針:

- 背景地図は差し替え可能にする。
- 地図サービスにアプリの記録データを依存させない。
- 田んぼ区画はGeoJSONとして扱う。
- 固定ポイントは緯度経度を持つ。
- 記録も緯度経度を持つ。
- 手動補正を前提にする。
- タイル取得に失敗しても、田んぼ、ポイント、記録データは消えない。

## 6. 画面構成

### 6.1 メインマップ画面

アプリの中心画面です。

主な要素:

- 実画像マップ
- 田んぼ区画
- 入水口、出水口、水路、注意箇所、記録ピン
- 下部ボトムシート
- 写真で記録
- 音声メモ
- 未対応確認

### 6.2 写真で記録

- 写真プレビュー
- 位置情報取得状態
- 田んぼ候補
- ピン位置手動補正
- 音声メモ追加
- 次へ

### 6.3 音声メモ

- 録音開始 / 停止
- 音声プレビュー
- 文字起こし予定表示
- 位置情報
- 保存前確認へ進む導線

### 6.4 保存前確認

- 写真 / 音声の確認
- 田んぼ
- 地点
- カテゴリ
- 状態
- メモ
- 次の対応
- 保存ボタン

### 6.5 記録詳細

- 写真
- 音声
- 文字起こし
- 地図上の位置
- 状態
- コメント
- 対応済みにする

## 7. Supabase構成

Supabaseは以下を担当します。

- Google認証
- グループ共有
- 田んぼ保存
- 固定ポイント保存
- 記録保存
- 写真 / 音声ファイル保存
- コメント保存
- RLSによるアクセス制御

共有はユーザー個人所有ではなく、グループ単位にします。

## 8. 開発順序（完了済み）

以下の順序で実装を完了しています（PR #10〜#40）。

1. 参照モック画像に近いメインマップUIを作る — 完了（PR #10）
2. App Shellを整える — 完了（PR #10, #38）
3. 写真で記録UIを作る — 完了（Phase B / PR #16）
4. 音声メモUIを作る — 完了（Phase B2 / PR #17）
5. 保存前確認UIを作る — 完了（PR #16）
6. 記録詳細UIを作る — 完了（Phase C / PR #18）
7. Supabaseスキーマを確認する — 完了（PR #11）
8. Supabase接続を行う — 完了（PR #12〜#14）
9. 保存処理を実装する — 完了（PR #16〜#25）
10. 本番環境の整備 — 完了（https://rice-knowledge-map.vercel.app）。個別の実機確認は tasks/TASKS.md で継続管理

現在は **UI/UX 改善フェーズ**（実機確認→導線課題の修正）。詳細は `docs/UIUX_IMPLEMENTATION_ROADMAP.md` を参照。
