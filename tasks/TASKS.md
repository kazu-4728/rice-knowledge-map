# TASKS.md

このタスクリストは、未完了を完了扱いにしないための管理表です。

状態は `TODO / IN_PROGRESS / BLOCKED / REVIEW / DONE` のみ使用します。`DONE` には完了証拠が必要です。

## Phase 0: 開発運用基盤

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-000 | DONE | GPT | GitHubリポジトリ確認 | `kazu-4728/rice-knowledge-map` を確認済み |
| T-001 | DONE | GPT | READMEと.gitignore作成 | README.md と .gitignore が存在 |
| T-002 | DONE | GPT | 初期ドキュメントブランチ作成 | docs/tasksが追加されPR #1でmerge済み |
| T-003 | DONE | ユーザー | 初期ドキュメントPR確認 | PR #1 merge済み |
| T-004 | DONE | ユーザー/GPT | GitHub repository public化 | `rice-knowledge-map` はpublic |
| T-005 | DONE | ユーザー/GPT | 不要Codexブランチ削除 | remote branchは `main` のみ |
| T-006 | DONE | GPT | Supabase生存確認 | `rice-farm-app` はACTIVE_HEALTHY。DB疎通確認済み |
| T-007 | DONE | GPT/ユーザー | Cloud Codex運用制限の記録 | DECISIONS.md D-012に記録済み |
| T-008 | DONE | Claude Code | アーキテクチャ再設計 | ARCHITECTURE.md / DECISIONS.md / AGENTS.md / TASKS.md 更新済み。.nvmrc / .env.example / package.json(engines) 追加済み |

## Phase 1: 基盤構築（UI実装前）

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-010 | TODO | Claude Code | 既存src/削除・Tailwind CSS導入・ビルド確認 | npm install / npm run build / npm run lint が通る。証拠あり |
| T-011 | TODO | Claude Code | AppShell実装（ヘッダー・BottomNav） | Tailwindで実装。スマホ幅で表示確認 |
| T-012 | TODO | Claude Code | ホーム画面（ダミーデータ） | 完成イメージに沿った画面がスクショで確認できる |
| T-013 | TODO | Claude Code | MapLibre + 国土地理院タイル表示 | 実画像マップが表示される |
| T-014 | TODO | Claude Code | ダミーGeoJSONで田んぼポリゴン表示 | A田/B田/C田/D田が地図上に色付きで表示される |
| T-015 | TODO | Claude Code | 入水口/出水口/注意箇所ピン表示 | ピン種別が地図座標上で見分けられる |
| T-016 | TODO | Claude Code | 下部詳細カード実装 | ピン選択時に詳細カードが表示される |
| T-017 | TODO | ユーザー | マップUIレビュー | スクショまたはPreview URLで完成イメージと照合 |

## Phase 2: 記録フローUI

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-020 | TODO | Claude Code | 田んぼ詳細画面 | 完成イメージに沿った詳細画面がスクショで確認できる |
| T-021 | TODO | Claude Code | 写真で記録画面 | 写真プレビュー、位置候補、カテゴリチップが表示される |
| T-022 | TODO | Claude Code | 音声メモUI | 録音開始/停止/再生のUIがある |
| T-023 | TODO | Claude Code | 保存前確認画面 | AI整理結果を想定した確認フォームがある |
| T-024 | TODO | Claude Code | 記録詳細画面 | 写真、地図位置、コメント、状態操作が表示される |
| T-025 | TODO | ユーザー | 記録フローUIレビュー | 現場で1分以内に使えそうか確認 |

## Phase 3: Supabase設計と適用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-030 | DONE | GPT | Supabase現状確認 | `rice-farm-app` の状態、既存テーブル、DB疎通を確認済み |
| T-031 | REVIEW | GPT/Codex Desktop | migration SQL案作成 | `supabase/migrations/` にSQLファイルあり。applyなし |
| T-032 | TODO | Claude Code/ユーザー | migration SQLレビュー | RLSと共有設計が確認済み |
| T-033 | TODO | ユーザー | migration適用承認 | 目的/影響/戻し方を確認して承認 |
| T-034 | TODO | Claude Code | Supabase migration適用 | 承認後のみ実行、結果報告あり |
| T-035 | TODO | Claude Code | TypeScript型生成/接続 | フロントから型安全に参照できる |

## Phase 4: 保存処理

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-040 | TODO | Claude Code | Google認証接続 | ログイン/ログアウト確認 |
| T-041 | TODO | Claude Code | グループ参加/招待UI | 招待URLの流れがUI上で表現される |
| T-042 | TODO | Claude Code | 田んぼ保存 | Supabaseに田んぼが保存される |
| T-043 | TODO | Claude Code | 固定ポイント保存 | 入水口/出水口等が保存される |
| T-044 | TODO | Claude Code | 記録保存 | 写真/音声/位置/状態が保存される |
| T-045 | TODO | ユーザー | 保存処理レビュー | DB状態と画面で確認 |

## Phase 5: Preview運用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-050 | TODO | Claude Code | Vercel Preview接続 | Preview URLが発行される |
| T-051 | TODO | ユーザー | スマホ実機確認 | 現場利用視点で確認 |
| T-052 | TODO | Claude Code | UI修正 | 指摘事項ごとに小タスク化 |

## 運用メモ

- タスクを飛ばさない。
- UIタスクはスクショまたはPreview URLがない限りDONEにしない。
- Supabase変更は承認後のみ。
- リリース判断はユーザー承認後のみ。
- write担当はClaude Code（主担当）。Codex Desktopは補助・調査・提案のみ。
- Cloud Codexは読み取り・調査・報告のみ。push / PR作成 / merge / branch乱造はさせない。
- エラーは回避せず原因を追究する。
