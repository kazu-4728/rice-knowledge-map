# Supabase監査（Advisor / RLS / migration適用状態）

Issue #87 P2。Supabaseの状態を定期的に確認するための手順。読み取りのみで、
Supabase側の設定・スキーマは一切変更しない。

対象プロジェクト: `rice-farm-app`（project_id: `uakcrkylonvgcmwuyyyk`）。

## 実行方法（Claude Codeセッションから）

データ取得自体（Advisor警告・RLSポリシー・migration一覧）にはSupabase管理者権限が
必要なため、Supabase MCPツールを持つClaude Codeセッションから実行する。
`scripts/supabase-audit-write.mjs`自体は取得済みのJSONを整形して書き出すだけで、
資格情報は一切扱わない。

1. 以下をSupabase MCPで取得する（project_id: `uakcrkylonvgcmwuyyyk`）
   - `get_advisors`（type: `security`）→ `result.lints`
   - `get_advisors`（type: `performance`）→ `result.lints`
   - `list_migrations` → `migrations`
   - `execute_sql`で以下を実行 → 結果の配列
     ```sql
     select schemaname, tablename, policyname, permissive, roles, cmd
     from pg_policies
     where schemaname = 'public'
     order by tablename, policyname;
     ```

2. 取得した4つの結果を、以下の形のJSONにまとめる
   ```json
   {
     "security_lints": [...],
     "performance_lints": [...],
     "rls_policies": [...],
     "migrations": [...]
   }
   ```

3. そのJSONを標準入力で渡して実行する
   ```
   cat audit-input.json | node scripts/supabase-audit-write.mjs
   ```
   `supabase-audit/<タイムスタンプ>.json`と`supabase-audit/latest.json`
   （ともに`.gitignore`対象。運用中に増減する監査結果はリポジトリに置かない）
   に書き出され、要約がコンソールに表示される。

## 見るべきポイント

- `security_advisors.count_by_level` / `performance_advisors.count_by_level`:
  `WARN`以上が増えていないか
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

## 実行タイミング

`get_advisors`のツール説明にある通り、DDL変更（migration適用）後は毎回実行することを推奨する。
