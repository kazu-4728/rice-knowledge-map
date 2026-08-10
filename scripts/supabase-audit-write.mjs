/**
 * Supabase監査結果（Advisor/RLS/migration適用状態）を1つのJSONにまとめて書き出す。
 * データ取得自体はこのスクリプトでは行わない（実行にはSupabase管理者権限が必要なため）。
 * Claude CodeセッションがSupabase MCP（get_advisors/list_migrations/execute_sql、
 * いずれも読み取り専用）で取得した結果をこのスクリプトに標準入力で渡す想定。
 * 出力先の supabase-audit/ は.gitignore対象（運用中に増減するためリポジトリに置かない）。
 *
 * 使い方（詳細は docs/SUPABASE_AUDIT.md 参照）:
 *   cat audit-input.json | node scripts/supabase-audit-write.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const raw = readStdin().trim();
if (!raw) {
  console.error(
    "標準入力が空です。docs/SUPABASE_AUDIT.mdの手順でSupabase MCPの結果をJSONとして渡してください。"
  );
  process.exit(1);
}

let input;
try {
  input = JSON.parse(raw);
} catch (e) {
  console.error(`標準入力がJSONとして解釈できません: ${e.message}`);
  process.exit(1);
}

const REQUIRED_KEYS = ["security_lints", "performance_lints", "rls_policies", "migrations"];
const missing = REQUIRED_KEYS.filter((k) => !Array.isArray(input[k]));
if (missing.length > 0) {
  console.error(`不足しているキー（配列であること）: ${missing.join(", ")}`);
  process.exit(1);
}

const invalidMigrations = input.migrations.filter((m) => typeof m?.name !== "string");
if (invalidMigrations.length > 0) {
  console.error("migrationsの各要素にはstring型のnameが必要です（list_migrationsの結果をそのまま渡してください）");
  process.exit(1);
}

// ローカルのmigrationファイルと、Supabase側に適用済みのmigration名を突き合わせる。
// 初期のmigrationは統合・改名されており（例: 4つのremote migrationが
// ローカルでは1ファイルに集約されている等）、全件の名前突き合わせは
// 過去の履歴差分をノイズとして大量に検出してしまい実用にならない。
// そのため「直近でコミットされたローカルmigrationファイルが、
// Supabase側の適用済み一覧に存在するか」という、実際に事故につながりうる
// （＝ローカルに追加したmigrationの適用忘れ）ケースだけを機械的にチェックする。
//
// ただし`apply_migration`に渡すname引数はファイル名の連番接頭辞（例: "0011_"）を
// 省く運用が実際にあり（supabase/README.md参照。0011は remote側で
// "record_media_exif" として記録されている）、完全一致で比較すると
// 適用済みでも誤って「未適用」と判定してしまう。接頭辞を除いた名前どうしで
// 緩やかに一致判定する。
const stripSeqPrefix = (name) => name.replace(/^\d+[a-z]?_/, "");
const migrationsDir = path.join(root, "supabase", "migrations");
let localStems;
try {
  localStems = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.slice(0, -4))
    .sort();
} catch (e) {
  console.error(`${migrationsDir} を読み取れません: ${e.message}`);
  process.exit(1);
}
const remoteNames = input.migrations.map((m) => m.name).sort();
const newestLocalMigration = localStems.at(-1) ?? null;
const newestLocalAppliedRemotely = newestLocalMigration
  ? remoteNames.some((n) => stripSeqPrefix(n) === stripSeqPrefix(newestLocalMigration))
  : null;

function countByLevel(lints) {
  const counts = {};
  for (const lint of lints) {
    counts[lint.level] = (counts[lint.level] ?? 0) + 1;
  }
  return counts;
}

const report = {
  generated_at: new Date().toISOString(),
  security_advisors: {
    count_by_level: countByLevel(input.security_lints),
    lints: input.security_lints,
  },
  performance_advisors: {
    count_by_level: countByLevel(input.performance_lints),
    lints: input.performance_lints,
  },
  rls_policies: input.rls_policies,
  migrations: {
    remote_count: remoteNames.length,
    local_count: localStems.length,
    newest_local_migration: newestLocalMigration,
    newest_local_applied_remotely: newestLocalAppliedRemotely,
    remote_names: remoteNames,
    local_files: localStems,
  },
};

const outDir = path.join(root, "supabase-audit");
mkdirSync(outDir, { recursive: true });
const stamp = report.generated_at.replace(/[:.]/g, "-");
writeFileSync(path.join(outDir, `${stamp}.json`), JSON.stringify(report, null, 2));
writeFileSync(path.join(outDir, "latest.json"), JSON.stringify(report, null, 2));

console.log(`WROTE supabase-audit/${stamp}.json (supabase-audit/latest.jsonも更新)`);
console.log(`security advisors: ${JSON.stringify(report.security_advisors.count_by_level)}`);
console.log(`performance advisors: ${JSON.stringify(report.performance_advisors.count_by_level)}`);
console.log(`rls policies: ${report.rls_policies.length}件`);
const appliedLabel =
  newestLocalAppliedRemotely === null
    ? "N/A（ローカルにmigrationファイルなし）"
    : newestLocalAppliedRemotely
      ? "OK"
      : "未適用の可能性あり・要確認";
console.log(
  `migrations: remote=${report.migrations.remote_count} local=${report.migrations.local_count} ` +
    `最新ローカル(${newestLocalMigration})の適用=${appliedLabel}`
);
