# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

---

## 1. 現在の状態（2026-06 更新）

- 参照モック準拠のUI刷新は完了し、mainにマージ済み（PR #10）。
  - マップ / 記録一覧 / 記録詳細 / 保存前確認 / 田んぼ一覧 / メニュー / ホーム
  - PWA対応済み（manifest / アイコン / 最小Service Worker / safe-area）
  - UI確認は `npm run build && npm run start` + `node scripts/screenshot.mjs`
- Supabase初期スキーマのmigration SQL案を作成済み（`supabase/migrations/0001_init.sql`、PR #11）。
  - 適用はユーザー承認後のみ。手順は `supabase/README.md`
- Supabaseプロジェクトは `rice-farm-app`（無料プランのため放置で一時停止する。適用前に復元が必要）。
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

1. **ユーザー**: Vercelダッシュボード → Add New → Project → GitHubの `kazu-4728/rice-knowledge-map` をインポート（設定はデフォルトのままでNext.jsが自動認識される）
2. **ユーザー**: スマホ実機でPreview URLを確認（T-051）
3. **ユーザー**: PR #11（migration SQL案）をレビューし、適用を承認（T-032）
4. 承認後: Supabaseプロジェクト復元 → `0001_init.sql` 適用（T-033）→ 結果報告
5. Google認証（T-040）→ ダミーデータのSupabase差し替え（T-034）→ 保存処理（T-042〜T-044）
