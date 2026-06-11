# supabase/

Supabase関連のファイルを置くディレクトリです。

## 適用状況（2026-06-10）

- プロジェクト `rice-farm-app`（uakcrkylonvgcmwuyyyk）に **0001 / 0002 / 0003 適用済み**。
- セキュリティアドバイザリの残りWARN 4件（`is_group_member` / `has_group_role` /
  `redeem_group_invite` / `create_farm_group` が authenticated から実行可能）は
  **設計上意図したもの**。RLSポリシー評価とログインユーザー向けRPCに必要で、
  各関数の内部で権限・トークン検証を行っている。

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
- `0003_create_group_helper.sql` — グループ作成RPC（`create_farm_group`）
  - RLSの構造上クライアントから直接できない「グループ作成+owner登録」を
    1トランザクションで行う

## 今後migrationを追加するとき

1. `0004_xxx.sql` のように連番でこのディレクトリに追加する
2. ユーザー承認を得てから Supabase MCP / SQL Editor で適用する
   （docs/NEGATIVE_ACTIONS.md 参照）
3. 適用後に `get_advisors`（security）で新たな警告が出ていないか確認する

## 戻し方

0001〜0003は新規オブジェクトの追加のみ。取り消す場合は作成したテーブル・型・
関数・バケットポリシーをdropします。
