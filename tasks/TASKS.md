# TASKS.md

いま何が動いていて、何が残っているかを一目で分かるようにする管理表です。
状態は `TODO / IN_PROGRESS / DONE` のみ。`DONE` には証拠（PR・実機確認）が必要です。

本番URL: https://rice-knowledge-map.vercel.app

---

## 1. 完成して動いているもの（main マージ済み）

| ID | 内容 | 証拠 |
|---|---|---|
| — | 全画面UI（マップ/記録一覧/記録詳細/保存前確認/田んぼ一覧/メニュー/ホーム）+ PWA | PR #10 |
| T-030〜T-033 | Supabase スキーマ（11テーブル・RLS・Storage・招待 RPC）、migration 0001〜0003 適用済み | PR #11 |
| — | 認証（メールリンクログイン）・マップの Supabase 読込・田んぼ保存 | PR #12、実機確認済み 2026-06-11 |
| — | 招待 URL の発行・引き換え（/invite） | PR #12/#13 |
| — | Vercel 本番公開・リポジトリからのキー排除（キーはローテーション済み） | PR #13 |
| — | なぞり描き登録・GPS 現在地・田んぼの編集（名前変更/描き直し/削除）・サンプル排除 | PR #14 |
| Phase A | /login ページ・ヘッダーのログイン導線・飾り UI 整理・記録一覧の検索/絞り込み | PR #15 |
| Phase B | 写真記録の保存（撮影→圧縮→Storage→一覧に実写真サムネ表示・保存前確認・下書き復元） | PR #16 |
| Phase B2 | 音声メモの録音・保存（MediaRecorder・Audio Storage・再生対応） | PR #17（705eb3e） |
| Phase C (T-034b) | 記録詳細の実データ化（loadRecordDetail、実記録タップで詳細表示） | PR #18（62f0554） |
| Phase C (T-045) | 記録へのコメントと「対応済みにする」 | PR #18（62f0554） |
| Phase D (T-043) | ピン（入水口/出水口/異常箇所）の登録・編集・削除 | PR #19（db4a636）+ PR #20（b32a750） |
| Phase C/E (T-049) | ピン絞り込み・田んぼ一覧・ホーム最近の記録・メニュー件数の実データ化 | PR #21（a8f34a3） |
| UX PR-A | Migration 0004（farm_fields.photo_path + group_site_content テーブル） | PR #22（1961a50） |
| UX PR-B | ヒーローセクション・アプリ説明・/guide・サイト設定 UI（管理者） | PR #23（8ea32cc） |
| UX PR-C | 音声入力（Web Speech API）を全テキスト欄 6 箇所に追加 | PR #24（7e0f366） |
| UX PR-D | 田んぼ実写カバー写真・田んぼ→記録導線・point_id 連携 | PR #25（e3d5258） |
| — | Google ログイン設定（Google Cloud OAuth + Supabase + Vercel 環境変数） | 実機ログイン成功確認済み 2026-06-12 |

---

## 2. 修正済み・main へのマージ待ち

| ID | 状態 | 内容 | ブランチ |
|---|---|---|---|
| — | IN_PROGRESS | PR #25 post-merge 修正（point_id 連携の完成 + fields/page.tsx の groupId 参照修正） | `claude/affectionate-knuth-lo4b5v`（da99c84） |

→ **次のアクション**: ユーザーが PR を確認しマージ、またはレビューが来たら対応してマージ。

---

## 3. 残りの開発

現状 **目立った TODO なし**。上記がすべてマージされれば機能としては一通り完成。

任意の積み残し:

| ID | 状態 | 内容 |
|---|---|---|
| T-048 | TODO | 記録の AI 整理・要約（任意機能） |

---

## 4. ユーザーにしかできない作業

