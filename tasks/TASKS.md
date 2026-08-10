# TASKS.md

本番URL: https://rice-knowledge-map.vercel.app

## 読み方

- 状態は `TODO / IN_PROGRESS / DONE` のみ。
- 完了の証拠は本ファイルではなくGitHub PR（番号・マージコミット）を参照する。過去の実装詳細・作業ログ・旧UI方針はここには残さない。
- 「完了履歴」は「(Issue番号 →) PR番号: 一言」のみの索引（対応するIssueが無いタスクはIssue番号を省略する）。詳細を書き足さない。
- 「現在の実行タスク」が唯一の正。他のMarkdownに矛盾する記述があっても、ここを優先する。
- 新しいセッションはまず「現在の実行タスク」だけを読めば作業を再開できる状態を保つ。

## 現在の実行タスク

### Issue #87 P2完了。P3着手には承認が必要

Issue #87（公開前品質ゲート整備）の推奨順序で、P1（CI品質ゲート、PR #89）・
P2（Supabase監査スクリプト、PR #92）が完了した。P3以降は下記「次の実行候補」
のとおりSupabaseのRLS/権限に関わる負例テスト・soft-delete実装を含み、
着手には承認が必要（P6のsoft-delete方針自体は2026-08-09に承認済み。実装着手は別途承認）。
新しいセッションはまずオーナーに次に進めてよい項目を確認すること。

参考:
- Issue #87: https://github.com/kazu-4728/rice-knowledge-map/issues/87
- Issue #87の推奨順序: 1.CI品質ゲート（完了） 2.Supabase Advisor監査スクリプト（完了） 3.SECURITY DEFINER関数監査 4.RLS/Storage負例テスト 5.Performance Advisor整理 6.旧テーブル・soft delete方針整理
- Issue #87完了条件のうち、FK index追加・`auth.uid()`最適化・複数permissive policy統合・旧テーブル`fields`/`field_logs`削除・SECURITY DEFINER関数の権限見直し（`anon`のEXECUTE権限revoke・`search_path`固定）はPR #86で対応済み。旧テーブルの残存確認・SECURITY DEFINER関数の実行権限はPR #92の監査スクリプトで継続監視できる

## 次の実行候補

- Issue #87 P3: SECURITY DEFINER関数の負例テスト（`update_member_role`/`redeem_group_invite`/`set_record_status`等で越境・権限昇格が失敗することを確認・記録する。関数自体の権限見直しはPR #86で対応済み）+ RLS負例テスト（他グループの`farm_fields`/`records`/`record_media`が取得できない等、Issue #87本文記載の最低限ケース）。要承認
- Issue #87 P4: Storage越境テスト（他グループの画像/音声パスを直接指定して読めない、viewerが許可されないbucket/pathへuploadできない等）。要承認
- Issue #87 P5: Performance Advisor整理の残り（PR #92の監査スクリプト出力を見て都度判断。Supabase変更を伴う場合は要承認）
- Issue #87 P6: soft-delete実装（`deleted_at` + RLS更新 + 削除UIの導線調整。2026-08-09オーナー承認: 実装する方針で確定。要承認、旧T-054はこれに統合）
- Auth leaked password protectionの有効化（ダッシュボード側の手動設定。PR #86でも指摘済み・オーナー作業）
- 共有リンクのトークン方式アクセス制御（記録単位）: 2026-07-24の検討で今回は着手しないと判断したが、案自体は有効。チーム外（非メンバー）へ記録を見せる必要、または外部AI・外部ツールへURLで記録を渡す用途が生じた時点で再設計する。参考実装方針: `share_links`テーブル（token・group_id・対象`record_id`・revoked_at等）+ `SECURITY DEFINER`のRPC + 公開ルート`/s/[token]` + 失効UI。`auth.users`に行を作らない（Auth MAU課金なし）。写真の配信にはservice role経由の署名URL発行が別途必要。Supabase変更のため着手時に承認必須。
- フェーズ6: 記録のAI整形（旧T-048を具体化）: サーバー側エンドポイント1本（Next.js APIルート or Supabase Edge Function）で「テキスト→圃場/場所/カテゴリ/状況/メモ/次のアクションのJSON」を返し、確認画面の初期値を埋める。保存先は既存`records.ai_summary`/`next_action`のみ。**`ai_category`はポイント種別（inlet/outlet等）の保持に流用済み（`src/lib/data/recordSave.ts`が書き込み、`records.ts`の`toPointType`/`isUnresolvedIssue`が読む）のため書き込まない**。AIカテゴリの表現は既存のポイント種別・`record_type`への対応付けを第一候補とし、不足するなら専用カラム追加（migration・要承認）を着手時に判断。AI失敗時も保存を妨げないフェイルソフト。プロバイダ選定・課金はオーナー承認後。
- フェーズ7以降（将来・北極星）: LINE取り込み（Bot/Webhook→フェーズ6と同じ構造化関数へ合流）、ハンズフリー音声AI対話（蓄積した構造化記録をAIが参照して会話で応答）。
- アプリ内簡易bot（蓄積した記録を横断して質問に答える）: フェーズ6と同じ外部AI連携基盤（窓口＋プロバイダ選定＋無料枠運用）を必要とするが、日常的な実用性はより高いという見立て。PR2のエクスポートを実際に外部AIで使ってみて、頻出する質問パターンが見えた段階で着手を判断する。
- T-053: 複数グループの本格対応（1ユーザーが複数グループに所属するケース。テナント分離自体は別問題として2026-07-27に確認済み）
- U-004: Supabaseレガシーanonキーの無効化（任意・ユーザー作業）

