# rice-knowledge-map

実画像マップ型 稲作ナレッジ記録 PWA。

田んぼの暗黙知を国土地理院の空中写真タイル上に固定し、写真・音声・位置情報・家族コメント・対応状況として残すアプリです。農業日誌や管理表ではなく、**実画像マップ上の「場所に結びついた現場知識」の記録**が中心です。

本番URL: **https://rice-knowledge-map.vercel.app**

---

## セットアップ

### 必要環境

- Node.js 20 以上
- npm

### インストール

```bash
git clone https://github.com/kazu-4728/rice-knowledge-map.git
cd rice-knowledge-map
npm install
```

### 環境変数

`.env.example` をコピーして `.env.local` を作成し、値を設定します。

```bash
cp .env.example .env.local
```

| 変数名 | 取得場所 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API Keys | プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上（publishable キー） | `sb_publishable_...` 形式 |
| `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN` | 任意。`1` にすると Google ログインボタンが表示される | Supabase で Google プロバイダを設定済みの場合のみ |

環境変数が未設定の場合、アプリはサンプルデータのデモモードで動作します。

---

## 主要コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint
npx tsc --noEmit # 型チェック（CI・セルフレビュー必須）
```

---

## 技術構成

```text
Frontend : Next.js 15.3（App Router）
Language : TypeScript 5.8
UI       : React 19 + Tailwind CSS 4
Map      : MapLibre GL JS 5.24
Base map : 国土地理院 空中写真タイル
Backend  : Supabase Auth / Postgres / Storage / RLS
Deploy   : GitHub → Vercel（main マージで自動デプロイ）
```

---

## 実装済み機能

### マップ

- MapLibre GL JS + 国土地理院 空中写真タイル
- 田んぼ区画のなぞり描き登録（2段階: 場所合わせ→輪郭描画）・名前変更・描き直し・削除
- 固定ピン（入水口/出水口/異常箇所）の登録・編集・削除
- 田んぼ選択ホイールピッカー（スクロールプレビュー＋タップ選択）
- iOS Safari 対応（動的ビューポート・入力ズーム防止）

### 記録

- 写真撮影→圧縮→Supabase Storage 保存→一覧サムネ表示（記録時刻・記録時の端末位置も表示。PC等で既存写真を選んだ場合は写真のEXIFではなく記録操作時の値）
- 音声メモ録音（MediaRecorder）→ Storage 保存→再生
- 保存前確認画面（田んぼ・地点・カテゴリ・状態・メモ）
- 地点の分類は8種類（入水口/出水口/水路/雑草/注意箇所/畦崩れ/水抜け不良/その他）
- 記録詳細・コメント・状態の任意変更（`open`/`needs_check`/`monitoring`/`resolved`の4種類。`open`は記録種別に応じて「通常」または「未対応」と表示し分けるのみで別状態ではない）と変更履歴表示
- 田んぼ詳細の定点観測（同じ地点の写真を時系列比較）
- 記録削除（記録者本人 or owner のみ）

### 認証・共有・権限

- Google ログイン / メールリンクログイン
- グループ招待 URL（`/invite`、招待時に editor/viewer の権限を選択可能）
- 家族・作業者の一覧、権限（owner/editor/viewer）の確認・変更（`/menu/family`）
- グループ単位の RLS（閲覧は全メンバー・書き込みは owner/editor）

### その他

- カレンダー（家族共有の作業予定 CRUD）
- 記録エクスポート（年次/田んぼ別 PDF: `window.print()`）
- モバイル: MenuDrawer（ハンバーガー） / PC: SideNav（常時表示）
- PWA 対応（manifest + Service Worker）

---

## 画面一覧

| ルート | 画面 |
|---|---|
| `/` | ホーム（未ログイン: ランディング／ログイン後: ダッシュボード） |
| `/map` | メインマップ（MapCanvas） |
| `/fields` | 田んぼ一覧 |
| `/fields/[id]` | 田んぼ詳細（概要／記録／定点観測タブ） |
| `/records` | 記録タイムライン（記録一覧） |
| `/records/[id]` | 記録詳細 |
| `/records/new` | 記録作成（写真/音声） |
| `/records/new/confirm` | 保存前確認 |
| `/calendar` | カレンダー |
| `/guide` | 使い方 |
| `/export` | エクスポート（PDF） |
| `/menu` | メニュー |
| `/menu/family` | 家族・作業者（メンバー一覧・権限変更・招待） |
| `/menu/site` | サイト設定（owner のみ） |
| `/login` | ログイン |
| `/invite` | 招待引き換え |
| `/home`, `/talk` | 旧URL互換のリダイレクト専用（`/` `/records` へ） |

---

## Supabase 構成

- プロジェクト: `rice-farm-app`（無料プランのため長期間放置で一時停止に注意）
- スキーマ: migration 0001〜0011 適用済み（詳細・適用状況は `supabase/README.md` 参照）
- テーブル: profiles / farm_groups / farm_group_members / farm_group_invites / farm_fields / field_seasons / field_points / records / record_media / record_comments / record_status_events / group_site_content / farm_schedules

---

## Supabase監査（Issue #87 P2）

Supabase実環境の状態（Security/Performance Advisor・RLS有効状態・migration適用状態・
`SECURITY DEFINER`関数の実行権限・Storage bucket/policy・旧テーブル
`fields`/`field_logs`の残存確認）を読み取り専用でJSON出力する。Supabase側の
設定・スキーマは一切変更しない。

`scripts/supabase-audit-write.mjs`は、Supabase状態を直接取得するスクリプトでは
ない。Supabase MCPで取得した監査入力を、標準化された監査レポートJSON
（`status`/`blocking`/`warnings`を含む）へ変換・保存するだけである。取得処理は
Claude CodeセッションのSupabase MCP手順（下記手順1）で行う。古い入力JSONの
再利用を避けるため、監査実行時は必ず手順1（MCP取得）から手順3（書き出し）まで
連続して行う。

対象プロジェクトのproject_idは本ファイルに書かない（IDもキー・パスワードと
同様に扱い、リポジトリへ書かない方針。AGENTS.md参照）。実行時に以下いずれかで
都度確認する。

- ローカルの`.env.local`にある`NEXT_PUBLIC_SUPABASE_URL`のホスト名部分
  （`https://<project_id>.supabase.co`）
