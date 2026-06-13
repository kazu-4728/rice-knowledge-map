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
| — | PR #25 post-merge 修正（fields/page.tsx の groupId 参照修正） | PR #26（main マージ済み） |
| UX リデザイン | スプラッシュページ（/）・/home 田んぼ一覧主役化・/fields/[id] 詳細ページ新設・緑グラデ背景・戻るボタン・折りたたみ（使い方/最近の記録）・ヒーロー画像を田んぼ写真に変更 | PR #27（main マージ済み） |
| — | Codex/Copilot レビュー対応（pointType URL 連携・groupId undefined 修正・pointId クリア修正） | PR #28（main マージ済み） |
| UX 強化 | スプラッシュ・FAB・トースト・天気ヘッダー・カレンダー・異常バナー・エクスポート | PR #29（main マージ済み） |
| アニメ刷新 | ヒーロー クロスフェード再設計・Ken Burns を全田んぼ写真に適用・田んぼ詳細クイック統計 | PR #30（main マージ済み） |

---

## 2. 修正済み・main へのマージ待ち

現在なし。すべて main マージ済み。

---

## 3. 残りの開発

| ID | 状態 | 内容 |
|---|---|---|
| PR-E | DONE | ヒーロー演出強化（Ken Burns・進捗バー・時間差フェード）・使い方全表示 | PR #29（mainマージ済み） |
| PR-F | DONE | 全ページ戻るボタン（BackButton/backDynamic）・FAB・トースト通知システム | PR #29（mainマージ済み） |
| PR-G | DONE | ヘッダー天気予報（現在地GPS→気象庁API・1週間ドロワー・SVG天気アイコン） | PR #29（mainマージ済み） |
| PR-H | DONE | カレンダー家族共有（migration 0005適用・月表示・予定CRUD・BottomNavに「予定」タブ） | PR #29（mainマージ済み） |
| PR-I | DONE | 未対応異常バナー・記録エクスポート（年次/田んぼ別PDF）・メニューリンク追加 | PR #29（mainマージ済み） |
| T-050 | TODO | MapCanvas に `?field=` 絞り込み/フォーカス機能を実装（PR #30 Codex 指摘の残課題）。実装後、FieldDetailScreen のマップボタンを `/map?field=` に戻し「マップで確認」ラベルへ |
| T-048 | TODO | 記録の AI 整理・要約（ユーザー指示で当面なし） |

---

## 4. ユーザーにしかできない作業

| ID | 状態 | 内容 |
|---|---|---|
| U-001 | DONE | Migration 0004 を Supabase 本番に apply（farm_fields.photo_path + group_site_content）。2026-06-13 MCP apply_migration で適用確認済み |
| U-002 | TODO | 本番で実機確認: 写真記録・音声メモの保存→一覧表示 / 田んぼカバー写真のアップロード / ヒーロースライドショー / 音声入力ボタン |
| U-003 | DONE | Google ログイン設定（OAuth + Supabase + Vercel 環境変数）。2026-06-12 実機ログイン成功確認 |
| U-004 | TODO | （任意）Supabase レガシー anon キーの無効化（API Keys ページ） |

---

## 作業ログ

### 2026-06-13（続き3） — ヒーロー アニメ刷新・田んぼ詳細導線（PR #30）

**背景:** ユーザー指摘「ヒーローはたいして変わっていない。ユーザー画像でも同じモーションで動かないといけない。詳細ページからの導線は変わっていない。全体のUIも変わっていない」を受けた強化。

**実施内容:**

- **`src/app/page.tsx`（スプラッシュ クロスフェード根本修正）**: 旧実装は遷移中に前後レイヤー両方が `opacity-0` になり一瞬黒画面になるバグがあった。2レイヤーモデルに再設計 — ベース層（新スライド、常時表示）＋オーバーレイ層（旧スライド、inline style の opacity transition でフェードアウト）。`requestAnimationFrame` 二重呼び出しでブラウザに opacity:1 を登録させてから 0 へ遷移。`<img>` 直書き＋`key` prop で Ken Burns を毎スライド確実にリスタート。デフォルト Unsplash 画像でもユーザー画像でも同一モーション。

- **`src/features/fields/FieldDetailScreen.tsx`（詳細ページ導線強化）**: カバー写真に `animate-ken-burns-up`＋`key={photoUrl}`（写真変更時もリスタート）。クイック統計行（記録数 / ポイント数 / 要注意数）。記録一覧＋マップへの2ボタン。全カードに `active:scale-95`。

- **`src/features/home/HomeScreen.tsx`**: 田んぼカードに `shadow-md`＋`active:scale-95`、サムネに Ken Burns。

