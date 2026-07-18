# TASKS.md

本番URL: https://rice-knowledge-map.vercel.app

## 読み方

- 状態は `TODO / IN_PROGRESS / DONE` のみ。
- 完了の証拠は本ファイルではなくGitHub PR（番号・マージコミット）を参照する。過去の実装詳細・作業ログ・旧UI方針はここには残さない。
- 「完了履歴」は「Issue番号 → PR番号: 一言」のみの索引。詳細を書き足さない。
- 「現在の実行タスク」が唯一の正。他のMarkdownに矛盾する記述があっても、ここを優先する。
- 新しいセッションはまず「現在の実行タスク」だけを読めば作業を再開できる状態を保つ。

## 現在の実行タスク

**共有リンクのトークン方式アクセス制御（PR #73から持ち越し・親Issue #64）**

- 状態: TODO
- 背景: PR #73で「共有する」ボタンはOS共有シート（テキスト+`/fields/[id]`リンク）に統一済み。しかしRLSにより非メンバー・未ログインの受信者はリンク先を閲覧できず、ログイン誘導しか出せない。オーナー確定要件は次の2点の両立: (a) 受信者にログインを求めない・受信者分のSupabase Authユーザーを作らない（Auth MAU課金を発生させない仕組み）、(b) 誤ってメンバー以外へ送ってしまった場合に後からそのリンクを無効化できる仕組み。
- 実装方針（PR #73セッションで合意済みの参考案。着手時に再検証してよい）: `share_links`テーブル（token・group_id・対象field/record・revoked_at等）+ `SECURITY DEFINER`のRPC（tokenを検証し対象データのみ返す）+ 公開ルート`/s/[token]` + 共有時のリンク発行・メニューでの失効UI。`auth.users`には一切行を作らない。
- 重要制約: Supabase migration・RLS・Storage設定の変更はユーザー承認後のみ。実装前にスキーマ・RLS影響の計画を報告し、承認を得てから着手する。
- 非対象: ホーム・導線の再設計（PR #73で完了）、LINE Messaging APIダイジェスト配信。
- 検証環境: E2E専用アカウント `e2e-verifier@rice-knowledge-map.test`（専用グループ、RLSで実データと分離）。Playwrightは`e2e/global-setup.ts`が`.auth/user.json`を生成。Claude Codeサンドボックスでは `NODE_USE_ENV_PROXY=1 PW_SANDBOX_PROXY_RELAY=1 PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test`（実マシン・CIではこれらの環境変数は不要）。
- Claude Code再開時の伝達文: `mainをpullして、tasks/TASKS.md の「現在の実行タスク」を読んでください。共有リンクのトークン方式アクセス制御について、share_linksテーブル・RPC・/s/[token]ルートのスキーマ設計とRLS影響を報告してください。Supabase変更を含むため、実装は承認後に進めてください。`

## 次の実行候補

- 記録ページにコメントのみ（写真・音声なし）の記録を追加できる導線（`record_type: "other"`の既存実装を流用可能・PR #73レビューで要望）
- 再設計フェーズ5: LINE Messaging APIダイジェスト配信（Issue #64参照・将来）
- T-048: 記録のAI整理・要約（任意機能）
- T-052: コメントの編集・削除（長押し/スワイプ等の操作導線を再検討）
- T-053: 複数グループの本格対応
- T-054: 記録のsoft-delete（`deleted_at` + RLS）
- U-004: Supabaseレガシーanonキーの無効化（任意・ユーザー作業）

## ユーザー確認待ち

- 共有リンク実装時のSupabaseスキーマ変更（`share_links`テーブル・RPC）の承認（計画報告後）
- PC対応に着手してよいタイミングの判断

## 完了履歴

<!-- 詳細はPRを参照。ここには「Issue番号 → PR番号: 一言」のみ残す -->

- Issue #58 → PR #59, #60, #61: 入口・画像確認・今日の田んぼ導線の混乱解消 / session-start-hook整備 / Issue・PRテンプレート整備
- Issue #65 → PR #66: デザイントークン+「今日の流れ」実装（フェーズ1）
- Issue #67 → PR #68: 現場OS実装（ホーム+マップ統合・フェーズ2）
- Issue #69, #70 → PR #71: 田んぼストーリー+LINE共有・初回利用者導線（フェーズ3）
- Issue #72 → PR #73: ランディング(/)へのホーム統合・名称統一（マップ/みんなの記録/各場所の記録）・使い方の流れバー・E2Eテスト一式（フェーズ4）
