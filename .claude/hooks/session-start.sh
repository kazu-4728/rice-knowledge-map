#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

if [ "${CLAUDE_CODE_REMOTE:-}" == "true" ]; then
  # node_modulesがキャッシュ済みならスキップし、無い場合のみロックファイル通りにnpm ciで揃える
  if [ ! -d node_modules ]; then
    # --ignore-scripts: レビュー前のブランチのpackage.jsonにpre/postinstall等が
    # 仕込まれていても、セッション開始時に無条件で任意コード実行しないようにする
    npm ci --ignore-scripts
  fi
fi

# harnessリポジトリ(kazu-4728/claude-harness)のSkillを、npx skills経由でGitHubから
# 直接取得する。マーケットプレイス登録やジャンクションに依存せず、ローカル/リモート
# (iPhoneのDispatch含む)Claude Codeセッションでは、このSessionStartフックの度に
# 同じSkillを取得できる（2026-08-29、プロジェクト個別導入では忘れるという指摘を
# 受けて追加）。
# 注意: これはClaude CodeのSessionStartフックなので、この行自体はClaude Code
# セッションでのみ実行される。「他エージェントにも同じSkillを配れる」とは、
# ローカルマシン上で動くCodexデスクトップアプリのように、Claude Codeと同じ
# ホームディレクトリを共有するエージェントが、この行の実行結果である
# ~/.agents/skills/を参照できる、という意味(実機で"universal"対応エージェントと
# して検出済み)。GitHub上のCloud Codex(PRレビュー等、独立サンドボックスで動く
# もの)のように、ホームディレクトリを共有しない実行環境には届かない
# (Codexレビュー指摘、2026-08-29。オーナーの主な利用形態はデスクトップアプリの
# ため、Cloud Codex向けの追加対応は行っていない)。
# - CLIバージョンとSkill取得元を固定し、セッション開始時に外部レジストリ/
#   リポジトリの最新版を無条件に実行しない(サプライチェーン/再現性対策、
#   Copilot・Codexレビュー指摘)。取得元はclaude-harnessの特定コミットを指す
#   固定ブランチ(pin/session-knowledge-search-v1)。更新する場合はharness側で
#   新しい固定ブランチを作り、ここの参照を明示的に張り替える。
# - ネットワーク不調等で失敗してもセッション開始自体は止めないが、握りつぶさず
#   stderrに警告を出す(Copilotレビュー指摘)。タイムアウトを明示し、接続が
#   即座にエラーを返さない環境でSessionStart全体が無期限に止まらないようにする
#   (Codexレビュー指摘)。
if ! timeout 45s npx --yes skills@1.5.23 add "kazu-4728/claude-harness#pin/session-knowledge-search-v1" --skill session-knowledge-search --agent '*' -g -y >&2; then
  echo "[session-start] 警告: npx skills addによるharness Skill取得に失敗またはタイムアウトしました。セッションは続行します。" >&2
fi

# CLAUDE.mdの運用ルールはローカル/Remoteどちらでも「言われたら読む」文章に留まり
# 確実性が低かったため、hookで機械的に注入する（2026-08-16、Remoteで指示なしに
# profile.md参照/セッション記録が行われなかった件を受けて追加）。
cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "===== このリポジトリの運用ルール（毎回自動注入・CLAUDE.mdの要約） =====\n- 作業前に、Google Driveの read_file_content で fileId 1ROTZ9GHg2UBE_aOq_YF466JfiryKFxyh (ClaudeKnowledge/profile.md) を読み、ユーザーの好み・作業スタイルを踏まえて対応すること（書き換えない）。\n- git push した後は、その結果のCI実行を確認してから完了とすること（gh run watch 等）。失敗していればこのセッション内で対処すること。\n- セッションの区切り、または作業がまとまった時点で、チャット内容の要約をGoogle Driveフォルダ 1Lby7XlZ9QPTQZpkw-3Zu0St-wk13mTrx に保存すること（生ログではなく要約。git add/commitはしない）。詳細な書式はCLAUDE.mdを参照。"
  }
}
JSON
