# supabase/

Supabase関連のファイルを置くディレクトリです。

## 適用状況（2026-06-10）

- プロジェクト `rice-farm-app`（uakcrkylonvgcmwuyyyk）に **0001 / 0002 適用済み**。
- セキュリティアドバイザリの残りWARN 3件（`is_group_member` / `has_group_role` /
  `redeem_group_invite` が authenticated から実行可能）は**設計上意図したもの**。
  前2つはRLSポリシー評価に必要で、呼び出し元自身の所属可否しか返さない。

## migrations/

- `0001_init.sql` — 初期MVPスキーマ（docs/DATA_MODEL.md 準拠）
  - テーブル: profiles / farm_groups / farm_group_members / farm_group_invites /
    farm_fields / field_seasons / field_points / records / record_media /
    record_comments / record_status_events
  - 全テーブルRLS有効。所属グループのみ閲覧、owner/editorのみ書き込み
  - `records.group_id` の整合性はトリガーで担保
  - 招待は `redeem_group_invite(token)`（トークンはsha256ハッシュのみ保存）
  - Storageバケット `images` / `audio`（非公開・署名URL前提）と
    `groups/{group_id}/...` パスに基づくRLSポリシー
- `0002_harden_functions.sql` — アドバイザリ対応
  - trigger関数の `search_path` 固定
  - SECURITY DEFINER 関数の実行権限を最小化

## 適用手順（ユーザー承認後のみ / T-032〜T-033）

1. Supabaseプロジェクト `rice-farm-app` が一時停止中の場合は復元する
2. ダッシュボードの SQL Editor で `0001_init.sql` を実行する
   （またはSupabase MCP / CLI の migration 適用を使用）
3. `select * from pg_tables where schemaname = 'public';` でテーブル作成を確認
4. Authentication → Providers で Google を有効化する（Phase 4）

## 戻し方

このmigrationは新規オブジェクトの追加のみで、既存の `fields` / `field_logs`
には触れません。取り消す場合は作成したテーブル・型・関数・バケットポリシーを
dropします（必要になった時点で 0002_rollback 案を作成します）。
