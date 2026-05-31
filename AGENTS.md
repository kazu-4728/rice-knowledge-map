# AGENTS.md

このファイルは、GPT / Codex / Claude Code / その他AIエージェントが `rice-knowledge-map` で作業する際の最上位ルールです。

---

## 1. プロジェクト定義

このプロジェクトは「実画像マップ型 稲作ナレッジ記録アプリ」を作るためのものです。

単なる農業日誌アプリではありません。田んぼの暗黙知を、実画像マップ上に固定し、写真・音声・位置情報・コメント・対応状況として残します。

中心に置く対象は以下です。

- 田んぼ区画
- 入水口 / 出水口 / 水路
- 詰まりやすい場所
- 水が抜けにくい場所
- 雑草が出やすい場所
- 畦の崩れ
- 異常箇所
- 過去の対応履歴
- 家族/作業グループのコメント

---

## 2. 作業前に必ず読むファイル

1. `docs/GLOSSARY.md`
2. `docs/REQUIREMENTS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/NEGATIVE_ACTIONS.md`
6. `tasks/TASKS.md`
7. `tasks/DECISIONS.md`

---

## 3. エージェント別の役割と制限

| エージェント | 役割 | 制限 |
|---|---|---|
| Claude Code | 実装・ファイル編集・PR作成・main push | なし（主担当） |
| Codex Desktop | 調査・提案・レビュー補助 | push / PR作成 / branch作成を主担当にしない |
| GPT | 言語化・整理・判断記録・方針確認 | 実装コード作成・PR作成を主担当にしない |
| Cloud Codex | 読み取り・調査・報告のみ | write / push / PR / branch 作成禁止 |

---

## 4. ローカル環境セットアップ（Claude Code / Codex Desktop 共通）

### 前提
- Node.js 20 以上（`.nvmrc` 参照）
- Python 3.x（`python` コマンドで動作すること）

### 手順
```bash
# 1. リポジトリ取得後
npm install

# 2. 環境変数ファイルを作成
cp .env.example .env.local
# .env.local に Supabase の実際の値を記入する

# 3. 開発サーバー起動
npm run dev
```

### 環境変数の取得場所
| 変数 | 取得場所 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ダッシュボード → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 |

### Vercel にデプロイする場合
Vercel ダッシュボードの Environment Variables に同じ値を設定する。

---

## 5. Windows 環境での既知の問題（Claude Code）

### python3 コマンドのエイリアス問題

**状況:** Claude Code の PostToolUse フック（CockroachDB プラグイン由来）が `python3` を実行するが、Windows の「アプリ実行エイリアス」が `python3` を Microsoft Store のスタブ（`WindowsApps\python3.exe`）に向けるためエラーになる。

**実態:** Python 本体は `C:\Python313\python.exe` として正しくインストール済み。`python` コマンドは正常動作する。

**影響:** ファイルの書き込み自体は成功する（PostToolUse フックはファイル操作後に実行されるため）。エラーメッセージが表示されるが作業は継続できる。

**根本原因:** Windows App Execution Aliases が PATH より優先されるため、`C:\Python313\` が PATH にあっても `python3.exe` が存在しなければストアスタブが使われる。このプラグインのフックは `python3` を固定で使用しており変更できない。

**恒久対処:** `C:\Python313\python3.exe` として `python.exe` をコピーすることで解消できるが、管理者権限が必要。

---

## 6. 最重要ルール

- 実装前に要件定義書、用語集、タスクリストを確認する。
- `docs/GLOSSARY.md` の正規名称、状態値、使用しない曖昧名を優先する。
- タスクごとに担当を明確にする。
- 未完了タスクを完了扱いにしない。
- `DONE` は証拠がある場合のみ使用する。
- 作業中ファイルを散らかさない。
- 一時ファイルは `tmp/` に置き、使用後すぐ削除する。
- 大規模リファクタリングは禁止。
- 1PR / 1タスク / 1目的を原則にする。
- ルールを回避して「OK」としない。
- 重要操作は `docs/NEGATIVE_ACTIONS.md` に従い、承認後に行う。
- エラーが発生したら回避せず原因を追究する。

---

## 7. 作業単位

1タスクは1目的に限定する。UI、DB、認証、Storage、AI処理を一気に混ぜない。

状態は次のみ使う。

- TODO
- IN_PROGRESS
- BLOCKED
- REVIEW
- DONE

`DONE` には完了証拠が必要。

---

## 8. レビュー

実装後は最低限以下を記録する。

- 変更ファイル
- 実行した確認
- 未確認事項
- 次のタスク

UIタスクは、スクリーンショットまたはPreview URLなしでDONEにしない。