- Supabase MCPの`list_projects`でプロジェクト名`rice-farm-app`を検索する

### 実行方法（Claude Codeセッションから）

データ取得自体にはSupabase管理者権限が必要なため、Supabase MCPツールを持つ
Claude Codeセッションから実行する。`scripts/supabase-audit-write.mjs`自体は
取得済みのJSONを整形して書き出すだけで、資格情報・project_idは一切扱わない。

1. 上記の方法でproject_idを確認したうえで、Supabase MCPで以下を取得する
   - `get_advisors`（type: `security`）→ `result.lints`
   - `get_advisors`（type: `performance`）→ `result.lints`
   - `list_migrations` → `migrations`
   - `execute_sql`で以下を実行 → `rls_policies`。`pg_policies`だけを見ると
     RLSが無効なテーブルやポリシー0件のテーブルが結果から消えて気づけないため、
     `pg_class`から全テーブルを起点にLEFT JOINする
     ```sql
     select
       c.relname as tablename,
       c.relrowsecurity as rls_enabled,
       count(p.policyname) as policy_count
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
     where c.relkind = 'r'
     group by c.relname, c.relrowsecurity
     order by c.relname;
     ```
   - `execute_sql`で以下を実行 → `security_definer_functions`
     ```sql
     select
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       (select array_agg(r.rolname) from (values ('anon'), ('authenticated')) as r(rolname)
         where has_function_privilege(r.rolname, p.oid, 'execute')) as roles_with_execute
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where p.prosecdef = true
     order by p.proname;
     ```
   - `execute_sql`で以下を実行 → `storage_buckets`
     ```sql
     select id, name, public from storage.buckets order by id;
     ```
   - `execute_sql`で以下を実行 → `storage_object_policies`
     ```sql
     select schemaname, tablename, policyname, cmd, roles
     from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
     order by policyname;
     ```
   - `execute_sql`で以下を実行 → `legacy_tables`（結果は1行のオブジェクト）
     ```sql
     select
       exists(select 1 from information_schema.tables where table_schema='public' and table_name='fields') as fields_exists,
       exists(select 1 from information_schema.tables where table_schema='public' and table_name='field_logs') as field_logs_exists;
     ```

