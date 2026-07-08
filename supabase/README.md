# supabase/

Supabase関連のファイルを置くディレクトリです。

## 適用状況（2026-07-09）

- プロジェクト `rice-farm-app`（uakcrkylonvgcmwuyyyk）に **0001〜0008相当まで適用済み**。
  ただし `0007` / `0008` 相当の変更は、Supabase側のmigration履歴名とリポジトリ内ファイル名が一致していない。
- 実DBでは `group_site_content.image_slots` が存在し、`jsonb not null default jsonb_build_object()` として適用済み。
  Supabase migration履歴上は、2026-07-06に以下の4件として記録されている。
  - `add_image_slots_to_group_site_content`
  - `set_image_slots_default`
  - `backfill_image_slots`
  - `require_image_slots`
- 実DBでは公開Storageバケット `app-defaults` が存在し、以下5ファイルが格納済み。
  - `sunrise-paddies.webp`
  - `farmer-check.webp`
  - `seedling-water.webp`
  - `planting-machine.webp`
  - `harvest-gold.webp`
- 注意: `app-defaults` バケットは実DBに存在するが、`list_migrations` では
  `0008_app_defaults_bucket` 相当の履歴名は確認できない。バケット作成とファイル投入は
  migration履歴外で行われた可能性が高い。
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

- `0004_field_photos_site_content.sql` — 田んぼカバー写真とグループサイト設定
  - `farm_fields.photo_path`（テキスト）カラム追加
  - `group_site_content` テーブル新設（グループ別ヒーロー/ランディング設定。owner のみ作成・更新・削除）
  - 適用済み: 2026-06-13（U-001 MCP apply_migration で確認）
- `0005_farm_schedule.sql` — 家族共有の作業カレンダー
  - `farm_schedules` テーブル新設（グループ・田んぼひも付き予定。title / scheduled_date / category / done など）
  - category: water_in / water_out / fertilize / pesticide / weed / harvest / other
  - 適用済み: PR #29（カレンダー機能実装時）
- `0006_schedule_authz.sql` — カレンダーの権限・整合性ハードニング
  - `farm_schedules` の INSERT / UPDATE / DELETE を owner / editor に制限（0005 では全メンバーが書き込み可だった）
  - `field_id` と `group_id` の整合性チェックトリガー追加
  - 適用済み: PR #29 と同時
- `0007_hero_image_slots.sql` — 画面ヒーロー用の差し替え可能画像スロット
  - `group_site_content.image_slots`（jsonb）カラム追加
  - 実DBでは適用済み。ただしSupabase migration履歴上は本ファイル名ではなく、
    `add_image_slots_to_group_site_content` / `set_image_slots_default` /
    `backfill_image_slots` / `require_image_slots` の4件として記録されている。
  - リポジトリ内SQLは、上記4手順の最終状態をローカル再構築用に1本化したもの。
- `0008_app_defaults_bucket.sql` — システム既定画像用の公開Storageバケット
  - `app-defaults` バケット作成（public）
  - 実DBではバケットと既定WebP 5枚の存在を確認済み。
  - ただしSupabase migration履歴上に本ファイル名相当の履歴は確認できない。
  - SQLで再現できるのはバケット作成のみ。既定WebP 5枚はStorageオブジェクトとして別途投入が必要。

## 今後migrationを追加するとき

1. `0009_xxx.sql` のように連番でこのディレクトリに追加する
2. ユーザー承認を得てから Supabase MCP / SQL Editor で適用する
   （docs/NEGATIVE_ACTIONS.md 参照）
3. 適用後に `get_advisors`（security）で新たな警告が出ていないか確認する

## 戻し方

0001〜0003は新規オブジェクトの追加のみ。取り消す場合は作成したテーブル・型・
関数・バケットポリシーをdropします。
