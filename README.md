# rice-knowledge-map

実画像マップ型 稲作ナレッジ記録アプリ。

このリポジトリは、田んぼの暗黙知を実画像マップ上に固定し、写真・音声・位置情報・家族/作業グループコメント・対応状況として残すためのMVP開発用リポジトリです。

## 最重要方針

- 単なる農業日誌アプリにしない。
- 実画像マップを中心に設計する。
- 田んぼ、入水口、出水口、水路、注意箇所、異常箇所を地図上で扱う。
- 現場入力は写真・音声・位置情報を主にする。
- 共有はGoogle認証 + グループ + 招待URLを基本にする。
- ネガティブアクションは必ず事前承認を取る。

## 初期開発ルール

実装前に以下の文書を確認すること。

- `AGENTS.md`
- `CLAUDE.md`
- `docs/GLOSSARY.md`
- `docs/REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/NEGATIVE_ACTIONS.md`
- `docs/UI_REPRODUCTION_SPEC.md`
- `docs/REVIEW_CHECKLIST.md`
- `tasks/TASKS.md`
- `tasks/DECISIONS.md`

## 作業ルール

- `docs/GLOSSARY.md` の正規名称を優先する。
- 未完了タスクを完了扱いにしない。
- コミット前に `docs/REVIEW_CHECKLIST.md` を確認する。
- UIタスクはスクリーンショットまたはPreview URLなしでDONEにしない。
- Supabase、Vercel、main mergeなどの重要操作は承認後のみ行う。
