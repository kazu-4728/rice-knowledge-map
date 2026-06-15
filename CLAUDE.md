# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

---

## 1. 現在の状態（2026-06-15 更新）

- **最新の進捗・残タスク・詳細な作業ログは `tasks/TASKS.md` が最新の一次情報**。このセクションは要約。
- **直近（2026-06-15）**: PR #33（`5d74265`・squashマージ済み）で、複数田んぼ管理の導線3点を改善。①記録詳細「追記する」が `field/point/pointType` をURLで引き継ぐ（GPSの自動選択で隣の田んぼに保存される事故を防ぐ）、②田んぼ名・地点バッジをLink化、戻るボタンを `router.back()` 化、③マップ田んぼポリゴン→「この田んぼの詳細を見る」緑CTA、④記録の削除（`deleteRecord` データ層＋⋮メニュー＋確認モーダル、`record_media` cascade＋Storage best-effort削除、UI上は記録者本人 OR グループownerのみ削除可）。`RecordDetail` 型に `fieldId/pointId/pointType` を追加、`RecordDetailData` に `canDelete` を追加。Copilotクォーター切れのためセルフレビュー（tsc/lint/build）のみで完了。
- **前回（2026-06-14）**: PR #31（`8bde66d`）でトップ`/`を王道Webランディングに刷新＋Codex指摘14点対応。「未対応」判定を pointType ベースに統一・全件ページング取得・カレンダーを単一アクティブグループに統一＋viewer書込抑止・`RemotePhoto` キャッシュ透明化修正。**複数グループの本格対応は将来タスクで保留**。
- **次の最優先はユーザーの本番実機確認**（TASKS.md の U-002/U-005/U-006）。デザインは文章でなく実機/プレビューで見せて判断してもらう。U-006 は PR #33 の7点チェックリスト。
- **本番公開済み**: https://rice-knowledge-map.vercel.app （Vercel接続済み。mainへのマージで自動デプロイ）
- 参照モック準拠のUI刷新・PWA対応はmainにマージ済み（PR #10）。UI確認は `npm run build && npm run start` + Playwright（デモモード）
- Supabaseスキーマは **適用済み**（0001〜0003、PR #11）。プロジェクトは `rice-farm-app`（無料プランのため放置で一時停止する点に注意）
- 認証・マップのSupabase接続・田んぼ保存（なぞり描き/編集/削除）・招待は実装済み（PR #12〜#14）。**メールリンクログインは実機確認済み**
- UI/UX改善プラン進行中: Phase A（/loginページ・導線整理・検索/絞り込み、PR #15）と Phase B（写真記録の保存→一覧実写真表示、PR #16）はmainマージ済み。**Phase B2（音声メモ録音・保存）はPR #17でレビュー中** — Copilot/Codexのレビュー全対応→squashマージから再開すること。その後 Phase C（記録詳細）→ D（ピン）→ E（仕上げ）
- **Googleログインは設定完了・実機ログイン成功済み（2026-06-12）**。PWAのログイン維持問題は解決
- **Copilotレビューは今期クォーター切れ**（2026-06-15時点）。代わりに**セルフレビュー必須**: `npx tsc --noEmit` + `npm run lint` + `npm run build` + 変更ファイル再読＋影響範囲確認。Codexレビューは PR draft 解除で自動起動するので、draftで作って解除する流れが効く
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

詳細は `tasks/TASKS.md` を参照。Phase A〜F すべて main マージ済み。次は **複数田んぼ運用を実機で回して導線改善ポイントを見つける**フェーズ。

1. **ユーザー**: 本番で **U-002／U-005／U-006** を実機確認（写真/音声記録の保存→一覧、田んぼカバー写真、PR #31の全項目、PR #33の追記/バッジ/⋮削除/権限・7点）
2. 実機確認で見つかった導線・UI課題を 1 PR にまとめて修正
3. 任意機能候補（優先度順）: **T-051**（記録詳細→マップで見る・lat/lng のとき）／**T-052**（コメントの編集・削除・各IconMoreが現状ダミー）／**T-048**（記録のAI整理・要約）
4. 保留中の大物（着手前にユーザーに方針確認）: **T-053**（複数グループの本格対応・現状はアクティブグループに統一中）／**T-054**（soft-delete・現状は hard-delete）

各フェーズ共通の進め方: 実装→`npx tsc --noEmit` + `npm run lint` + `npm run build` でセルフレビュー（Copilotクォーター切れのため必須）→PR を draft で作成→draft 解除で Codex レビュー起動→対応→squashマージ（=本番反映）→ユーザー実機確認。squashマージ後は次PRの前に `git checkout main && git pull origin main` でローカルを同期、ブランチを切り直す。