2. 取得した結果を、以下の形のJSONにまとめる
   ```json
   {
     "security_lints": [...],
     "performance_lints": [...],
     "rls_policies": [...],
     "migrations": [...],
     "security_definer_functions": [...],
     "storage_buckets": [...],
     "storage_object_policies": [...],
     "legacy_tables": { "fields_exists": false, "field_logs_exists": false }
   }
   ```
   このJSONファイルはリポジトリの外（例: `/tmp/claude/<セッションID>/scratchpad/`
   など）に置く。実環境のAdvisor・RLS・migration情報を含むため、リポジトリ配下に
   置いて誤ってコミットしないこと。

3. そのJSONを標準入力で渡して実行する
   ```bash
   cat /tmp/.../audit-input.json | node scripts/supabase-audit-write.mjs
   ```
   `supabase-audit/<タイムスタンプ>.json`と`supabase-audit/latest.json`
   （ともに`.gitignore`対象。運用中に増減する監査結果はリポジトリに置かない）
   に書き出され、要約がコンソールに表示される。

   このスクリプトはSupabaseに接続しない（接続にはSupabase管理者権限が必要で、
   その資格情報をリポジトリに書けないため）。出力の鮮度は手順1を実行した
   直後に手順3まで通しで行うことでのみ担保される。古いJSONを使い回すと
   古い監査結果が最新として書き出されるので注意する。

### 出力形式・判定基準

出力の最上位に`status`（`pass` | `warn` | `fail`）・`blocking`・`warnings`を含む。

- `blocking`（`status: fail`）: Security Advisorが`ERROR`、RLSが無効なテーブル、
  `SECURITY DEFINER`関数が`anon`にEXECUTE許可、旧テーブル`fields`/`field_logs`が
  存在、直近ローカルmigrationが未適用の可能性
- `warnings`（`blocking`が0件なら`status: warn`）: Security Advisorが`WARN`、
  RLSは有効だがポリシー0件のテーブル
- 上記のいずれもなければ`status: pass`

Performance Advisorの警告は個別には`blocking`/`warnings`に含めない（INFO相当は
全てブロックせず`performance_advisors`に生データとして残すのみ。対応要否は
Issue #87 P5「Performance Advisor整理」で判断する）。

`migrations.newest_local_applied_remotely`が`false`の場合、直近でコミットした
ローカルmigrationファイルがSupabase側に未適用の可能性がある
（`apply_migration`の適用忘れ）。ファイル名の連番接頭辞（`0011_`等）を除いた
名前で緩やかに一致判定している（`apply_migration`のname引数は接頭辞を省く
運用が過去にあったため。`supabase/README.md`の0011の記録を参照）。それより
古いmigrationの名前突き合わせは行わない（初期のmigrationは統合・改名されて
おり、緩やかな一致でもノイズだらけになり実用にならないため）。

`get_advisors`のツール説明にある通り、DDL変更（migration適用）後は毎回実行することを推奨する。

---

## 開発ガイド

作業ルール・UI 基準・技術方針・現在のフェーズは `AGENTS.md` を参照してください（Codex / Claude Code 共通）。

Claude Code 固有の引き継ぎ情報（現在の状態・ハマりどころ・次の作業）は `CLAUDE.md` にあります。

残タスク・実機確認ログ・作業ログの一次情報は `tasks/TASKS.md` です。
