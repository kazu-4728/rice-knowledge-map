# CLAUDE.md

Claude Code向けの引き継ぎ文書です。

## プロジェクト概要

このプロジェクトは、実画像マップ型 稲作ナレッジ記録アプリです。

目的は、田んぼの現場知識を、実画像マップ、写真、音声、位置情報、コメント、対応状況で残すことです。

## 作業前に読むファイル

1. `AGENTS.md`
2. `docs/REQUIREMENTS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/NEGATIVE_ACTIONS.md`
5. `tasks/TASKS.md`
6. `tasks/DECISIONS.md`

## 作業ルール

- 未完了タスクをDONEにしない。
- mainへ直接作業しない。
- 1タスク1ブランチを原則にする。
- 重要操作は `docs/NEGATIVE_ACTIONS.md` に従う。
- 大きすぎる変更を避ける。
- 一時ファイルは残さない。
- UIタスクはスクショまたはPreview URLがない限りDONEにしない。

## 最初の作業候補

`tasks/TASKS.md` の Phase 1 から開始する。

最初に作るのは、DB接続ではなく、ダミーデータによる実画像マップUI。

## 重要な判断

アプリの中心は、実画像マップです。

作業日誌、売上管理、分析ダッシュボード、帳票機能を先に作らない。
