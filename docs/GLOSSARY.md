# GLOSSARY.md

この文書は、プロジェクト内の正規名称、DBテーブル名、状態値、使用しない曖昧表現を固定するための用語集です。

実装、要件定義、アーキテクチャ、タスク、PRレビューでは、この文書の名称を優先します。

## 1. プロジェクトの正規名称

- 日本語名: 実画像マップ型 稲作ナレッジ記録アプリ
- リポジトリ名: `rice-knowledge-map`
- 目的: 田んぼの暗黙知を、実画像マップ、写真、音声、位置情報、コメント、対応状況で記録・共有・継承する。

## 2. 正規テーブル名

| 用途 | 正規テーブル名 | 備考 |
|---|---|---|
| ユーザープロフィール | `profiles` | Supabase Authに紐づく |
| 共有グループ | `farm_groups` | 家族・作業者単位 |
| グループメンバー | `farm_group_members` | roleを持つ |
| 招待URL | `farm_group_invites` | token_hashで管理 |
| 田んぼ区画 | `farm_fields` | 既存Supabaseの `fields` と衝突させない |
| 作期 | `field_seasons` | `farm_fields` に紐づく |
| 固定ポイント | `field_points` | 入水口、出水口、水路、注意箇所など |
| 現場記録 | `records` | 写真・音声・メモ・状態を持つ |
| 記録メディア | `record_media` | 写真・音声ファイル |
| 記録コメント | `record_comments` | コメント用。`comments` とは書かない |
| 状態変更履歴 | `record_status_events` | 対応状態の履歴 |

## 3. 使用しないテーブル名・曖昧名

| 使用しない名称 | 理由 | 正規名称 |
|---|---|---|
| `fields` | 既存Supabase試作テーブルと衝突する | `farm_fields` |
| `field_logs` | 前回試作の水管理ログ寄り | `records` |
| `comments` | 対象が曖昧 | `record_comments` |
| `media` | 対象が曖昧 | `record_media` |
| `points` | 対象が曖昧 | `field_points` |

## 4. records.status 正規値

`records.status` は以下だけを使う。

| UI表示 | DB値 | 意味 |
|---|---|---|
| 未対応 | `open` | まだ対応していない記録 |
| 要確認 | `needs_check` | 追加確認が必要な記録 |
| 対応済み | `resolved` | 対応が完了した記録 |
| 経過観察 | `monitoring` | 継続して様子を見る記録 |

使用しない値:

- `watch`
- `done`
- `closed`
- `complete`

## 5. field_points.status 正規値

`field_points.status` は以下だけを使う。

| UI表示 | DB値 | 意味 |
|---|---|---|
| 通常 | `normal` | 問題がない固定ポイント |
| 要確認 | `needs_check` | 追加確認が必要な固定ポイント |
| 問題あり | `issue` | 詰まり、破損、異常などがある固定ポイント |
| 解決済み | `resolved` | 問題対応が完了した固定ポイント |

使用しない値:

- `watch`
- `open`
- `monitoring`

## 6. field_points.point_type 正規値

`field_points.point_type` は以下を基本にする。

| UI表示 | DB値 |
|---|---|
| 入水口 | `inlet` |
| 出水口 | `outlet` |
| 水路 | `canal` |
| 注意箇所 | `caution` |
| 雑草箇所 | `weed` |
| 畦崩れ箇所 | `levee_damage` |
| 水抜け不良箇所 | `poor_drainage` |
| その他 | `other` |

## 7. records.location_source 正規値

`records.location_source` は以下を使う。

| UI表示 | DB値 |
|---|---|
| 写真位置情報 | `photo_exif` |
| スマホGPS | `gps` |
| 手動補正 | `manual` |
| 不明 | `unknown` |

## 8. 共有ロール正規値

`farm_group_members.role` は以下を使う。

| UI表示 | DB値 | 権限概要 |
|---|---|---|
| 管理者 | `owner` | 招待、設定、削除判断、権限変更 |
| 編集者 | `editor` | 記録、写真、音声、コメント、状態更新 |
| 閲覧者 | `viewer` | 閲覧中心。MVPではコメント可否を後で判断 |

## 9. データ整合性ルール

- `records.group_id` はRLSと検索性能のために保持する。
- `records.field_id` がある場合、参照先 `farm_fields.group_id` と `records.group_id` は一致させる。
- `records.point_id` がある場合、参照先 `field_points.group_id` と `records.group_id` は一致させる。
- `field_points.field_id` がある場合、参照先 `farm_fields.group_id` と `field_points.group_id` は一致させる。
- migration作成時に、制約またはtriggerで不整合を防ぐ方針を検討する。

## 10. 地図表示ルール

- 初期背景地図は、MapLibre + 国土地理院 空中写真タイルを第一候補にする。
- 地図上に出典表記を表示する。
- タイル取得に失敗しても、田んぼ区画、固定ポイント、記録データは消さない。
- 背景地図は差し替え可能にする。

## 11. 実装前チェック

新しい文書、SQL、コードを追加する前に以下を確認する。

- 正規テーブル名に一致しているか。
- 状態値が正規値に一致しているか。
- `comments` など曖昧名を使っていないか。
- 既存Supabaseの `fields` を前提にしていないか。
- 地図出典表示が仕様から漏れていないか。
- DONEに証拠があるか。
