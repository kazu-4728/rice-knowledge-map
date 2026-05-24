# DECISIONS.md

このファイルは、重要な判断を後から確認できるように残すための記録です。

## D-001: 新規リポジトリで作る

- 状態: 決定
- 理由: 前回zipや既存DBに引っ張られると、今回の実画像マップ型アプリからズレるため。
- 判断: `rice-knowledge-map` を新規private repoとして作成。

## D-002: GitHubは早期に使う

- 状態: 決定
- 理由: GPT / Codex / Claude Code が同じ前提で作業する必要があるため。
- 判断: デプロイ直前ではなく、設計ファイル段階からGitHubに置く。

## D-003: Supabase既存環境は再利用候補

- 状態: 仮決定
- 理由: `rice-farm-app` は存在し、前回環境として使える可能性があるため。
- 注意: 既存 `fields` / `field_logs` は今回の本命設計には不足。削除せず、新MVPテーブル追加を優先する。

## D-004: 共有はGoogle認証 + group + invite URL

- 状態: 決定
- 理由: 固定家族だけに閉じると扱いづらい。作業者や近隣協力者も招待できる構造にするため。
- 注意: URLだけで未ログイン編集は不可。

## D-005: UIはダミーデータで先に視覚化

- 状態: 決定
- 理由: 前回は実装状態が見えず停止したため。今回は早期にVercel Previewまたはローカルスクショで確認する。

## D-006: ネガティブアクションは承認制

- 状態: 決定
- 理由: 削除、上書き、DB変更、本番公開、課金変更などは事故リスクが高いため。

## D-007: メインエージェントはGPT

- 状態: 決定
- 理由: GitHub/Supabase/Vercelの確認、設計、レビュー、タスク管理を一元化するため。
- 役割: ユーザーは確認・承認を主に行う。

## D-008: `docs/GLOSSARY.md` を正規名称の基準にする

- 状態: 決定
- 理由: 複数ドキュメント間でテーブル名、状態値、曖昧名がずれると実装ミスにつながるため。
- 判断: 実装、要件定義、アーキテクチャ、タスク、レビューでは `docs/GLOSSARY.md` の名称を優先する。

## D-009: 新MVP設計の田んぼテーブルは `farm_fields` にする

- 状態: 決定
- 理由: 既存Supabaseに前回試作の `fields` があり、新MVP設計で同名を使うと衝突するため。
- 判断: 既存 `fields` は削除せず、新MVP設計では `farm_fields` を使う。

## D-010: 状態値を用途別に固定する

- 状態: 決定
- 理由: 記録状態と固定ポイント状態を混在させると、UI表示、DB、RLS、検索条件がぶれるため。
- 判断: `records.status` は `open / needs_check / resolved / monitoring`、`field_points.status` は `normal / needs_check / issue / resolved` を使う。

## D-011: PR #4はクローズし、Desktop環境でT-010を再検証する

- 状態: 決定
- 理由: PR #4のCopilot指摘2点は反映済みだが、Codex実行環境では `npm install` が `403 Forbidden` で失敗し、`build/lint` の完了証拠を満たせないため。
- 判断: PR #4は追加修正なしでクローズし、Desktop環境で依存導入から `build/lint` 完走までを新規タスクとして実施する。

## D-012: コンテナとGitHubのズレ要因は「remote未設定 + proxy 403」

- 状態: 決定
- 理由: コンテナ内 `.git/config` に `origin` がなく、`git fetch origin` 実行時は `CONNECT tunnel failed, response 403` でGitHub接続も拒否されるため。`npm ping` も `https://registry.npmjs.org/-/ping` に対して `403` となり依存取得が失敗するため。
- 判断: この環境での再開前に、(1) `origin` と追跡ブランチ設定確認、(2) proxy許可ルールまたは認証トークン設定確認、(3) `npm ping` と `git fetch` が通ることを事前チェック項目にする。

## D-013: Cloud Codexではmain直接pushを行わず、引き継ぎPRを作成する

- 状態: 決定
- 理由: この環境では `origin` 設定がセッションで失われる場合があり、`git push` は認証前提で不安定なため。mainへ直接反映せず、作業ブランチからPRで引き継ぐ運用が安全。
- 判断: タスクリスト更新・作業ログ更新は作業ブランチでコミットし、Cloud CodexのPR作成機能でDesktop/Claude Codeへ共有する。main反映とmergeは別環境で実施する。

## D-014: public化後はorigin/main差分比較を実施し、PRに差分範囲を明記する

- 状態: 決定
- 理由: repo public化後に `origin` を再設定したところ `git fetch origin --prune` が成功し、Cloud Codexでも `origin/main` を取得できたため。引き継ぎ品質を上げるにはmainとの差分範囲を明記する必要があるため。
- 判断: 引き継ぎPRでは `git diff --name-only origin/main...HEAD` の結果を記録し、目的外ファイルが混在していないかをレビュー観点として固定する。

## D-015: origin再消失問題が解決するまで次タスクへ進まない

- 状態: 決定
- 理由: セットアップスクリプト再実行後も `.git/config` の `origin` が消失し、`git fetch origin --prune` が失敗するため。差分比較と引き継ぎの信頼性が落ちる。
- 判断: T-060 を `BLOCKED` とし、解決条件（セットアップ直後/新セッション直後の `origin` 永続 + 再設定不要でfetch成功）を満たすまで次タスクへ進まない。
