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
- write担当: DesktopアプリまたはClaude Code。

## D-013: 不要Codexブランチは削除済みで、mainのみを正とする

- 状態: 決定
- 理由: `codex/address-copilot-feedback-in-pr-#4*` 系のブランチは、PR #4由来のコード差分とtasks差分が混ざり、mainとコンフリクトする状態だったため。
- 判断: remote branchは `main` のみを残す。PR #6 / #7 はclosed/unmergedで再利用しない。

## D-014: PR #4 / #5 はmerge済みだが、T-010は完了扱いにしない

- 状態: 決定
- 理由: PR #4 / #5 によりNext.js初期構成はmainに入っているが、`npm install` / `npm run build` / `npm run lint` の正常確認前にmergeされたため。
- 判断: T-010はDONEではなくBLOCKED。DesktopまたはClaude Codeでmainを取得し、依存解決・build・lintを再検証する。

## D-015: Supabaseは現時点で削除・migrationなし

- 状態: 決定
- 理由: `rice-farm-app` は `ACTIVE_HEALTHY` で、既存 `fields` / `field_logs` が存在する。安全確認のためDB疎通のみ実行した。
- 判断: 削除、Storage変更、migration適用、RLS変更はまだ行わない。新MVPテーブル追加は別途承認後に行う。

## D-016: Phase 3 MVP migration draft assumptions

- Status: draft
- Reason: Supabase Data API exposure changed for new projects on 2026-05-30; new public tables need explicit grants, and RLS must still control row access.
- Decision: The first migration set creates only the core MVP tables named in `docs/DATA_MODEL.md`: `profiles`, `farm_groups`, `farm_group_members`, `farm_group_invites`, `farm_fields`, `field_seasons`, `field_points`, `records`, `record_media`, `record_comments`, and `record_status_events`.
- Decision: Existing Supabase tables such as `fields` and `field_logs` are not deleted, renamed, or migrated in this task.
- Decision: `anon` receives schema usage only and no table privileges. `authenticated` receives explicit table grants, with row access gated by RLS policies. `service_role` receives explicit table grants for server-side operations.
- Decision: Storage bucket creation and Storage RLS are not included because `docs/NEGATIVE_ACTIONS.md` treats Storage changes as separate approval-required operations.
- Review note: T-031 can move to REVIEW with SQL files present. T-032/T-033/T-034 remain pending until RLS review, user approval, and actual migration application.
