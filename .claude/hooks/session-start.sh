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
