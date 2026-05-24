# TASKS.md

このタスクリストは、未完了を完了扱いにしないための管理表です。

状態は `TODO / IN_PROGRESS / BLOCKED / REVIEW / DONE` のみ使用します。`DONE` には完了証拠が必要です。

## Phase 0: 開発運用基盤

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-000 | DONE | GPT | GitHubリポジトリ確認 | `kazu-4728/rice-knowledge-map` を確認済み。証拠: GitHub connector repo check |
| T-001 | DONE | GPT | READMEと.gitignore作成 | README.md と .gitignore が存在。証拠: commit `f3cc812` / `097914f` |
| T-002 | REVIEW | GPT | 初期ドキュメントブランチ作成 | `docs/project-baseline-v0-1` にdocs/tasksが追加されPR化。証拠: PR #1 |
| T-003 | TODO | ユーザー | 初期ドキュメントPR確認 | ユーザーがPR内容を確認し、次へ進むか判断 |

## Phase 1: UI Preview 0.1

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-010 | REVIEW | Codex Desktop | Next.js初期構成作成 | build/lintが通る、主要ファイルが整理されている。進捗(2026-05-23): `npm install` / `npm run build` / `npm run lint` 成功。lintは `eslint.config.mjs` で `.next/**` を除外して安定化済み。 |
| T-011 | TODO | Codex Desktop | スマホ縦画面レイアウト基盤 | ローカルまたはPreviewでスマホ幅表示確認 |
| T-012 | TODO | Codex Desktop | MapLibre導入 | 地図コンポーネントが表示される |
| T-013 | TODO | Codex Desktop | 国土地理院空中写真タイル表示 | 実画像マップが表示される |
| T-014 | TODO | Codex Desktop | ダミー田んぼポリゴン表示 | A田/B田/C田などが地図上に見える |
| T-015 | TODO | Codex Desktop | 入水口/出水口/注意箇所ピン表示 | ピン種別が見分けられる |
| T-016 | TODO | Codex Desktop | 下部詳細カード実装 | ピン選択時に詳細カードが表示される |
| T-017 | TODO | GPT/ユーザー | UIレビュー | スクショまたはPreview URLで確認 |

## Phase 2: 記録フローUI

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-020 | TODO | Codex Desktop | 写真で記録画面 | 写真プレビュー、位置候補、カテゴリチップが表示される |
| T-021 | TODO | Codex Desktop | 音声メモUI | 録音開始/停止/再生のUIがある |
| T-022 | TODO | Codex Desktop | 保存前確認画面 | AI整理結果を想定した確認フォームがある |
| T-023 | TODO | Codex Desktop | 記録詳細画面 | 写真、地図位置、コメント、状態操作が表示される |
| T-024 | TODO | GPT/ユーザー | 記録フローUIレビュー | 現場で1分以内に使えそうか確認 |

## Phase 3: Supabase設計と適用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-030 | TODO | GPT | Supabase現状確認 | テーブル、RLS、Storage状態を報告 |
| T-031 | TODO | GPT | migration SQL案作成 | 削除なしの新MVPテーブル追加案がある |
| T-032 | TODO | GPT/Codex | migration SQLレビュー | RLSと共有設計が確認済み |
| T-033 | TODO | ユーザー | migration適用承認 | 目的/影響/戻し方を確認して承認 |
| T-034 | TODO | GPT | Supabase migration適用 | 承認後のみ実行、結果報告あり |
| T-035 | TODO | GPT/Codex | TypeScript型生成/接続 | フロントから型安全に参照できる |

## Phase 4: 保存処理

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-040 | TODO | Codex Desktop | Google認証接続 | ログイン/ログアウト確認 |
| T-041 | TODO | Codex Desktop | グループ参加/招待UI | 招待URLの流れがUI上で表現される |
| T-042 | TODO | Codex Desktop | 田んぼ保存 | Supabaseに田んぼが保存される |
| T-043 | TODO | Codex Desktop | 固定ポイント保存 | 入水口/出水口等が保存される |
| T-044 | TODO | Codex Desktop | 記録保存 | 写真/音声/位置/状態が保存される |
| T-045 | TODO | GPT/ユーザー | 保存処理レビュー | DB状態と画面で確認 |

## Phase 5: Preview運用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-050 | TODO | GPT/Codex | Vercel Preview接続 | Preview URLが発行される |
| T-051 | TODO | ユーザー | スマホ実機確認 | 現場利用視点で確認 |
| T-052 | TODO | GPT/Codex | UI修正 | 指摘事項ごとに小タスク化 |

## Phase X: 開発環境再整備と共同運用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-060 | BLOCKED | Codex Desktop | ローカル開発環境再整備 | Node/npmを固定し `npm install` が成功、`npm run build` と `npm run lint` が成功ログ付きで記録される。進捗(2026-05-23): `npm ping` / `npm install` / `build` / `lint` は成功。進捗(2026-05-24 JST): repo public化後に `origin` 再設定で `git fetch origin --prune` と `origin/main` 確認は可能。未解決(2026-05-24 JST): セットアップ再実行後に `.git/config` から `origin` が再消失し、毎回再設定が必要。解決条件: セットアップ直後と新セッション開始直後の両方で `git remote -v` に `origin` が残り、再設定なしで `git fetch origin --prune` が成功すること。 |
| T-061 | IN_PROGRESS | GPT/Claude Code/Codex | 共同作業ルールの運用記録化 | タスクごとに担当・実行コマンド・証拠（スクショ/ログ/PR）を `tasks/TASKS.md` とPR本文に記録し、未確認事項を明示する。進捗(2026-05-24 JST): Cloud Codex側で作業ログ整理用PRを作成し、Desktop/Claude Codeへ引き継ぐ方針を確認。追加進捗: `origin/main...HEAD` 差分を比較可能であることを確認し、引き継ぎ時は差分一覧をPR本文に固定記載する。 |

## 運用メモ

- タスクを飛ばさない。
- UIタスクはスクショまたはPreview URLがない限りDONEにしない。
- Supabase変更は承認後のみ。
- リリース判断はユーザー承認後のみ。
