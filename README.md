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

- 写真撮影→圧縮→Supabase Storage 保存→一覧サムネ表示（記録時刻・記録時の端末位置も表示。PC等で既存写真を選んだ場合は写真のEXIFではなく記録操作時の値）
- 音声メモ録音（MediaRecorder）→ Storage 保存→再生
- 保存前確認画面（田んぼ・地点・カテゴリ・状態・メモ）
- 地点の分類は8種類（入水口/出水口/水路/雑草/注意箇所/畦崩れ/水抜け不良/その他）
- 記録詳細・コメント・状態の任意変更（`open`/`needs_check`/`monitoring`/`resolved`の4種類。`open`は記録種別に応じて「通常」または「未対応」と表示し分けるのみで別状態ではない）と変更履歴表示
- 田んぼ詳細の定点観測（同じ地点の写真を時系列比較）
- 記録削除（記録者本人 or owner のみ）

### 認証・共有・権限

- Google ログイン / メールリンクログイン
- グループ招待 URL（`/invite`、招待時に editor/viewer の権限を選択可能）
- 家族・作業者の一覧、権限（owner/editor/viewer）の確認・変更（`/menu/family`）
- グループ単位の RLS（閲覧は全メンバー・書き込みは owner/editor）

### その他

- カレンダー（家族共有の作業予定 CRUD）
- 記録エクスポート（年次/田んぼ別 PDF: `window.print()`）
- モバイル: MenuDrawer（ハンバーガー） / PC: SideNav（常時表示）
- PWA 対応（manifest + Service Worker）

---

## 画面一覧

| ルート | 画面 |
|---|---|
| `/` | ホーム（未ログイン: ランディング／ログイン後: ダッシュボード） |
| `/map` | メインマップ（MapCanvas） |
| `/fields` | 田んぼ一覧 |
| `/fields/[id]` | 田んぼ詳細（概要／記録／定点観測タブ） |
| `/records` | 記録タイムライン（記録一覧） |
| `/records/[id]` | 記録詳細 |
| `/records/new` | 記録作成（写真/音声） |
| `/records/new/confirm` | 保存前確認 |
| `/calendar` | カレンダー |
| `/guide` | 使い方 |
| `/export` | エクスポート（PDF） |
| `/menu` | メニュー |
| `/menu/family` | 家族・作業者（メンバー一覧・権限変更・招待） |
| `/menu/site` | サイト設定（owner のみ） |
| `/login` | ログイン |
| `/invite` | 招待引き換え |
| `/home`, `/talk` | 旧URL互換のリダイレクト専用（`/` `/records` へ） |

---

## Supabase 構成

- プロジェクト: `rice-farm-app`（無料プランのため長期間放置で一時停止に注意）
- スキーマ: migration 0001〜0011 適用済み（詳細・適用状況は `supabase/README.md` 参照）
- テーブル: profiles / farm_groups / farm_group_members / farm_group_invites / farm_fields / field_seasons / field_points / records / record_media / record_comments / record_status_events / group_site_content / farm_schedules

---

## 開発ガイド

作業ルール・UI 基準・技術方針・現在のフェーズは `AGENTS.md` を参照してください（Codex / Claude Code 共通）。

Claude Code 固有の引き継ぎ情報（現在の状態・ハマりどころ・次の作業）は `CLAUDE.md` にあります。

残タスク・実機確認ログ・作業ログの一次情報は `tasks/TASKS.md` です。
