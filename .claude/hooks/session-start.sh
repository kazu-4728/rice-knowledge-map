#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# node_modulesがキャッシュ済みならスキップし、無い場合のみロックファイル通りにnpm ciで揃える
if [ -d node_modules ]; then
  exit 0
fi
# --ignore-scripts: レビュー前のブランチのpackage.jsonにpre/postinstall等が
# 仕込まれていても、セッション開始時に無条件で任意コード実行しないようにする
npm ci --ignore-scripts
