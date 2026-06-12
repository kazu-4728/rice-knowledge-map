# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

---

## 1. 現在の状態（2026-06-12 更新）

- **本番公開済み**: https://rice-knowledge-map.vercel.app （Vercel接続済み。mainへのマージで自動デプロイ）
- 参照モック準拠のUI刷新・PWA対応はmainにマージ済み（PR #10）。UI確認は `npm run build && npm run start` + Playwright（デモモード）
- Supabaseスキーマは **適用済み**（0001〜0003、PR #11）。プロジェクトは `rice-farm-app`（無料プランのため放置で一時停止する点に注意）
- 認証・マップのSupabase接続・田んぼ保存（なぞり描き/編集/削除）・招待は実装済み（PR #12〜#14）。**メールリンクログインは実機確認済み**
- UI/UX改善プラン進行中: Phase A（/loginページ・導線整理・検索/絞り込み、PR #15）と Phase B（写真記録の保存→一覧実写真表示、PR #16）はmainマージ済み。**Phase B2（音声メモ録音・保存）はPR #17でレビュー中** — Copilot/Codexのレビュー全対応→squashマージから再開すること。その後 Phase C（記録詳細）→ D（ピン）→ E（仕上げ）
- **Googleログインは設定完了・実機ログイン成功済み（2026-06-12）**。PWAのログイン維持問題は解決
- 前セッションの注意: GitHub MCP接続が認証切れで失効した（OAuth再認証フローがAnthropic側不具合で完了不可）。新セッションでは通常復旧する。git push自体は常に動く。PRレビューコメントが読めない場合はWebFetchでGitHubのHTML/公開APIを参照する手もある
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

1. **PR #17（Phase B2 音声メモ）のレビュー対応→mainへsquashマージ**（ブランチ: `claude/compassionate-sagan-offyhs`。マージ後はブランチをmainと同期）
2. **ユーザー**: 本番でPhase B/B2を実機確認（写真記録の保存→一覧に実写真サムネ / 音声メモの録音→保存）
3. 記録詳細の実データ化・コメント・「対応済みにする」（Phase C / T-034b/T-045）: recordDetail.ts（loadRecordDetail/addComment/resolveRecord、status update 0件=denied）、/records/[id]実データ化、MapBottomSheet「詳細」を`/records?point={id}`に
4. ピンの登録・編集（Phase D / T-043）: farm.tsにsaveFieldPoint/updateFieldPoint/deleteFieldPoint、ピンMarkerレジストリ化、AddModeSheet/PointEditDialog、メニューの準備中解除
5. 田んぼ一覧・ホーム最近の記録・メニュー件数の実データ化（Phase E）/（任意・ユーザー）レガシーanonキーの無効化

各フェーズ共通の進め方: 実装→build/lint/Playwright（デモモード）検証→PR→Copilot/Codexレビュー全対応→squashマージ（=本番反映）→ユーザー実機確認。squashマージ後は次PRの前に`git merge origin/main`で同期（競合は常にブランチ側を採用）。
