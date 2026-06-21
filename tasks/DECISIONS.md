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

## D-007: GPTの役割は言語化・整理・確認に限定する

- 状態: 更新
- 理由: GPTがGitHub APIで実装コードを直接作成した結果、検証不足のPRがmainへ入ったため。
- 判断: GPTは作りたいものの言語化、報告整理、タスク・判断の記録、方針確認を担当する。実装コード作成やPR作成を主担当にしない。

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

## D-011: repositoryはpublicで運用する

- 状態: 決定
- 理由: Cloud Codexがprivate repositoryを通常のgit remoteとして扱えない、またはコンテナ内に認証情報が渡らない可能性が高かったため。
- 判断: `kazu-4728/rice-knowledge-map` はpublic repositoryとして運用する。
- 注意: `.env`、APIキー、実在する田んぼの座標、家族情報、個人写真などはrepositoryに入れない。

## D-012: Cloud Codexはwrite担当にしない

- 状態: 決定
- 理由: Cloud Codexのコンテナ環境で `origin` が消える、push可否の挙動が不安定、意図しないPR/branchが複数作成される事象があったため。
- 判断: Cloud Codexは読み取り、調査、報告に限定する。push、PR作成、merge、branch作成を前提にしない。
- write担当: Claude Code（主担当）。Codex Desktopは補助。

## D-013: 不要Codexブランチは削除済みで、mainのみを正とする

- 状態: 決定
- 理由: `codex/address-copilot-feedback-in-pr-#4*` 系のブランチは、PR #4由来のコード差分とtasks差分が混ざり、mainとコンフリクトする状態だったため。
- 判断: remote branchは `main` のみを残す。PR #6 / #7 はclosed/unmergedで再利用しない。

## D-014: PR #4 / #5 はmerge済みだが、T-010は完了扱いにしない

- 状態: 決定
- 理由: PR #4 / #5 によりNext.js初期構成はmainに入っているが、`npm install` / `npm run build` / `npm run lint` の正常確認前にmergeされたため。
- 判断: T-010はDONEではなくBLOCKED。Claude Codeでmainを取得し、依存解決・build・lintを再検証する。

## D-015: Supabaseは現時点で削除・migrationなし

- 状態: 決定
- 理由: `rice-farm-app` は `ACTIVE_HEALTHY` で、既存 `fields` / `field_logs` が存在する。安全確認のためDB疎通のみ実行した。
- 判断: 削除、Storage変更、migration適用、RLS変更はまだ行わない。新MVPテーブル追加は別途承認後に行う。

## D-016: Phase 3 MVP migration draft assumptions

- 状態: draft
- 理由: Supabase Data API exposure changed for new projects on 2026-05-30。新規publicテーブルはexplicit grantsが必要で、RLSで行アクセスを制御する。
- 判断: 最初のmigrationセットは `docs/DATA_MODEL.md` に記載のコアMVPテーブルのみ作成する。既存テーブルは削除・改名・移行しない。

## D-017: CSSはTailwind CSSに一本化する

- 状態: 決定
- 理由: カスタムCSSが4ファイルに散在し、クラス名が独自すぎて再現性・保守性が低かった。Codex DesktopのUI実装が失敗した主因の一つ。
- 判断: Tailwind CSSを導入し、既存のカスタムCSSファイルは廃止する。className形式で統一することでエージェント間の実装一貫性を確保する。

## D-018: マップのポリゴン・ピンはMapLibre GeoJSONレイヤーとして描画する

- 状態: 決定
- 理由: CSSオーバーレイ方式は地図座標系と独立しており、ズーム・パンに追従できないため「実画像マップ」を実現できなかった。
- 判断: 田んぼポリゴンはGeoJSON fillレイヤー、固定ポイントピンはMapLibre Markerとして描画する。ダミーGeoJSONで実装し、後でSupabase接続に差し替える。

## D-019: src/ は設計通りに新規作成する

- 状態: 決定
- 理由: 既存の `src/features/preview/` 構造は本体と混在しており、カスタムCSSを全廃した時点でほぼ機能しなくなる。修正より新規の方が工数が少ない。
- 判断: 既存 `src/` を置き換え、`docs/ARCHITECTURE.md` のレイヤー構成通りに作成する。ダミーデータの型定義は再利用可能な部分を引き継ぐ。

## D-020: アーキテクチャ再設計フェーズはmainへ直接pushする

- 状態: 決定（期間限定）
- 理由: ブランチを切らずに設計ファイル・設定ファイルの整備を進める方がシンプルなため。ユーザー承認済み。
- 注意: アプリ実装（UI・DB）に入る際は再びブランチ運用に戻す。

## D-021: Claude CodeをWrite担当の主担当とする

- 状態: 決定
- 理由: Codex DesktopのUI実装が繰り返し失敗（CSS問題、build未検証でのPRマージ）したため。
- 判断: 実装・ファイル編集・push・PRはClaude Codeが担当する。Codex Desktopは調査・提案・レビュー補助に限定する。

## D-022: Windows環境でのpython3問題の対処

- 状態: 決定
- 理由: CockroachDB プラグインのPostToolUseフックが `python3` を使用するが、WindowsではApp Execution Aliasがストアスタブ（python3.exe）を優先しAppData\Roamingにアクセスできないため。
- 判断: Windowsの「アプリ実行エイリアス」設定でpython3をオフにする。これにより `python3` がPATH上の実Python（C:\Python313\python.exe等）に解決される。
- 注意: この問題はClaude Code固有。Codex DesktopはフックシステムがないためPythonを直接呼び出さず影響を受けない。

## D-023: 通常作業は別ブランチで行う

- 状態: 決定
- 理由: Claude Code と Codex Desktop が同じリポジトリで協力するため、main直作業では差分の追跡・レビュー・再開が難しくなるため。
- 判断: 今後の通常作業は、作業開始時に別ブランチを作成して進める。mainへの直接pushは、ユーザーがその作業について明示的に許可した場合だけ行う。
- 補足: 作業完了時は `tasks/TASKS.md` に作業ログ・残タスク・再開メモを残し、Claude Code / Codex Desktop のどちらでも続きから作業できる状態にする。
- 今回の例外: 2026-06-21 の Map Hub Phase 1 と作業ログ追記は、ユーザーが main 直pushを明示許可したため main へ直接反映する。
