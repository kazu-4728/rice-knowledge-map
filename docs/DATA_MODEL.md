# DATA_MODEL.md

## 1. 方針

データ構造は後から大きく壊れないようにする。UIは変更可能だが、田んぼ、作期、位置、記録者、日時、写真、音声、状態は必ず紐づける。

## 2. 既存Supabaseの扱い

既存Supabaseには前回試作の `fields` / `field_logs` が存在する。ただし今回の本命設計には不足があるため、初期MVPでは新設計を優先する。

既存テーブルの削除は後回し。新MVP用テーブル追加で進め、動作確認後に削除を検討する。

既存 `fields` と衝突しないよう、今回の新設計では田んぼ区画テーブル名を `farm_fields` とする。

## 3. 初期MVPテーブル案

### profiles

Supabase Authのユーザーに紐づくプロフィール。

- id: uuid, auth.users.id
- display_name: text
- avatar_url: text
- created_at: timestamptz
- updated_at: timestamptz

### farm_groups

家族・作業者単位の共有グループ。

- id: uuid
- name: text
- owner_user_id: uuid, references profiles.id
- created_at: timestamptz
- updated_at: timestamptz

### farm_group_members

グループ所属と権限。

- id: uuid
- group_id: uuid, references farm_groups.id
- user_id: uuid, references profiles.id
- role: owner / editor / viewer
- joined_at: timestamptz

### farm_group_invites

招待URL用。

- id: uuid
- group_id: uuid, references farm_groups.id
- token_hash: text
- role: editor / viewer
- expires_at: timestamptz
- used_at: timestamptz nullable
- created_by: uuid, references profiles.id
- created_at: timestamptz

### farm_fields

田んぼ区画。

既存Supabaseの `fields` とは別テーブルとして作成する。

- id: uuid
- group_id: uuid, references farm_groups.id
- name: text
- memo: text
- center_latitude: numeric
- center_longitude: numeric
- boundary_geojson: jsonb
- area_sqm: numeric
- display_order: integer
- created_by: uuid, references profiles.id
- created_at: timestamptz
- updated_at: timestamptz

### field_seasons

作期。

- id: uuid
- field_id: uuid, references farm_fields.id
- year: integer
- crop_name: text
- variety: text
- started_at: date
- ended_at: date nullable
- memo: text

### field_points

入水口、出水口、水路、注意箇所などの固定ポイント。

- id: uuid
- group_id: uuid, references farm_groups.id
- field_id: uuid nullable, references farm_fields.id
- point_type: inlet / outlet / canal / caution / weed / levee_damage / poor_drainage / other
- name: text
- latitude: numeric
- longitude: numeric
- status: normal / watch / issue / resolved
- memo: text
- last_checked_at: timestamptz nullable
- created_by: uuid, references profiles.id
- created_at: timestamptz
- updated_at: timestamptz

### records

写真・音声・メモを含む現場記録。

- id: uuid
- group_id: uuid, references farm_groups.id
- field_id: uuid nullable, references farm_fields.id
- season_id: uuid nullable, references field_seasons.id
- point_id: uuid nullable, references field_points.id
- record_type: photo / voice / water / work / issue / check / other
- status: open / needs_check / resolved / monitoring
- latitude: numeric
- longitude: numeric
- location_source: photo_exif / gps / manual / unknown
- title: text
- note: text
- ai_summary: text
- ai_category: text
- next_action: text
- recorded_by: uuid, references profiles.id
- recorded_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz

#### records.status 対応表

| UI表示 | DB値 | 意味 |
|---|---|---|
| 未対応 | open | まだ対応していない記録 |
| 要確認 | needs_check | 追加確認が必要な記録 |
| 対応済み | resolved | 対応が完了した記録 |
| 経過観察 | monitoring | 継続して様子を見る記録 |

#### group_id 整合性

`records.group_id` はRLSと検索性能のために保持する。ただし、`field_id` / `point_id` / `season_id` が設定される場合、それぞれが属する `farm_fields.group_id` と必ず一致する必要がある。

migration作成時は、以下のどちらかで担保する。

- triggerで `group_id` の一致を検証する。
- 保存処理で `field_id` から `group_id` を補完し、DB制約で不整合を拒否する。

### record_media

写真・音声ファイル。

- id: uuid
- record_id: uuid, references records.id
- media_type: image / audio
- storage_bucket: text
- storage_path: text
- latitude: numeric nullable
- longitude: numeric nullable
- captured_at: timestamptz nullable
- created_at: timestamptz

### record_comments

コメント。

- id: uuid
- record_id: uuid, references records.id
- user_id: uuid, references profiles.id
- comment: text
- created_at: timestamptz
- updated_at: timestamptz

### record_status_events

状態変更履歴。

- id: uuid
- record_id: uuid, references records.id
- from_status: text
- to_status: text
- changed_by: uuid, references profiles.id
- comment: text
- created_at: timestamptz

## 4. RLS方針

基本条件:

- ユーザーは所属する farm_group のデータのみ閲覧できる。
- owner/editor は作成・更新できる。
- viewer は閲覧のみを基本にする。
- 未ログインユーザーは編集不可。

## 5. Storage方針

- images: 写真
- audio: 音声

Storageパス例:

```text
groups/{group_id}/records/{record_id}/images/{file_id}.jpg
groups/{group_id}/records/{record_id}/audio/{file_id}.webm
```

Storage公開設定は承認必須。初期は非公開 + 署名URLを前提とする。
