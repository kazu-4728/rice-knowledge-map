# Supabase監査（Issue #87 P2）

Supabaseの状態を定期的に確認するための手順。読み取りのみで、
Supabase側の設定・スキーマは一切変更しない。Issue #87本文の監査対象
（Security/Performance Advisor・RLS有効状態・migration適用状態・
`SECURITY DEFINER`関数の実行権限・Storage bucket/policy・旧テーブル
`fields`/`field_logs`の残存確認）をすべて含む。

対象プロジェクト: `rice-farm-app`（project_id: `uakcrkylonvgcmwuyyyk`）。

## 実行方法（Claude Codeセッションから）

データ取得自体にはSupabase管理者権限が必要なため、Supabase MCPツールを持つ
Claude Codeセッションから実行する。`scripts/supabase-audit-write.mjs`自体は
取得済みのJSONを整形して書き出すだけで、資格情報は一切扱わない。

1. 以下をSupabase MCPで取得する（project_id: `uakcrkylonvgcmwuyyyk`）
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
   このJSONファイルはリポジトリの外（例:
   `/tmp/claude/<セッションID>/scratchpad/`など）に置く。実環境のAdvisor・RLS・
   migration情報を含むため、リポジトリ配下に置いて誤ってコミットしないこと。

3. そのJSONを標準入力で渡して実行する
   ```
   cat /tmp/.../audit-input.json | node scripts/supabase-audit-write.mjs
   ```
   `supabase-audit/<タイムスタンプ>.json`と`supabase-audit/latest.json`
   （ともに`.gitignore`対象。運用中に増減する監査結果はリポジトリに置かない）
   に書き出され、要約がコンソールに表示される。

   このスクリプトはSupabaseに接続しない（接続にはSupabase管理者権限が必要で、
   その資格情報をリポジトリに書けないため）。そのため出力の鮮度は手順1を
   実行した直後に手順3まで通しで行うことでのみ担保される。古いJSONを
   使い回すと古い監査結果が最新として書き出されるので注意する。

## 出力形式

Issue #87本文で明示されている最小スキーマとして、出力の最上位に
`status`（`pass` | `warn` | `fail`）・`blocking`（配列）・`warnings`（配列）
を含む。判定基準（このスクリプト固有の解釈。Issue側に数値的な基準が
明文化されているわけではない）:

- `blocking`（`status: fail`）に入るもの:
  - Security Advisorの`level`が`ERROR`
  - RLSが無効なテーブル（`rls_enabled: false`）
  - `SECURITY DEFINER`関数が`anon`にEXECUTE許可されている
  - 旧テーブル`fields`/`field_logs`が存在する
  - 直近のローカルmigrationがSupabase側に未適用の可能性がある
- `warnings`（`blocking`が0件なら`status: warn`）に入るもの:
  - Security Advisorの`level`が`WARN`
  - RLSは有効だがポリシーが0件のテーブル
- 上記のいずれもなければ`status: pass`

Performance Advisorの警告は個別には`blocking`/`warnings`に含めない
（Issue #87本文の方針どおり、INFO相当は全てブロックせず`performance_advisors`
に生データとして残すのみ。対応要否は別途Issue #87 P5「Performance Advisor整理」
で判断する）。

## 見るべきポイント

- `status` / `blocking` / `warnings`: まずここを見る。空でなければ内容を確認する
- `migrations.newest_local_applied_remotely`:
  `false`の場合、直近でコミットしたローカルのmigrationファイルがSupabase側に
  未適用の可能性がある（`apply_migration`の適用忘れ）ので確認する。
  ファイル名の連番接頭辞（`0011_`等）を除いた名前で緩やかに一致判定している
  （`apply_migration`のname引数は接頭辞を省く運用が過去にあったため。
  `supabase/README.md`の0011の記録を参照）。
  それより古いmigrationの名前突き合わせは行わない
  （初期のmigrationは統合・改名されており、緩やかな一致でもノイズだらけになり
  実用にならないため。`migrations.remote_names` / `migrations.local_files`に
  生データを残しているので、必要なら目視で確認する）
- `security_definer_functions`: `roles_with_execute`に`anon`が含まれる関数がないか
- `storage`: bucketの`public`設定と、`object_policies`のroles（想定外に緩い
  ポリシーになっていないか）

## 実行タイミング

`get_advisors`のツール説明にある通り、DDL変更（migration適用）後は毎回実行することを推奨する。
