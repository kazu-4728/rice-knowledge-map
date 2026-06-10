# TASKS.md

このタスクリストは、作業の優先順位と完了条件を固定するための管理表です。

現在の最優先は、メインマップ画面を参照モック画像に近いスマホアプリUIへ引き上げることです。

UIが合格するまで、DB接続や機能追加へ進みません。

状態は `TODO / IN_PROGRESS / BLOCKED / REVIEW / DONE` のみ使用します。`DONE` には証拠が必要です。

---

## Phase 0: 方針整理

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-000 | DONE | GPT | リポジトリ確認 | `kazu-4728/rice-knowledge-map` を確認済み |
| T-001 | DONE | GPT | README作成 | README.md が存在 |
| T-002 | DONE | GPT | 初期ドキュメント作成 | docs/tasks が追加済み |
| T-003 | DONE | Claude Code | アーキテクチャ再設計 | Tailwind / MapLibre / Next.js 方針を反映済み |
| T-004 | DONE | GPT | UI優先方針へREADME上書き | mainに反映済み |
| T-005 | DONE | GPT | UI_REPRODUCTION_SPEC上書き | 参照画像優先の仕様へ修正済み |
| T-006 | DONE | GPT | CLAUDE.md上書き | Claude Code向けUI優先指示へ修正済み |
| T-007 | DONE | GPT | AGENTS.md上書き | UI優先ルールへ修正済み |
| T-008 | DONE | GPT | ARCHITECTURE.md上書き | Next.js内UI再現優先へ修正済み |
| T-009 | DONE | GPT | REVIEW_CHECKLIST上書き | UI品質ゲートへ修正済み |

---

## Phase 1: メインマップUI品質改善

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-010 | REVIEW | Claude Code | メインマップ画面を参照モック画像に近づける | スクショで参照画像と比較できる |
| T-011 | REVIEW | Claude Code | ヘッダーを軽くする | 地図の主役感を邪魔しない |
| T-012 | REVIEW | Claude Code | 下部ボトムシートを整える | スマホアプリらしく見える |
| T-013 | REVIEW | Claude Code | フローティング操作を整える | 写真で記録 / 音声メモ導線が分かる |
| T-014 | REVIEW | Claude Code | 地図上のピンとラベルを整理する | ラベル過多にならず、地点種別が分かる |
| T-015 | TODO | ユーザー | メインマップUIレビュー | 古い業務UIに見えないことを確認 |

---

## Phase 2: 記録フローUI

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-020 | REVIEW | Claude Code | 写真で記録画面 | 写真、位置、田んぼ候補、音声追加導線がある |
| T-021 | REVIEW | Claude Code | 音声メモ画面 | 録音開始/停止/再生のUIがある |
| T-022 | REVIEW | Claude Code | 保存前確認画面 | AI整理結果を確認できる想定UIがある |
| T-023 | REVIEW | Claude Code | 記録詳細画面 | 写真、地図位置、コメント、状態操作が見える |
| T-024 | TODO | ユーザー | 記録フローUIレビュー | 現場で1分以内に使えそうか確認 |

---

## Phase 3: Supabase設計と接続

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-030 | DONE | Claude Code | Supabaseスキーマ案の再確認 | DATA_MODEL.mdと実装予定の整合性を確認 |
| T-031 | DONE | Claude Code | migration SQL作成 | apply前のSQL案がある |
| T-032 | DONE | ユーザー | migration適用承認 | 影響と戻し方を確認済み |
| T-033 | DONE | Claude Code | migration適用 | 承認後のみ実行、結果報告あり |
| T-034 | TODO | Claude Code | Supabase接続 | ダミーデータをSupabase取得へ差し替え |

---

## Phase 4: 保存処理

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-040 | TODO | Claude Code | Google認証接続 | ログイン/ログアウト確認 |
| T-041 | TODO | Claude Code | グループ参加/招待UI | 招待URLの流れがUI上で表現される |
| T-042 | TODO | Claude Code | 田んぼ保存 | Supabaseに保存できる |
| T-043 | TODO | Claude Code | 固定ポイント保存 | 入水口/出水口等が保存できる |
| T-044 | TODO | Claude Code | 記録保存 | 写真/音声/位置/状態が保存できる |
| T-045 | TODO | ユーザー | 保存処理レビュー | DB状態と画面で確認 |

---

## Phase 5: Preview運用

| ID | 状態 | 担当 | タスク | 完了条件 |
|---|---|---|---|---|
| T-050 | TODO | Claude Code | Vercel Preview接続 | Preview URLが発行される |
| T-051 | TODO | ユーザー | スマホ実機確認 | 現場利用視点で確認 |
| T-052 | TODO | Claude Code | UI修正 | 指摘事項ごとに小タスク化 |

---

## 運用メモ

- UI作業は、参照モック画像との比較を必須にする。
- 要素を全部並べることより、画像に近い見た目を優先する。
- スクリーンショットまたはPreview URLなしでUIタスクをDONEにしない。
- UIが古い管理画面に見える状態でDB接続へ進まない。
- Supabase変更は承認後のみ。
- リリース判断はユーザー承認後のみ。