## ユーザー確認待ち

- フェーズ6・簡易botのLLMプロバイダ選定・課金上限（着手時に選択肢と費用を提示して承認を得る。従量課金は避け、無料枠超過時は課金せず機能を停止する方針を優先）
- PC対応に着手してよいタイミングの判断

## 完了履歴

<!-- 詳細はPRを参照。ここには「Issue番号 → PR番号: 一言」のみ残す -->

- Issue #58 → PR #59, #60, #61: 入口・画像確認・今日の田んぼ導線の混乱解消 / session-start-hook整備 / Issue・PRテンプレート整備
- Issue #65 → PR #66: デザイントークン+「今日の流れ」実装（フェーズ1）
- Issue #67 → PR #68: 現場OS実装（ホーム+マップ統合・フェーズ2）
- Issue #69, #70 → PR #71: 田んぼストーリー+LINE共有・初回利用者導線（フェーズ3）
- Issue #72 → PR #73: ランディング(/)へのホーム統合・名称統一（マップ/みんなの記録/各場所の記録）・使い方の流れバー・E2Eテスト一式（フェーズ4）
- Issue #72 → PR #75: 記録を核とした全体再構成（フェーズ5・常設ボトムタブ4つ・ホームのダッシュボード/LP分離・記録タイムライン統合・記録詳細/場所詳細の再設計）
- Issue #72 → PR #77: フェーズ5リリース後のオーナー実機指摘対応（ランディング/使い方ガイドに残っていた旧UI「田んぼストーリー」画像・「みんなの記録」等の旧名称を現行に更新）
- PR #80: 記録運用の改善（分類8種類化・状態の任意変更＋履歴表示・定点観測導線・家族権限管理画面・写真メタ表示）
- PR #82: エクスポート機能拡充（画像埋め込みPDF/CSV/ZIP出力・写真EXIF書き戻し）
- PR #84: カレンダーへの記録連携とコメント編集・削除機能
- PR #86: 台帳/日誌の2層再構成（ホーム田んぼボード・田んぼ詳細の縦一列化・ピン写真台帳・記録写真のピン台帳登録・Supabaseアドバイザー指摘解消）
- Issue #87 → PR #89: CI品質ゲート追加（lint/型チェック/buildをPRごとに自動実行）
- PR #90: E2E資格情報のセッション間引き継ぎ手順追加（実値をリポジトリに書かずSupabase MCP経由で再発行）
- Issue #87 → PR #92: Supabase監査（Advisor/RLS有効状態/migration適用状態/SECURITY DEFINER関数実行権限/Storage bucket・policy/旧テーブル残存確認）をJSON出力するスクリプトを追加