**Codex P2 レビュー対応（3件、全対応）:**
1. **ヒーロー画像フォールバック**: `<img>` が onError で消えると黒画面になる指摘。PaddyPhoto SVG を背景レイヤーに敷き、画像失敗時も田園風景 SVG が見える構成に。
2. **マップリンクの誤解**: `/map?field=` は MapCanvas が未対応で絞り込まれない指摘。リンクを `/map` に、ラベルを「マップを開く」に変更。**残課題: MapCanvas に field 絞り込み/フォーカス機能を実装すれば `?field=` 連携を復活できる。**
3. **要注意カウント**: `type`（caution/levee_damage）判定では poor_drainage 等の警告状態を取りこぼす指摘。`status === 'needs_check' | 'issue'` ベースに変更。

- Copilot はクォータ制限でレビュー不可。Codex 指摘のみ対応。
- **PR #30** squashマージ → main 本番反映済み（2026-06-13）。

### 2026-06-13（続き2） — UX大幅強化 PR-E〜I（PR #29）

**実施内容:**

- **PR-E（スプラッシュ強化）**: Ken Burns効果（3方向）・クロスフェード遷移（前/後2レイヤー）・テキスト時間差フェードイン・プログレスバー・CSS追加（ken-burns-*/sink/fab-pop/toast-in/out）・使い方セクション7項目に拡充（全表示）

- **PR-F（戻るボタン・FAB・トースト）**: BackButtonクライアントコンポーネント新設・AppShellにbackDynamic prop追加・/records/new・/guide・/menu/siteに戻るボタン追加・FABコンポーネント（写真/音声の扇状展開）HomeScreenに配置・ToastProvider（success/error）をlayout.tsxに組み込み

- **PR-G（天気予報ヘッダー）**: 気象庁無料API連携・GPS→最近傍都道府県エリアコード選択（47都道府県対応）・WeatherHeaderコンポーネント（日時表示＋今日の天気アイコン＋タップで1週間ドロワー展開）・SVG天気アイコン6種（sunny/partly-cloudy/cloudy/rainy/snowy/thundery）・AppShellに組み込み・30分キャッシュ

- **PR-H（家族共有カレンダー）**: migration 0005（farm_schedulesテーブル・RLS・updated_atトリガー）Supabase本番適用・ScheduleデータLayer（CRUD）・CalendarScreen（月グリッド・日選択・予定追加フォーム・完了チェック・削除）・/calendar新設・BottomNavに「予定」タブ追加・IconTrash追加

- **PR-I（異常バナー・エクスポート）**: HomeScreenに未対応異常件数バナー（open/needs_check件数）・/export記録PDFエクスポートページ（年＋田んぼフィルタ・月別グループ・window.print）・メニューにエクスポートリンク追加

- **PR #29** squashマージ → main本番反映（Vercel自動デプロイ）

### 2026-06-13（続き） — UX リデザイン・Codex レビュー対応（PR #26〜#28）

**実施内容:**

- **PR #26**: fields/page.tsx の groupId 参照を `field.groupId` に修正（削除済みの state 変数参照バグ）

- **PR #27（UX リデザイン）**:
  - `src/app/page.tsx`: スプラッシュページ（全画面ヒーロー + 「アプリへ入る」ボタン、sessionStorage でスキップ）
  - `src/app/home/page.tsx`: /home ルート新設（AppShell + HomeScreen）
  - `src/features/home/HomeScreen.tsx`: 田んぼ一覧を主役に全面再設計。最近の記録・使い方 を折りたたみ（デフォルト閉）、最大 5 件
  - `src/app/fields/[id]/page.tsx`: 田んぼ詳細ページ新設（Next.js 15 準拠 `params: Promise<{id:string}>`）
  - `src/features/fields/FieldDetailScreen.tsx`: 田んぼ詳細画面（カバー写真・ピン一覧・最近の記録・記録ボタン）
  - `src/components/layout/AppShell.tsx`: backHref/backLabel props 追加・背景を緑グラデーション（from-green-50 to-gray-100）
  - `src/components/layout/BottomNav.tsx`: ホームタブを /home に変更、/fields 配下もアクティブ判定
  - `src/lib/data/siteContent.ts`: DEFAULT_SLIDES を田んぼ風景 Unsplash 画像 3 枚に変更

- **PR #28（Codex/Copilot レビュー対応）**:
  - PhotoRecordScreen / AudioRecordScreen: `?pointType=` URL パラメータの型安全バリデーション（VALID_POINT_TYPES Set）、欠落時は loadFarmData から推論
  - FieldDetailScreen / HomeScreen / fields/page.tsx: groupId を `String()` でラップしない（undefined → "undefined" 文字列バグ修正）
  - PhotoRecordScreen: 田んぼチップ選択/解除時に pointId もクリア
  - FieldDetailScreen: 全 FieldPointType（canal/levee_damage/poor_drainage/other）を POINT_TYPE_LABELS に追加
  - MapBottomSheet: 「記録する」リンクに `&pointType=` クエリ追加

---

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
