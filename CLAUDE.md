# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

---

## 1. 現在の状態（2026-06 更新）

- 参照モック準拠のUI刷新は完了し、mainにマージ済み（PR #10）。
  - マップ / 記録一覧 / 記録詳細 / 保存前確認 / 田んぼ一覧 / メニュー / ホーム
  - PWA対応済み（manifest / アイコン / 最小Service Worker / safe-area）
  - UI確認は `npm run build && npm run start` + `node scripts/screenshot.mjs`
- Supabaseスキーマは **適用済み**（0001〜0003、PR #11マージ済み）。プロジェクトは `rice-farm-app`（無料プランのため放置で一時停止する点に注意）。
- アプリ側のSupabase接続も実装済み:
  - `lib/supabase/client.ts`（環境変数未設定ならnull→デモモード）
  - `features/auth/`（Google OAuth + メールリンク。メニュー画面にログインカード）
  - `lib/data/farm.ts`（マップの田んぼ/ポイント読込、なぞり描きポリゴンの保存、初回グループ自動作成RPC）
  - 環境変数は `.env.example` 参照。**実値（キー・URL）はリポジトリに一切書かない**（Vercel環境変数 / `.env.local` で設定。例示ファイルにも書かない）
- 未接続: 記録一覧/詳細/コメントのSupabase化、記録保存（T-043/T-044）、招待UI（T-041）
- Vercelは未接続。ユーザーがダッシュボードからGitHubリポジトリをインポートする必要がある（下記）。

---

## 2. 完成形

家族間で共有する実画像マップ型の稲作ナレッジ記録PWA。

- 国土地理院の空中写真タイルが主役のマップ。自分の田んぼの輪郭をなぞってポリゴン登録する
- 入水口（青）/ 出水口（緑）/ 異常箇所（赤）のピンと常設ボトムシート
- 記録はカメラ撮影の実写真と音声メモ。AIが整理し、保存前確認を挟む
- 記録詳細で家族がコメントし「対応済みにする」で完結
- 実写真が無い間のプレースホルダーは `PaddyPhoto`（田園風景SVG）を使う。絵文字は使わない（`components/ui/icons.tsx` のSVGアイコンに統一）

参照モック画像が最上位のデザイン基準。要素リストよりモックの見た目・余白・質感を優先する。

---

## 3. 技術方針

- Next.js App Router / React / TypeScript / Tailwind CSS v4
- MapLibre GL JS + 国土地理院 空中写真タイル
- Supabase Auth / Postgres / Storage / RLS（スキーマは docs/DATA_MODEL.md と 0001_init.sql）
- デプロイは GitHub → Vercel

注意（ハマりどころ）:

- MapLibreのCSSはコンテナの `position` を上書きする。マップコンテナは `h-full w-full` で明示サイズ指定する（`absolute inset-0` だけだと高さ0になる）
- Tailwind v4 のため `h-4.5` などの小数スペーシングは有効（v3前提のレビュー指摘は誤検知）
- このリモート環境は外部画像（地理院タイル等）への通信が遮断される。スクリーンショットでマップ背景がグレーでも実機では表示される

---

## 4. 作業ルール

- UI作業とDB作業を混ぜない。1タスク1目的
- スクリーンショットまたはPreview URLなしでUI作業を完了扱いにしない
- Supabaseへの変更（プロジェクト復元・migration適用・Storage設定）はユーザー承認後のみ
- リリース判断はユーザー承認後のみ

---

## 5. 次にやること（順番）

1. **ユーザー**: Vercelダッシュボード → Add New → Project → GitHubの `kazu-4728/rice-knowledge-map` をインポートし、Environment Variables に `.env.example` の2変数を設定
2. **ユーザー**: Supabaseダッシュボード → Authentication → Providers → Google を有効化（Google CloudのOAuthクライアントID/シークレットが必要）。メールリンクログインは設定不要で使える
3. **ユーザー**: スマホ実機でPreview URLを確認（T-051）。ログイン→田んぼなぞり描き→保存まで試す（T-042検証）
4. 記録保存（T-043/T-044）と記録一覧/詳細のSupabase接続（T-034残り）
5. 招待URL発行UI（T-041、`redeem_group_invite` RPCは作成済み）
