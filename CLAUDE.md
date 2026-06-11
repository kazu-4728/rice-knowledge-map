# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

---

## 1. 現在の状態（2026-06-11 更新）

- **本番公開済み**: https://rice-knowledge-map.vercel.app （Vercel接続済み。mainへのマージで自動デプロイ）
- 参照モック準拠のUI刷新・PWA対応はmainにマージ済み（PR #10）。UI確認は `npm run build && npm run start` + `node scripts/screenshot.mjs`
- Supabaseスキーマは **適用済み**（0001〜0003、PR #11）。プロジェクトは `rice-farm-app`（無料プランのため放置で一時停止する点に注意）
- 認証・マップのSupabase接続・田んぼ保存・招待は実装済み（PR #12/#13）。**メールリンクログインは実機確認済み**。Googleログインはユーザーのプロバイダ設定待ちでボタン非表示（`NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=1` で表示）
- 環境変数は `.env.example` 参照。**実値（キー・URL）はリポジトリに一切書かない**（Vercel環境変数 / `.env.local` で設定。例示ファイルにも書かない。publishableキーは2026-06-11にローテーション済み）
- 進捗・残タスクの一覧は `tasks/TASKS.md` が最新（4区分: 動作中/反映待ち/残り/ユーザー作業）

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

詳細は `tasks/TASKS.md` を参照。要約:

1. **ユーザー**: 本番反映後にスマホで動作確認（なぞり描き登録→タップで編集/削除→家族招待）
2. 記録の保存（カメラ写真→Supabase Storage、音声メモ。T-044）
3. 記録詳細の実データ化・コメント・「対応済みにする」（T-034b/T-045）
4. ピンの登録・編集（T-043）
5. （任意・ユーザー）Googleログイン設定 / レガシーanonキーの無効化
