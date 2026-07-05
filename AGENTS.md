# AGENTS.md

## 共通ルール

- 作業開始時に `tasks/TASKS.md` の「現在の実行タスク」を読む。
- 現在タスクの目的、範囲、非対象、受入条件、PR単位は `tasks/TASKS.md` を正とする。
- 他のMarkdownに古い方針や矛盾する記述があっても、現在タスクの記述を優先する。
- 現在タスクにない設計判断を恒久ルールとして追加しない。判断不能な場合は実装前に確認する。
- 実装後は `npx tsc --noEmit`、`npm run lint`、`npm run build` を実行する。
- 秘密情報、APIキー、実環境の値をリポジトリへ書かない。
- Supabase migration、RLS、Storage設定、外部サービス設定、本番公開、PRマージはユーザー承認後のみ行う。
- PRは `tasks/TASKS.md` に定義された利用体験または導線の完了単位で作る。小作業ごとに分割しない。