| ID | 状態 | 内容 |
|---|---|---|
| U-001 | TODO | Migration 0004 を Supabase 本番に apply（farm_fields.photo_path + group_site_content）。Supabase ダッシュボード → SQL Editor または MCP `apply_migration` |
| U-002 | TODO | 本番で実機確認: 写真記録・音声メモの保存→一覧表示 / 田んぼカバー写真のアップロード / ヒーロースライドショー / 音声入力ボタン |
| U-003 | DONE | Google ログイン設定（OAuth + Supabase + Vercel 環境変数）。2026-06-12 実機ログイン成功確認 |
| U-004 | TODO | （任意）Supabase レガシー anon キーの無効化（API Keys ページ） |

---

## 作業ログ

### 2026-06-13 — PR #22〜#25 UX 刷新 4 本・post-merge 修正

**実施内容:**

- **PR-A (#22)**: `supabase/migrations/0004_field_photos_site_content.sql` 新規作成。
  - `farm_fields` に `photo_path text` カラム追加
  - `group_site_content` テーブル新設（group_id PK・hero_slides jsonb・RLS ポリシー）
  - `updated_by` を `profiles` 参照に統一、`updated_at` 自動更新トリガー追加

- **PR-B (#23)**: ヒーロー・アプリ説明・/guide・サイト設定 UI
  - `src/components/ui/RemotePhoto.tsx` 新設（img onError → PaddyPhoto fallback、failedSrc でリセット対応）
  - `src/lib/data/siteContent.ts` 新設（loadSiteContent / saveSiteContent、demo/anon は DEFAULT_SLIDES）
  - `src/features/home/HeroSection.tsx` 新設（6s 自動送りスライドショー、cleanup 対応）
  - `src/features/home/AppIntroSection.tsx` 新設（アプリ概要説明）
  - `src/app/guide/page.tsx` + `src/features/guide/GuideContent.tsx` 新設
  - `src/app/menu/site/page.tsx` + `src/features/menu/SiteContentEditor.tsx` 新設（管理者のみ表示）
  - `src/lib/data/farm.ts` に `getMyRole(groupId)` 追加（user_id フィルタで権限昇格防止）
  - `src/features/home/HomeScreen.tsx` に HeroSection + AppIntroSection 追加
  - globals.css に hero-fade / hero-zoom / rise アニメーション追加

- **PR-C (#24)**: 音声入力
  - `src/lib/hooks/useSpeechRecognition.ts` 新設（Web Speech API、ja-JP、連続モードなし、hydration-safe）
  - `src/components/ui/VoiceInputButton.tsx` 新設（非対応環境で null 返却、animate-pulse）
  - 対象 6 箇所に追加: PhotoRecordScreen / AudioRecordScreen / records/[id] / AddPinSheet / PointEditDialog / FieldNameDialog

- **PR-D (#25)**: 田んぼ実写・導線・point_id 連携
  - `src/lib/utils/imageCompress.ts` 新設（長辺 1600px / JPEG 0.8 共通ユーティリティ）
  - `src/lib/supabase/types.ts` に `photo_path` 追加
  - `src/lib/data/farm.ts` に `updateFieldPhoto()` 追加、GeoJSON に `group_id` / `photo_path` 追加
  - `src/app/fields/page.tsx` 全面改修（FieldItem に groupId、カバー写真 signed URL、カメラボタン、タップ → /records?field=）
  - `src/features/records/RecordsScreen.tsx` に `?field=` 絞り込み + 解除バナー追加
  - `src/features/map/MapBottomSheet.tsx` の「記録する」に `?field=&point=` クエリ追加
  - `src/features/records/recordDraft.ts` に `pointId` フィールド追加
  - `src/lib/data/recordSave.ts` に `point_id` insert 追加
  - `src/features/records/PhotoRecordScreen.tsx` / `AudioRecordScreen.tsx` に pointId 読込・引き継ぎ追加

- **post-merge 修正 (da99c84)**: `fields/page.tsx` のカメラボタン条件を削除済みの `groupId` 状態変数から `field.groupId` に修正。未マージ（ブランチ上）。

---

## 運用ルール

- 1 タスク 1 目的。UI 作業と DB 作業を混ぜない
- スクリーンショットまたは動画なしに UI 作業を完了扱いにしない
- main へのマージ（= 本番反映）と Supabase 変更はユーザー承認後のみ
- キー・URL 等の実値はリポジトリに一切書かない
