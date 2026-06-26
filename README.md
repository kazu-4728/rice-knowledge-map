# rice-knowledge-map

実画像マップ型 稲作ナレッジ記録 PWA。

田んぼの暗黙知を国土地理院の空中写真タイル上に固定し、写真・音声・位置情報・家族コメント・対応状況として残すアプリです。農業日誌や管理表ではなく、**実画像マップ上の「場所に結びついた現場知識」の記録**が中心です。

本番URL: **https://rice-knowledge-map.vercel.app**

---

## セットアップ

### 必要環境

- Node.js 20 以上
- npm

### インストール

```bash
git clone https://github.com/kazu-4728/rice-knowledge-map.git
cd rice-knowledge-map
npm install
```

### 環境変数

`.env.example` をコピーして `.env.local` を作成し、値を設定します。

```bash
cp .env.example .env.local
```

| 変数名 | 取得場所 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API Keys | プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上（publishable キー） | `sb_publishable_...` 形式 |
| `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN` | 任意。`1` にすると Google ログインボタンが表示される | Supabase で Google プロバイダを設定済みの場合のみ |

環境変数が未設定の場合、アプリはサンプルデータのデモモードで動作します。

---

## 主要コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint
npx tsc --noEmit # 型チェック（CI・セルフレビュー必須）
```

---

## 技術構成

```text
Frontend : Next.js 15.3（App Router）
Language : TypeScript 5.8
UI       : React 19 + Tailwind CSS 4
Map      : MapLibre GL JS 5.24
Base map : 国土地理院 空中写真タイル
Backend  : Supabase Auth / Postgres / Storage / RLS
Deploy   : GitHub → Vercel（main マージで自動デプロイ）
```

---

## 実装済み機能

### マップ

- MapLibre GL JS + 国土地理院 空中写真タイル
- 田んぼ区画のなぞり描き登録（2段階: 場所合わせ→輪郭描画）・名前変更・描き直し・削除
- 固定ピン（入水口/出水口/異常箇所）の登録・編集・削除
- 田んぼ選択ホイールピッカー（スクロールプレビュー＋タップ選択）
- iOS Safari 対応（動的ビューポート・入力ズーム防止）

### 記録

- 写真撮影→圧縮→Supabase Storage 保存→一覧サムネ表示
- 音声メモ録音（MediaRecorder）→ Storage 保存→再生
- 保存前確認画面（田んぼ・地点・カテゴリ・状態・メモ）
- 記録詳細・コメント・「対応済みにする」
- 記録削除（記録者本人 or owner のみ）

### 認証・共有

- Google ログイン / メールリンクログイン
- グループ招待 URL（`/invite`）
- グループ単位の RLS（閲覧は全メンバー・書き込みは owner/editor）

### その他

- カレンダー（家族共有の作業予定 CRUD）
- 記録エクスポート（年次/田んぼ別 PDF: `window.print()`）
- モバイル: MenuDrawer（ハンバーガー） / PC: SideNav（常時表示）
- PWA 対応（manifest + Service Worker）

---

## 画面一覧（16 ルート）

| ルート | 画面 |
|---|---|
| `/` | スプラッシュ（ランディング） |
| `/home` | ホーム（ステータスダッシュボード） |
| `/map` | メインマップ（MapCanvas） |
| `/fields` | 田んぼ一覧 |
| `/fields/[id]` | 田んぼ詳細 |
| `/records` | 記録一覧 |
| `/records/[id]` | 記録詳細 |
| `/records/new` | 記録作成（写真/音声） |
| `/records/new/confirm` | 保存前確認 |
| `/calendar` | カレンダー |
| `/guide` | 使い方 |
| `/export` | エクスポート（PDF） |
| `/menu` | メニュー |
| `/menu/site` | サイト設定（owner のみ） |
| `/login` | ログイン |
| `/invite` | 招待引き換え |

---

## Supabase 構成

- プロジェクト: `rice-farm-app`（無料プランのため長期間放置で一時停止に注意）
- スキーマ: migration 0001〜0006 適用済み（`supabase/README.md` 参照）
- テーブル: profiles / farm_groups / farm_group_members / farm_group_invites / farm_fields / field_seasons / field_points / records / record_media / record_comments / record_status_events / group_site_content / farm_schedules

---

## 開発ガイド

作業ルール・UI 基準・技術方針・現在のフェーズは `AGENTS.md` を参照してください（Codex / Claude Code 共通）。

Claude Code 固有の引き継ぎ情報（現在の状態・ハマりどころ・次の作業）は `CLAUDE.md` にあります。

残タスク・実機確認ログ・作業ログの一次情報は `tasks/TASKS.md` です。
