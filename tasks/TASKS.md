# TASKS.md

いま何が動いていて、何が残っているかを一目で分かるようにする管理表です。
状態は `TODO / IN_PROGRESS / DONE` のみ。`DONE` には証拠（PR・実機確認）が必要です。

本番URL: https://rice-knowledge-map.vercel.app

---

## 1. 完成して動いているもの（main マージ済み）

| ID | 内容 | 証拠 |
|---|---|---|
| — | 全画面UI（マップ/記録一覧/記録詳細/保存前確認/田んぼ一覧/メニュー/ホーム）+ PWA | PR #10 |
| T-030〜T-033 | Supabase スキーマ（11テーブル・RLS・Storage・招待 RPC）、migration 0001〜0003 適用済み | PR #11 |
| — | 認証（メールリンクログイン）・マップの Supabase 読込・田んぼ保存 | PR #12、実機確認済み 2026-06-11 |
| — | 招待 URL の発行・引き換え（/invite） | PR #12/#13 |
| — | Vercel 本番公開・リポジトリからのキー排除（キーはローテーション済み） | PR #13 |
| — | なぞり描き登録・GPS 現在地・田んぼの編集（名前変更/描き直し/削除）・サンプル排除 | PR #14 |
| Phase A | /login ページ・ヘッダーのログイン導線・飾り UI 整理・記録一覧の検索/絞り込み | PR #15 |
| Phase B | 写真記録の保存（撮影→圧縮→Storage→一覧に実写真サムネ表示・保存前確認・下書き復元） | PR #16 |
| Phase B2 | 音声メモの録音・保存（MediaRecorder・Audio Storage・再生対応） | PR #17（705eb3e） |
| Phase C (T-034b) | 記録詳細の実データ化（loadRecordDetail、実記録タップで詳細表示） | PR #18（62f0554） |
| Phase C (T-045) | 記録へのコメントと「対応済みにする」 | PR #18（62f0554） |
| Phase D (T-043) | ピン（入水口/出水口/異常箇所）の登録・編集・削除 | PR #19（db4a636）+ PR #20（b32a750） |
| Phase C/E (T-049) | ピン絞り込み・田んぼ一覧・ホーム最近の記録・メニュー件数の実データ化 | PR #21（a8f34a3） |
| UX PR-A | Migration 0004（farm_fields.photo_path + group_site_content テーブル） | PR #22（1961a50） |
| UX PR-B | ヒーローセクション・アプリ説明・/guide・サイト設定 UI（管理者） | PR #23（8ea32cc） |
| UX PR-C | 音声入力（Web Speech API）を全テキスト欄 6 箇所に追加 | PR #24（7e0f366） |
| UX PR-D | 田んぼ実写カバー写真・田んぼ→記録導線・point_id 連携 | PR #25（e3d5258） |
| — | Google ログイン設定（Google Cloud OAuth + Supabase + Vercel 環境変数） | 実機ログイン成功確認済み 2026-06-12 |
| — | PR #25 post-merge 修正（fields/page.tsx の groupId 参照修正） | PR #26（main マージ済み） |
| UX リデザイン | スプラッシュページ（/）・/home 田んぼ一覧主役化・/fields/[id] 詳細ページ新設・緑グラデ背景・戻るボタン・折りたたみ（使い方/最近の記録）・ヒーロー画像を田んぼ写真に変更 | PR #27（main マージ済み） |
| — | Codex/Copilot レビュー対応（pointType URL 連携・groupId undefined 修正・pointId クリア修正） | PR #28（main マージ済み） |
| UX作り込み/レビュー解消 | トップを王道Webランディング化（ヒーロー＋機能＋CTA・大胆Ken Burns＋スクロールパララックス）／「未対応」判定をpointTypeベースに統一／export・田んぼ詳細・未対応導線を全件ページング取得／カレンダーを単一グループに統一＋viewer書込抑止／RemotePhotoキャッシュ透明化修正 ほかCodex指摘14点 | PR #31（8bde66d・squashマージ済み 2026-06-14） |
| Phase F | 記録詳細→「同じ田んぼ」追記導線（field/point/pointTypeをクエリ引き継ぎ）／田んぼ名・地点バッジLink化／戻るボタンrouter.back()化／マップ田んぼポリゴン→「詳細を見る」CTA／記録削除（deleteRecord+確認モーダル・記録者本人 OR owner のみ）| PR #33（5d74265・squashマージ済み 2026-06-15） |
| レスポンシブ対応（案A） | AppShell/各画面の最外コンテナを段階的に拡張（max-w-md → md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 等）／カード一覧の md:grid-cols-2 lg:grid-cols-3 化／BottomNav・ボトムシート群を中央寄せキャップ／PWA Service Worker キャッシュ名 v2 bump | PR #35（0cf3e55・squashマージ済み 2026-06-16） |
| Codex 指摘対応 | PR #35 の Codex P2 指摘：`<AppShell fullBleed>`（`/map`）にも max-width が効いて1920pxで左右にグレー帯 → fullBleed のとき `w-full` で全幅化 | PR #36（e7e2c07・squashマージ済み 2026-06-16） |
| Map Hub Phase 1 | `/map` を初期導線の中心に変更。実画像マップ全画面化、田んぼ一覧ボトムシート、田んぼ選択/登録CTA、折りたたみFAB、田んぼ詳細/ピン詳細の導線整理 | main直push（22fd0c5・2026-06-21） |
| UI/UXリデザイン | BottomNav・FAB廃止→MenuDrawer（モバイル）＋SideNav（PC lg以上）の2系統ナビ。DrawerContext共有・AppShellハンバーガー・navItems.ts一元化。`/home`をステータスダッシュボードに再定義。PCマップ横にMapDetailPanel常時表示。signOutで`/login`へページ遷移。Codex 3ラウンド計11件P2すべて対応 | PR #38（77ae814・squashマージ済み 2026-06-23） |
| 田んぼ選択UI作り直し | 「田んぼを探す」→「田んぼを選ぶ」へ。検索欄削除・固定高さ一覧スクロール・previewField/selectedField分離（スクロールプレビュー＋タップ選択）・シート閉じ時の不具合修正（メニュー消失・地図幅崩れ・viewport resize対応） | PR #39（7f42d42・squashマージ済み 2026-06-24） |
| マップ操作モデル作り直し＋iOS修正 | discriminated union `Mode` で単一モード state machine 化。2段階田んぼ登録（placing→drawing）。iOS Safari 入力ズーム修正（input 16px化＋blur-before-action）。描画中ブラウザジェスチャー漏れ防止。ピン誤タップ防止（`activatePoint` ガード）。トースト積み重ね復元。Codex 5件中3件対応・2件P3見送り | PR #40（75d4016・squashマージ済み 2026-06-25） |
| 確認・記録・地図回帰の導線統合 | ホーム「要注意の田んぼ」セクション追加。田んぼ詳細のポイント導線をマップ表示に変更。記録詳細に「マップで見る」リンク追加。マップURLパラメータ対応（`?field=&point=&lat=&lng=`）。状態ラベル統一（正常/要確認/異常/解決済み）。returnToに田んぼ・ピンコンテキスト保持。GPSフォールバック優先（point→lat/lng→field） | PR #48（b3cc32c・squashマージ済み 2026-06-28） |
| 記録一覧・田んぼ一覧の状態表示強化 | 記録一覧: field_points JOIN でポイント実名表示、全8種のポイント種別ラベル（入水口〜その他）、全ステータスバッジ、未対応リング。田んぼ一覧: 異常/要確認の件数バッジ、最終記録日/記録なしの常時表示、軽量ページングクエリで100件制限解消。toPointType()でfield_points.point_typeを優先 | PR #50（0df7b03・squashマージ済み 2026-06-29） |
| UI/UX大規模改修 Step1-2 + 派生機能（T-059一部） | shadcn/ui基盤導入（Button/Card/Badge/Drawer）。マップにMapSummarySheet（ダッシュボード型BottomSheet）追加、FAB刷新（丸型・右下）。田んぼ輪郭描画の概算面積を自動計算（ズーム非依存の実距離基準サンプリング）、表示単位（ha/反/㎡）タップ切替。コメントをLINE風吹き出しUIに変更。AppShellヘッダーを白→濃い緑（bg-green-800）に統一し全画面に反映 | PR #51（21bac32・squashマージ済み 2026-07-01） |
| 田んぼ詳細ページのタブ構造化（T-059 Step3の一部） | `/fields/[id]` を概要/記録/写真の3タブに再編成（ARIA Tabsパターン準拠）。記録タブは写真主体のタイムラインカード（shadcn Card/Badge）+ 未対応/要確認バッジ + 20件ずつの「もっと見る」ページング。写真タブは全件ギャラリー化。二次導線の「記録一覧」リンクを削除（記録タブが代替）。Copilot 2件・Codex 2件の指摘すべて対応 | PR #52（11d5c23・squashマージ済み 2026-07-01） |
| 田んぼOS PR-1「第一印象の反転」（T-059） | ①「今日の田んぼ」オープニングストーリー（1日1回・天気/農事暦/気になる場所/最新記録のフルスクリーンカード→地図着地。`?story=1`で強制表示） ②ダーク管制室マップ（検索ピル・凡例・コントロール・シート群をダークガラス統一、ポリゴンをフィールド色の発光縁取りに） ③ガイドUX（ネクストアクションカード・大型タイポ信号色サマリー・ラベル付きFAB3択「写真で記録/話して記録/異常を報告」） ④ナビ4系統化（マップ/記録/管理/設定+その他） ⑤ランディングをアグリノート型リッチLPに刷新（ダークヒーロー+実UIスマホモックアップ+課題提起→3空間紹介→3ステップ→CTA。外部画像に依存しない構造・/menu/siteの画像差し替えは維持） ⑥基盤: motion導入・農事暦エンジン（season.ts）・StatusBadge/Skeleton/MemberAvatar | PR #53（27c9fbb・squashマージ済み 2026-07-02） |
| 田んぼOS PR-2「トーク空間」（T-059） | 統合トークルーム `/talk` 新設（全田んぼの記録+コメントを1本の時系列タイムラインに統合。LINE風UI・田んぼチップ絞り込み・固定入力バー・「以前のやり取りを見る」ページング・自分のコメント/雑談メッセージの削除）。音声トランシーバー（長押しで即録音→離すとGPSで田んぼ自動判定→自動送信。入口はトーク入力バーのマイクとマップFAB長押し400ms）。ナビ「記録」→「トーク」表記確定。データ層 `src/lib/data/talk.ts` 新規（records+record_commentsの横断取得・安全境界マージページング） | PR #54（117b7e3・squashマージ済み 2026-07-03） |
| 田んぼOS PR-3「管理空間+農事暦+定点観測」（T-059） | `getSeasonTimeline()` 追加（年間9フェーズの通年表示）+ `SeasonTimelineBar`新規（タップでヒント表示）。`/home`に季節ヒーローカード+信号色統計グリッド追加。`/fields`一覧をカバー写真主体の大判カードに刷新。`/records`一覧をshadcn Card/Badgeのメディアカードに刷新。田んぼ詳細「定点観測」タブ新設（ピン単位グルーピング+`PhotoCompareSlider`によるBefore/After比較+時系列レンジスライダー）。lucide-react移行（31/43アイコン）・shadcn Tabs/AlertDialog/DropdownMenu追加・`loadOpenIssueRecords()`の件数集計をSupabase `count:"exact"`で正確化 | PR #55（4fc51c6・squashマージ済み 2026-07-05） |

---

## 2. 修正済み・main へのマージ待ち

現在なし。すべて main マージ済み。

---

## 3. 残りの開発

| ID | 状態 | 内容 |
|---|---|---|
| PR-E | DONE | ヒーロー演出強化（Ken Burns・進捗バー・時間差フェード）・使い方全表示 | PR #29（mainマージ済み） |
| PR-F | DONE | 全ページ戻るボタン（BackButton/backDynamic）・FAB・トースト通知システム | PR #29（mainマージ済み） |
| PR-G | DONE | ヘッダー天気予報（現在地GPS→気象庁API・1週間ドロワー・SVG天気アイコン） | PR #29（mainマージ済み） |
| PR-H | DONE | カレンダー家族共有（migration 0005適用・月表示・予定CRUD・BottomNavに「予定」タブ） | PR #29（mainマージ済み） |
| PR-I | DONE | 未対応異常バナー・記録エクスポート（年次/田んぼ別PDF）・メニューリンク追加 | PR #29（mainマージ済み） |
| T-048 | TODO | 記録の AI 整理・要約（任意機能） |
| T-051 | DONE | 記録詳細→マップで見る。地点が有効なら地点、地点未紐付けまたは見つからない場合はGPS座標、最後に田んぼへフォールバック | PR #48（b3cc32c） |
| T-052 | TODO | コメントの編集・削除。PR #51でコメントUIをLINE風吹き出しに刷新した際、ダミーだった`IconMore`ボタン自体を削除済み（吹き出しUIに「⋮」を置く場所がなくなったため）。実装時は長押し/スワイプ等LINE的な操作導線を再検討。RLSは `record_comments_update/delete = user_id = auth.uid()` で本人のみ許可済み |
| T-053 | TODO | 複数グループの本格対応（loadSchedules 横断・田んぼ/予定ごとのロール）。現状はアクティブグループに統一中 |
| T-054 | TODO | 記録の soft-delete（`deleted_at` カラム＋RLS）。現状は hard-delete。家族3〜4人運用では復元ニーズが薄く保留 |
| T-055 | TODO | `/home` と `/map` の情報設計を再整理。マップを主導線にしたため、ホームが重複導線にならないよう役割を決める |
| T-056 | TODO | `/map` ボトムシートの未対応件数・最終記録日を、現在のピン由来集計から実記録（records）由来に寄せる |
| T-057 | TODO | 実機で `/map` のボトムシート、FAB、地図コントロール、トーストの重なりを確認し、必要なら高さ/位置/ドラッグ開閉を調整する |
| T-058 | TODO | 本番データで田んぼポリゴンが「なぞり描き登録」の形状として表示されるか確認。今回の不整形ポリゴン修正はダミーデータ表示の見た目調整 |
| T-059 | IN_PROGRESS | **UI/UX 大規模改修**。Step1-3はPR #51/#52で完了したが「ほとんど変わっていない」と却下→ **全面再構成プラン「田んぼOS」承認済み（2026-07-02作業ログ参照）**。PR-1（第一印象の反転+ランディング刷新）はPR #53、PR-2（統合トークルーム `/talk`+音声トランシーバー）はPR #54、PR-3（管理空間+農事暦+定点観測）はPR #55でマージ済み。残り: PR-4（仕上げ・コーチマーク・実写化） |

---

## 4. ユーザーにしかできない作業

| ID | 状態 | 内容 |
|---|---|---|
| U-001 | DONE | Migration 0004 を Supabase 本番に apply（farm_fields.photo_path + group_site_content）。2026-06-13 MCP apply_migration で適用確認済み |
| U-002 | TODO | 本番で実機確認: 写真記録・音声メモの保存→一覧表示 / 田んぼカバー写真のアップロード / 音声入力ボタン |
| U-005 | TODO | 本番で実機確認（PR #31）: トップ`/`のヒーロー（実写真背景＋ズーム/パン＋スクロールパララックス）／ホーム「未対応の異常」バナーが正しい件数（通常記録で誤表示しない）／記録一覧の「未対応」バッジが異常記録のみ／田んぼ詳細の状態サマリー／exportの年フィルタ・月見出し／カレンダー（viewer 家族には追加/完了/削除が出ないこと） |
| U-003 | DONE | Google ログイン設定（OAuth + Supabase + Vercel 環境変数）。2026-06-12 実機ログイン成功確認 |
| U-004 | TODO | （任意）Supabase レガシー anon キーの無効化（API Keys ページ） |
| U-006 | TODO | 本番で実機確認（PR #33・Phase F）: ①記録詳細「追記する」が同じ田んぼ・ピンに紐づく（隣接圃場の事故防止）／②田んぼ名バッジ→`/fields/[id]`、地点バッジ→`/records?point=...`／③戻るボタンが田んぼ詳細→記録詳細の流れで田んぼに戻る／④マップ田んぼポリゴンタップ→「この田んぼの詳細を見る」CTA／⑤自分の記録の⋮メニュー→削除→田んぼ詳細に戻り対象が消える／⑥他の家族（editor）の記録には⋮が出ない／⑦owner なら他人の記録も削除可 |
| U-007 | TODO | 本番で実機確認（PR #35/#36・レスポンシブ）: ①PC幅（1920px等）でトップ`/`が全幅ヒーロー＋Features 3カラム／②`/home`・`/fields`・`/records` が `max-w-6xl` 中央寄せでカードが2〜3列／③`/map` が**全幅**でマップが広がる（左右にグレー帯なし）／④ボトムシート群（マップのピン追加・田んぼ選択カード）が中央寄せ／⑤タブレット幅（768〜1024px）で2列レイアウト／⑥モバイルで従来通り1列（リグレッションなし）／⑦ログイン後のアドレスバーURLが想定通り（リダイレクト無し）／⑧ログイン後も各画面の幅が維持されているか（スマホ幅に戻らない） |
| U-008 | TODO | 本番で実機確認（Map Hub Phase 1）: ①`/map` 初期表示でフッターなし・田んぼ一覧ボトムシートが出る／②田んぼタップで該当田んぼへ移動し詳細シートになる／③「一覧にない田んぼを登録する」からなぞり描き登録へ進める／④FABは初期状態で写真/音声/ピン追加が露出せず、カテゴリを開いた時だけ表示される／⑤田んぼ詳細→ピン追加で田んぼが初期選択される |
| U-009 | TODO | 本番で実機確認（PR #38・UI/UXリデザイン）: ①モバイルでハンバーガー→MenuDrawerが開き全ナビ項目が表示される／②PC（lg以上）で左SideNavが常時表示される／③`/map` でPCの場合は右側にMapDetailPanelが出る／④ログアウト→`/login` に遷移しReact状態がクリアされる／⑤未ログイン時に`/home`で「ログインすると田んぼ情報が表示されます」と出る（「未登録」ではない）／⑥印刷時にSideNav/MenuDrawer/ヘッダーが消えコンテンツのみ印刷される／⑦戻るボタン付きページでもハンバーガーが表示される（右寄せ）／⑧記録一覧が空の時にモード別メッセージ（読み込み中/未ログイン/エラー/空）が適切に表示される |
| U-010 | TODO | 本番で実機確認（PR #39・田んぼ選択UI作り直し）: ①「田んぼを選ぶ」ボタンが表示される／②下部シートの見出しが「登録田んぼ（N件）」になっている／③検索欄がない／④一覧だけが縦スクロールできる（少数・多数の両方）／⑤スクロール中に中央付近の田んぼが地図上でアンバー色プレビューされる／⑥スクロール中に地図が過剰に飛び回らない／⑦一覧タップで正式選択→詳細シート表示・地図flyTo／⑧選ばず閉じても通常マップUI（メニュー＋ボタン）へ確実に戻る／⑨シート開閉後に地図の幅・高さ・操作性が崩れない |
| U-011 | DONE | iPhone実機確認（マップ操作モデル作り直し・PR #40）: 全項目 OK（2026-06-26実機確認済み）。描画中ブラウザジェスチャー漏れ修正・保存後UIの表示倍率崩れ修正・2段階田んぼ登録・場所合わせ直し含む全導線を実機で確認。 |

---

## 作業ログ

### 2026-07-05 — 田んぼOS PR-3「管理空間+農事暦+定点観測」実装・マージ（PR #55・squashマージ 4fc51c6・ブランチ claude/resume-md-reading-ie0ngu）

**実装内容:** 上記「完成して動いているもの」の行を参照（農事暦シーズンエンジンの通年表示化・`/home`季節ヒーロー+統計グリッド・`/fields`/`/records`のカード刷新・田んぼ詳細「定点観測」タブ新設）。

**オーナーからの繰り返しフィードバック（重要）:** 「管理画面が少し変わっただけで他に変化を感じられない」「カードコンポーネントなどは使用しないのか？」「アクセントカラーがなかったためカードコンポーネントが分かりにくかった」「ライブラリを使って改善できるUIは全てライブラリを使用してください。今の状態でも全く使う気にならない」との指摘が複数回続いた。これを受けて、当初の管理画面の部分修正に留めず、`/fields`・`/records`一覧をカバー写真/写真主体の大判カードへ全面刷新し、`Card`コンポーネントに信号色`accent`プロップ（左ボーダー色でnormal/needs_check/issue/resolved/monitoringを表現）を追加。さらに未使用だった`lucide-react`を実際に導入（43アイコン中31個を移行、フィル系6個+`LogoRice`は独自SVG形状が必要なため据え置き）、`@radix-ui/react-alert-dialog`・`@radix-ui/react-dropdown-menu`・`@radix-ui/react-tabs`を新規導入し、`/records/[id]`の手作りドロップダウン/確認モーダルや`FieldDetailScreen`の手作りタブをRadix実装に置き換えた。

**レビュー対応:**
- self-reviewエージェント指摘4件 → 修正済み（642e3d2）
- Copilot 1周目5件 → 修正済み（010e04d）、全スレッドResolve
- Codex 3件（P2、記録数カウントの取りこぼし・観測タブのクラッシュ・プレースホルダー混入） → 修正済み（49fcc13）、全スレッドResolve
- オーナーの`@codex review`コメントを受けた再レビュー・Copilot 2周目3件（`season.ts`のうるう年またぎで年間進行度が1日ズレる×2箇所、`PhotoCompareSlider`にキーボード/ARIA slider操作がない）→ 修正済み（8788eed）、全スレッドResolve

**検証結果:** 各修正コミットで`npx tsc --noEmit`/`npm run lint`/`npm run build`全パス（全20ページ）。Playwrightで季節ヒーロー・統計グリッド・新カードUI・定点観測タブの比較スライダー（ドラッグ+キーボード操作）を画面キャプチャ/操作確認。うるう年またぎの年間進行度計算はNode.jsスクリプトで日数を直接検証。

**次セッションへの持ち越し:** PR-4（仕上げ・コーチマーク・実写化）に進む。PC対応は依然未着手（必ず後で着手）。

### 2026-07-03 — 田んぼOS PR-2「トーク空間」実装・マージ（PR #54・squashマージ 117b7e3・ブランチ claude/ui-ux-redesign-components-h17a7k）

**実装内容:** 上記「完成して動いているもの」の行を参照（統合トークルーム `/talk`・音声トランシーバー・ナビ「トーク」表記確定・`src/lib/data/talk.ts`新規）。

**セルフレビュー体制の導入:** Copilotレビューが今期クォーター切れ・Codexレビューはdraft解除/`@codex review`コメント時のみ起動という制約下で、コンテキスト消費を抑えるため `.claude/agents/self-review.md`（読み取り専用サブエージェント、mainとの差分から実害バグ・実機の落とし穴・規約違反を洗い出す）を新設し、各修正後に活用。

**実機バグ2件の修正（実装中盤・ユーザー実機報告）:**
- トークルームでマイクボタンを録音せずに離すとオーバーレイから戻れず、スマホの戻るボタンでログイン画面に戻ったりトークルームがサイドバーから消えたりする → `TransceiverOverlay`に明示的な「送信する」/「キャンセル」ボタンを追加、bfcache復元時の`pageshow`ハンドラを追加
- トーク導線が分かりにくい・コメント削除がない・返信先が不明・履歴管理が不明瞭 → マップに常設「トーク」ボタン追加、コメント/雑談メッセージの削除機能追加、コメントに引用表示（↩ 田んぼ名・記録タイトル）追加、日付セパレータ+ページングで履歴を明確化

**Codexレビュー4ラウンド（Copilot含め計18件）:**
1周目（Copilot 4件）: マージページングのデータ欠落・画像/音声署名URLエラー無視2件・空メッセージ許可 → 全て対応
2周目（Codex 4件）: 未対応バッジが通常記録にも表示・マイク許可待ち中の解放でストリームが握られたまま・MediaRecorder構築失敗時のストリームリーク・fieldChipのネストボタン → 全て対応（セルフレビューで解決済み異常のバッジ退行・キーボード二重発火も追加検出）
3周目（Codex 4件、P1×1）: マイク許可待ち中の解放が検知されない（pointerupフォールバックが"recording"状態限定）・チップ連続切替の競合・マージページングでのデータ恒久欠落・bfcache復元時の古いセッション参照 → 全て対応（セルフレビューで`loadOlder`の同種競合・送信中のオーバーレイ早期終了も追加検出）
4周目（Codex 4件、複数グループ対応関連）: 複数グループ所属ユーザーが最初のグループ以外の田んぼでトーク送信/音声記録すると`records.group_id must match farm_fields.group_id`整合性トリガーに弾かれる（2件）・トーク雑談メッセージ/音声メモが既定値`status='open'`のまま保存され記録詳細で「未対応」と誤表示（2件）→ `resolveGroupIdForField()`新設で対応、`RecordDraft`にオプションの`status`追加

**検証:** 各コミットで`npx tsc --noEmit`/`npm run lint`/`npm run build`全パス。Vercel Preview Ready確認済み。全18件のレビュースレッド返信・Resolve済み。ユーザー実機確認済み（2026-07-03、マージ判断をもって完了扱い）。

**次セッションへの持ち越し:** PR-3（管理空間+農事暦+定点観測）に進む。

### 2026-07-02 — 全面再構成プラン「田んぼOS」承認 + PR-1「第一印象の反転」実装・マージ（PR #53・squashマージ 27c9fbb・ブランチ claude/ui-ux-redesign-components-h17a7k）

**プラン承認の経緯:** 前回提示のPR-A〜D案は「既存サイトの小変更に見える」として却下。「開いた瞬間から違うアプリに見える」を目標に「田んぼOS」プランを再提案し承認された。

**承認済みプランの要点:**
- コンセプト: 記録ツールではなく「開くたびに田んぼの"今"が語りかけてくるOS」。Googleマップ（空間）× LINE（会話）× アグリノート（管理）+ Instagramストーリー（没入）+ 稲作暦（季節文脈）
- 6つの変革レイヤー: ①今日の田んぼストーリー ②ダーク管制室マップ ③音声トランシーバーFAB ④農事暦シーズンエンジン ⑤定点観測タイムマシン ⑥次にやることガイドUX
- **トークは家族の統合トークルーム1本が主役**（専用ページ `/talk` を新設。田んぼ詳細ごとにルームは作らない。メッセージに田んぼチップ・チップで絞り込み）← オーナー指示で確定
- **画像はリポジトリに置かない**。実写は Supabase Storage 公開バケット `app-assets`（作成前に承認）or ユーザーの `/menu/site` アップロードで配信
- PR分割: PR-1 第一印象の反転（マージ済み）／PR-2 トーク空間／PR-3 管理空間+シーズン／PR-4 仕上げ
- 制約: MapCanvas内部は触らない（スタイル定数のみ）・DBスキーマ変更なし・モバイル優先（PC対応は後で必ず）・BottomTabBar再導入しない

**PR #53 実装内容:** 上記「完成して動いているもの」の行を参照（ストーリー/ダークマップ/ガイドUX/ナビ4系統/リッチLP/基盤）。

**レビュー対応:** Copilot 5件（story=1判定の厳密化・reduced-motion対応・農事暦のDST/うるう年・docs同梱指摘）→ 4件修正（2d06cd5）+docs除外（6ed5ff0）。Codex 4件（異常報告CTAのpointTypeプリセット不発・記録のみ異常の集計漏れ・ストーリーの非同期カード差し込みで現在位置ズレ・docs同梱）→ 3件修正（960869e）+docs除外。Codex再レビュー（853ed96）は指摘ゼロ。全スレッド返信・Resolve済み。

**マージ後に確定した運用・方針メモ:**
- ナビの「トーク」表記は `/talk` 実装（PR-2）までは「記録」とする（記録一覧をトークと呼ぶと誤解を生むため）
- 作業ログ（TASKS.md/CLAUDE.md）はマージ後に main へ直接push。**PR中は含めない**（オーナー指示で再確認）
- Vercelのwebhook取りこぼしでプレビューが走らないことがある → 空コミットpushで再トリガーできる（6ed5ff0で発生、5c45c45で復旧）
- ランディングの既定Unsplash画像は壊れている可能性が高く、LP刷新で外部画像に依存しない構造に変更済み。確実な実写化はユーザー写真のアップロード or `app-assets` バケット作成（未着手・承認待ち）

**検証:** 各コミットで tsc/lint/build 全パス + Playwrightスクリーンショット（ストーリー・ダークマップ・シート・FABメニュー・LP モバイル/PC）。実機確認はオーナーがプレビューURLで実施済み（マージ判断をもって完了扱い）。

### 2026-07-01 — 田んぼ詳細ページのタブ構造化 PR #52（squashマージ 11d5c23・ブランチ claude/field-detail-redesign）＋全面再構成の再提案（承認待ち）

**実装内容（PR #52）:**

- `/fields/[id]` を概要/記録/写真の3タブに再編成。記録増加時に1画面が際限なく伸びる問題を解消
- 記録タブ: 写真主体のタイムラインカード（shadcn Card/Badge使用）。カード左上にカテゴリバッジ、右上に未対応/要確認バッジ（解決済み/経過観察は既定状態のため非表示）。20件ずつの「もっと見る」ページング（未対応集計用の全件取得は維持）
- 写真タブ: 旧6枚上限→全件ギャラリー化
- タブはARIA Tabsパターン（role="tablist"/"tab"/aria-selected/aria-controls + tabpanel）で実装
- 二次導線の「記録一覧」リンクを削除（記録タブが代替。入口を減らす方針）

**レビュー対応:** Copilot 2件（タブのARIA属性・案内文の矛盾）、Codex 2件（記録タブの一括描画によるパフォーマンス・未対応バッジの欠落）→ すべて対応・返信・Resolve済み。検証は tsc/lint/build 全パス + Playwright でタブ切替・バッジ表示・ARIA属性を確認

**PR #52マージ直後のユーザーフィードバック（重要・次の作業指示）:**

「UI/UXの大改修なのにほとんど変わっていない。モックは無視してコンポーネントライブラリをふんだんに使い、リッチなデザイン・扱いやすいUXに**全体を**変更してほしい。マップ機能自体は壊さずGoogleマップのようなイメージで入り口は迷わないように、家族間共有はLINEのように、デザインははっきりと」

これを受けて**全面再構成の再提案**を提示済み（ユーザーの承認待ち。まだ着手していない）:

- **変わって見えない根本原因の分析**: 部品の差し替えに留まり構造に手を付けていない（全画面が「グレー背景+白カード縦積み」のまま／入り口が8個のまま／shadcn/uiを2箇所しか使っていない／文字が小さく動きがない）
- **PR-A**: デザイン基盤一括刷新（shadcn Tabs/Avatar/Skeleton/Dialog/Separator/Sheet追加・タイポグラフィ大型化・信号色バッジ統一・スケルトンローディング）
- **PR-B**: マップ起点化（Googleマップ式フローティング検索ピル・Vaulスナップポイント式サマリーシート・田んぼページのその場展開・ドロワー8→5項目・`/home`廃止）
- **PR-C**: 記録詳細のトーク画面化（画面下固定のチャット入力バー・メンバー別アバター色・日付セパレータ・コメント件数バッジ）+ 記録一覧のメディアカード化
- **PR-D**: カレンダー・設定・残り画面の統一 + アニメーション仕上げ
- **制約**: MapCanvas内部（描画・ピン・面積計算・保存）は一切触らない。DB変更なし

### 2026-07-01 — UI/UX 大規模改修 Step1-2 + 派生機能 PR #51（squashマージ 21bac32・ブランチ claude/uiux-audit-foundation-suit4i）

T-059（UI/UX大規模改修）着手。前回セッションの方針議論を受けて実装フェーズに入った。

**方針の最終決定（セッション内でユーザーと合意）:**

- UXモデル: Googleマップ方式（マップ全画面が起点→タップでBottomSheetが「その場で展開」してフルスクリーン詳細ページへ）。「入口は単純・機能は深いところに豊富」がGoogleマップ、「企業管理システム化している」のがアグリノートという整理で、前者を志向
- デザイン: アグリノート系（実務ツール寄り・フラット・高密度・ステータス色分け重視）
- スコープ判断3点（いずれも「推奨」で確定）:
  1. PC対応 → 今回は着手せずモバイル優先。**必ず後で着手する前提**（未着手のまま忘れないこと）
  2. 家族間コミュニケーション → 新規チャット機能は作らず、既存のrecord_commentsコメント機能をLINE風UIに強化する方向
  3. 前年比較機能 → 今回は実装せず、将来のタブ枠だけ将来検討（今回は未着手）

**実装内容（9コミット、29ファイル、+1501/−94行）:**

1. **shadcn/ui基盤導入**: `components.json`、`cn()`ユーティリティ、Button/Card/Badge/Drawer（Vaul）コンポーネント、Tailwind v4向けCSS変数テーマ（緑プライマリ）
2. **MapSummarySheet新規**: マップのbrowseモード時に表示されるダッシュボード型BottomSheet（マイ田んぼ枚数・要注意田んぼ・最近の記録・クイックリンク）。FABを中央ピル型→右下丸型に刷新
3. **田んぼ面積の自動計算**（ユーザーからの追加要望）: なぞり描き時に概算面積をリアルタイム表示・保存。頂点サンプリングを画面px基準（ズーム依存で不正確）→実距離2.5m基準（ハーバサイン公式、ズーム非依存）に変更
4. **面積表示単位の切替**（同追加要望）: ha/反/㎡をタップで循環切替。1反=991.7355㎡（尺貫法の法定換算値）で正確に変換。`useAreaUnit`フックでlocalStorage永続化・全画面同期
5. **コメントのLINE風UI**（方針②の実装）: 自分の投稿=右寄せ緑吹き出し、他メンバー=左寄せ灰色+アバター+名前。当初LINEに倣い自分の名前を非表示にしたところ、単独ユーザーでのテストで「誰のコメントか分からない」と実機フィードバックがあり、**自分の投稿でも常に名前を表示**するよう修正（家族アプリでは「誰が言ったか」の明示を優先）
6. **ヘッダー配色の全画面統一**: 実機で「モックアップを作ったのに実画面に反映されていない」という指摘を受け、`AppShell`のヘッダーを白→濃い緑（bg-green-800）に変更。AppShell経由の全画面（10画面以上）に一括反映。`/records/[id]`のみAppShell未使用のため個別修正

**Codexレビュー2周（計11スレッド）:**

1周目: P1×1（`ensureGroupId()`がマップ閲覧だけでグループを作成してしまう→読み取り専用クエリに変更）、P2×7（loadRecordsの過剰取得、描画中のドラッグ判定漏れ、FABとズームコントロールの重なり、展開時のスクロール領域、aria-label欠如、展開時にマップコントロールが被る、等）→全て対応
2周目: P2×3（マップ編集後サマリー未更新→REF-001フェーズへ計画的先送り、エラー時に「0枚」誤表示→修正、記録のみの異常が要注意リストに反映されない→records由来の集計をマージして修正）→2件対応・1件先送り

**検証結果:**

- `npx tsc --noEmit` / `npm run lint` / `npm run build` 全コミットでパス
- 面積計算式・単位変換式を単体検証（誤差0.1〜0.2%程度）
- Playwrightで各画面のヘッダー統一・単位切替・LINE風コメント・マップ→田んぼ詳細プロトタイプの動作を画面キャプチャ確認
- ユーザー実機確認（iPhone・Vercel Preview）で複数ラウンドフィードバックを反映

**モックアップ・プロトタイプ（コード外の設計検討物、リポジトリには残さない）:**

- ホーム画面モック2案（Adobe HTML→PNG、アグリノート業務ツール系に寄せた版が採用方向）
- 田んぼ詳細ページモック（Googleマップの場所ページ相当：ヒーロー画像+統計バー+アクション+タブ+写真付きタイムライン）
- インタラクティブHTMLプロトタイプ（マップ→BottomSheet peek→フルスクリーン田んぼ詳細への「その場で展開」遷移を実際にタップ・ドラッグで確認できるもの）

**次セッションへの持ち越し（T-059の残り）:**

- 田んぼ詳細ページのヒーロー画像化・タブ構造化・写真付きタイムライン（モック済み・未実装）
- マップ→田んぼ詳細への「その場で展開」導線の実装（プロトタイプ済み・未実装）
- 記録一覧・田んぼ一覧のカードをshadcn Card/Badgeで刷新（Step3、未着手）
- PC対応（方針で明確に「後で必ず着手」と確認済み、絶対に忘れないこと）
- 前年比較機能のタブ枠確保（未着手）

### 2026-06-29 — UI/UX 大規模改修の方針検討（T-059・未着手・方針議論中）

**ユーザー要望:**
- アプリとして地味なデザインを一新したい
- 導線がはっきりせず「何をするアプリか」が分かりにくい
- マップ機能は良いがアプリ全体がアプリらしくない
- 代表的な農業アプリ（特にアグリノート）を参考にしたい
- UI部品をテンプレート/ライブラリから使ってアプリらしくしたい

**農業アプリ調査結果（10アプリ調査）:**

| アプリ | 特徴的なUIパターン |
|---|---|
| アグリノート | マップ中心。航空写真+ポリゴン色分け。PC版で分析、モバイルで現場記録 |
| KSAS（クボタ） | 2024年に画面デザイン一新。圃場マップ+リスト切替。作業指示→日誌のワークフロー |
| RiceLog | 稲作専用。マップ俯瞰+一斉記録。プッシュ通知で作業指示→報告 |
| Agrihub | 農家が開発。農作業マップ追加。全機能無料。直感的UI |
| OneSoil | 衛星NDVI。コントラスト表示（緑=良好、赤=問題）。オフライン対応 |
| xarvio | 衛星+AI。生育マップ。LINE連携通知。水稲対応強化中 |
| Cropio | ダッシュボード。植生レベル自動ソート。収量予測 |
| 畑らく日記 | 音声入力。カレンダー表示。シンプルUI |
| Z-GIS（JA全農） | 地図+Excel連携。色分け+ラベル表示 |
| farmOS | OSS。OpenLayersマップ。柔軟なデータモデル |

**提案した方針（アグリノート方式）:**
1. BottomTabBar不要（以前廃止した経緯あり、アグリノートも不使用）
2. shadcn/ui（Tailwind v4対応済み）を導入。Drawer（Vaul）/Card/Badge/Sheet等のコンポーネント
3. マップがホーム画面。BottomSheetで田んぼ詳細・最新記録を表示
4. FAB（フローティングボタン）で「記録する」導線
5. ヘッダー薄く/透過化でマップ面積最大化
6. 既存ドロワーメニュー（ハンバーガー）は活用

**未決定事項（次セッションで決める）:**
- shadcn/ui 導入の最終判断
- `/home` と `/map` を統合するか、各画面を個別にリッチ化するか
- 改修の範囲（全画面一括 vs 段階的）
- Step 分割（shadcn導入→BottomSheet追加→マップ統合→カラー統一 の順を提案中）

**現在のアプリ構成（変更前の状態）:**
- `AppShell`: ヘッダー（ロゴ+ハンバーガー+アカウント）+ `WeatherHeader` + メインコンテンツ
- ナビゲーション: モバイル=`MenuDrawer`（左ドロワー）、PC=`SideNav`（左固定）
- `navItems.ts`: マップ/状況/記録一覧/田んぼ一覧/カレンダー/エクスポート/使い方/設定 の8項目
- `/map`: `fullBleed` で全画面マップ。`MapCanvas` に独自のBottomSheet群（田んぼ選択/ピン追加等）
- `/home`: テキストカード群（未対応バナー/要注意田んぼ/クイックアクション4ボタン/最近の記録/田んぼ概要）
- `/fields`: 田んぼリスト（写真+名前+面積+ステータスバッジ）
- Tailwind v4（`@import "tailwindcss"`）、shadcn/ui 未導入

### 2026-06-29 — 記録一覧・田んぼ一覧の状態表示強化 PR #50（squashマージ 0df7b03・ブランチ claude/uiux-audit-foundation-suit4i）

Issue #49（親 Issue #43 の項目5）対応。記録一覧と田んぼ一覧で状態を一目で判断できるよう強化。

**実装内容（初回コミット 3ff10e8）:**

- 田んぼ一覧: `loadFarmData().points` からピンの異常/要確認を集計しバッジ表示、注意リング（`ring-1 ring-amber-200`）、`IconWarningFill`、最終記録日表示
- 記録一覧: 全ステータスバッジ（未対応/要確認/解決済み/経過観察）、ポイント種別ラベル（注意箇所/畦崩れ/水抜け不良）、未対応リング

**ユーザーレビュー指摘2点 → 修正コミット 4baec7f:**

1. 記録一覧の地点情報強化: `field_points` テーブルをJOINしポイント実名取得、`TYPE_LABELS`（mapPins.ts）で全8種のポイント種別ラベル表示（入水口〜その他）
2. 田んぼ一覧: 注意状態の有無にかかわらず「最終記録/記録なし」を必ず表示、`loadRecords()`（100件制限+重いJOIN）を軽量直接Supabaseクエリに置換

**Codexレビュー指摘2件 → 修正コミット 27ae58d:**

| 指摘 | 重要度 | 対応 |
|---|---|---|
| 最終記録クエリのPostgREST上限超えページング | P2 | `range()` 指定のページングループ追加 |
| toPointType()でfield_points.point_typeを優先 | P2 | `r.field_points?.point_type` を `ai_category` より先に参照 |

**検証結果:**

- `npx tsc --noEmit` ✅ / `npm run lint` ✅ / `npm run build` ✅
- Vercel Preview 3回とも Ready
- オーナー実機確認済み

**変更ファイル（4件）:** `src/app/fields/page.tsx`, `src/features/records/RecordsScreen.tsx`, `src/lib/data/records.ts`, `src/types/index.ts`

### 2026-06-28 — 確認・記録・地図回帰の導線統合 PR #48（squashマージ b3cc32c・ブランチ claude/uiux-audit-foundation-suit4i）

Issue #47 対応。現場での確認・記録・地図回帰を1本の導線に統合。

**実装内容（初回コミット 06cbfc0）:**

- ホーム画面に「要注意の田んぼ」セクション追加（ポイントの異常/要確認ステータスを田んぼ別集計、件数順表示）
- 田んぼ詳細のポイント導線改善（タップ先を `/records/new` → `/map?field=&point=` に変更、「マップを開く」→「マップで見る」に改名）
- 記録詳細に「マップで見る」リンク追加（fieldId/pointId/lat/lng がある記録にマップ遷移ボタン）
- マップ画面のURLパラメータ対応（`?field=X&point=Y&lat=Z&lng=W` による初期ナビゲーション、`<Suspense>` 境界追加）
- 状態ラベル統一（全画面で 正常/要確認/異常/解決済み の4段階に。mapPins: 良好→正常、FieldDetailScreen/recordDetail: 対応済み→解決済み）

**オーナーレビュー指摘2件 → 修正コミット 7e28550:**

1. **returnTo に田んぼ・ピンコンテキスト保持**: MapBottomSheet/MapDetailPanel の記録リンクの `returnTo` を `/map?field={fieldId}&point={pointId}` 形式に変更。記録保存後のマップ復帰時に選択状態が復元される
2. **GPSフォールバック優先順序**: MapCanvas の初期ナビゲーション優先度を point→field→lat/lng から point→lat/lng→field に変更。ピン未紐付きでもGPS座標があればそこへ移動

**検証結果:**

- `npx tsc --noEmit` ✅ エラーなし
- `npm run lint` ✅ エラーなし
- `npm run build` ✅ 全19ページビルド成功
- Vercel Preview Ready
- Codex 確認 OK

**実機確認（2026-06-28 iPhone）:**

- ホーム → 要注意の田んぼ → 田んぼ詳細 → 地点/記録 → 地図の導線 ✅
- 記録詳細 → マップで見る → GPS優先表示 ✅
- 地点記録 → 保存 → 同じ田んぼ・地点が選択されたマップへの復帰 ✅
- ステータスラベルの全画面表記 ✅

**変更ファイル（9件）:** `HomeScreen.tsx`, `FieldDetailScreen.tsx`, `records/[id]/page.tsx`, `MapCanvas.tsx`, `MapBottomSheet.tsx`, `MapDetailPanel.tsx`, `map/page.tsx`, `mapPins.ts`, `recordDetail.ts`

### 2026-06-25 — マップ操作モデル作り直し PR #40 マージ＋iOS修正＋Codexレビュー対応（squashマージ 75d4016・ブランチ claude/ecstatic-lovelace-uhfu02）

前セッション（2026-06-24）で draft PR として作成したマップ操作モデル作り直しを、ユーザーの iPhone 実機確認→追加修正→Codexレビュー対応を経てマージ。

**A. iPhone 実機バグ修正（3フェーズ）:**

- **Phase 1（dc56611）**: 田んぼ登録/描画中にトップバーの「×」キャンセルボタンを追加。`returnToBrowse()` を単一の復帰口として強化（`document.activeElement.blur()` + `mapRef.current.stop()` + `cancelDraw()` + 全状態クリア + `resizeMapSoon()`）。`h-dvh` で iOS Safari の動的ビューポートに対応。
- **Phase 2（f1c3b45）**: FieldSearchSheet を無限ループホイールピッカーに作り直し。トースト/レコード画面の横幅オーバーフロー修正（`inset-x-0 px-4` 方式）。新規田んぼ保存後の遷移改善（`handleSaveField` で mode=browse + 選択状態セット）。
- **Phase 3（957e3d9, 450ae07）**: **iOS Safari の入力フォーカスによるビューポート拡大**（根本原因）を修正。FieldNameDialog/AddPinSheet/PointEditDialog の input を `text-sm`(14px) → `text-base`(16px) に変更し iOS の自動ズームを防止。ダイアログの blur-before-action パターン（`blurInput()` → `handleSave()`/`handleCancel()`）で、ダイアログ削除前にズーム解除を保証。`LayoutDebugPanel.tsx` を新設（`?layoutDebug=1` で有効化）し、resize/viewport の診断情報をキャプチャ。

**B. 並行セッション修正の統合（570780c）:**

- 描画モードの `touchcancel` イベントリスナー漏れ修正。
- `resizeMapSoon` を単一 rAF に簡素化（`map.resize()` は `getContainer()` で自動的にサイズ検出するため rAF×2 は不要）。
- `visualViewport` リスナーのデバウンスを 400ms に変更（iOS キーボード dismiss の安定待ち）。

**C. Codexレビュー対応（c75b51d）:**

| 指摘 | 重要度 | 対応 |
|---|---|---|
| 描き直し選択の遅延適用 | P2 | `e5097d9` で修正（`selectAndFly` を DB 更新成否判定の後に移動） |
| ピン誤タップ防止（placing中） | P2 | `c75b51d` で修正（`activatePoint` ヘルパーでモードガード） |
| トースト積み重ね復元 | P3 | `c75b51d` で修正（`flex-col items-center gap-2` 復元） |
| LayoutDebugPanel 二重インスタンス | P3 | 見送り（デバッグ専用ツール） |
| 非同期描き直しレースコンディション | P3 | 見送り（実運用上発生しない） |

**変更ファイル（PR #40 全体）:**

- 新規: `docs/MAP_STATE_MACHINE.md`, `src/features/map/FieldPlaceOverlay.tsx`, `src/features/map/LayoutDebugPanel.tsx`
- 大幅修正: `MapCanvas.tsx`（モード統合・placing・activatePoint・resize防御）, `FieldSearchSheet.tsx`（ホイールピッカー）
- 修正: `FieldNameDialog.tsx`, `FieldDrawOverlay.tsx`, `AddPinSheet.tsx`, `PointEditDialog.tsx`, `Toast.tsx`, `RecordsScreen.tsx`

**残（次セッション）:**

- **ユーザー実機確認 U-011（最優先）**: PR #40 の8点。特に iOS Safari での入力ズーム解消・2段階登録・ピン誤タップ防止。
- 既存の U-002/U-005〜U-010 も未確認。
- 任意機能候補: T-051/T-052/T-048/T-053/T-054/T-055〜T-058 据え置き。

### 2026-06-24 — マップ操作モデルの作り直し（draft PR・ブランチ claude/ecstatic-lovelace-uhfu02）

ユーザーから「『田んぼを選ぶ』『田んぼを登録する』導線を、部分修正でなく操作モデルから作り直す」指示。PR #39 の一覧UIは見た目止まりで、(a) iPhoneで一覧がスクロールできない (b) 閉じた後に地図表示が復帰しない (c) 「田んぼを登録する」が即描画モードで現場以外を登録できない、の3点を構造から直す。

**0. 状態遷移の明文化（実装前）:** `docs/MAP_STATE_MACHINE.md` を新規作成。通常閲覧／登録田んぼ一覧／場所合わせ／輪郭描画／名前入力／田んぼ詳細／ピン詳細／ピン追加を単一モードとして定義し、遷移図・browse復帰の保証・地図サイズ復帰の多重防御・iPhoneタッチ競合対策を先に確定してから実装。

**A. 単一モード state machine（MapCanvas.tsx）:** 独立していた `searchOpen`/`selectedField`/`selectedPoint`/`addingPin`/`pendingPinFieldId` を、discriminated union の `mode`（browse/picker/placing/field/point/addPin）へ統合。`selectedField`/`selectedPoint` は mode から導出。`returnToBrowse()` を唯一の復帰口にし、プレビュー/仮ピン座標/redrawTarget/記録ポップ/タイマーを必ずクリア。輪郭描画・名前入力は頂点を持つ `useFieldDraw`（drawState）が一次情報で、表示は mode より優先。

**B. 2段階の田んぼ登録:** 「田んぼを登録する」で即描画せず、まず `placing`（場所合わせ）へ。新規 `FieldPlaceOverlay`（中央照準＋案内＋「この場所で輪郭を描く」＋キャンセル）で地図を自由移動・現在地・遠隔地登録が可能。「この場所で輪郭を描く」で初めて drawing に入る。`FieldDrawOverlay` に「場所を合わせ直す」を追加し、輪郭を捨てて placing へ戻れる。保存後は登録した田んぼを選択状態で表示。

**C. iPhoneスクロール（FieldSearchSheet.tsx）:** 下部シートを「固定ヘッダ＋スクロール一覧（`flex-1 min-h-0 overflow-y-auto`）＋固定『田んぼを登録する』」の縦フレックスに。全体は `max-h-[48vh]` 固定、一覧領域だけ縦スクロール。`touch-action: pan-y` / `overscroll-contain` / `-webkit-overflow-scrolling: touch` ＋ `touchmove` の伝播停止で MapLibre のタッチ競合を回避。スクロール中央プレビューは `panToField` に上方向オフセット（コンテナ高×0.22）を入れ、田んぼがシートの裏に隠れないよう見える上側へ寄せる。

**D. 地図サイズ復帰の多重防御:** ①`ResizeObserver` をマップコンテナに常設 ②`window.resize`/`visualViewport.resize` ③mode 変化ごとに rAF＋250ms 後の resize。rAF 1回依存をやめ、シート開閉・iOS Safari アドレスバー変化でも崩れないようにした。

**変更ファイル:** `docs/MAP_STATE_MACHINE.md`（新規）／`src/features/map/FieldPlaceOverlay.tsx`（新規）／`MapCanvas.tsx`（モード統合・placing・resize多重防御）／`FieldSearchSheet.tsx`（縦フレックス・touch対応・onStartRegister）／`FieldDrawOverlay.tsx`（場所を合わせ直す）。

**セルフレビュー:** `npx tsc --noEmit` エラーなし／`npm run lint` 既存warning（Toast.tsx）のみ／`npm run build` 全19ページ成功。

**残:** ユーザーの iPhone 実機確認 U-011（最優先）。既存 U-002/U-005〜U-010 も未確認。

### 2026-06-24 — 田んぼ選択UI作り直し PR #39（squashマージ 7f42d42・ブランチ claude/ecstatic-lovelace-uhfu02）

ユーザーから「マップの『田んぼを探す』を現場で使いやすい『登録田んぼを選ぶ』UIに作り直す」指示。検索UI→一覧ピッカーUI、スクロールプレビュー＋タップ選択の2段階操作、シート閉じ時の不具合修正を1 PRで実施。

**A. FieldSearchSheet.tsx 書き直し:**

- 見出しを「田んぼを探す」→「登録田んぼ（N件）」に変更。
- 常設の検索入力欄を削除（将来用の絞り込みは今回未実装）。
- 一覧を `max-h-56`（224px）の固定高さ内で縦スクロール（`overscroll-contain`）。
- `useRef` + `getBoundingClientRect` でリスト中央のアイテムを検出し、200msデバウンスで `onPreview` コールバックを発火。
- 初回表示時も100ms後に中央アイテムを検出し初期プレビューを実行。
- タップ時は `onFieldSelect(f)` のみ呼び出し（`onClose` は親が管理）。
- 「田んぼを登録する」ボタンは維持。匿名/未登録時の導線も維持。

**B. MapCanvas.tsx の状態分離と地図連動:**

- `previewField`（スクロールプレビュー用）と `selectedField`（正式選択用）を完全に分離。
- ボタン名を「田んぼを探す」→「田んぼを選ぶ」に変更、アイコンを `IconSearch` → `IconListBullet` に差し替え。
- マップレイヤーに `fields-preview` / `user-fields-preview`（アンバー色 `#F59E0B`、太さ4.5px）を追加。選択レイヤー（緑）の下に配置。
- `panToField()` を新設: `flyTo` ではなく `easeTo`（duration 400ms）でズーム変更なしの緩やかなパン。
- `handlePreview`: `previewField` を即時更新（→レイヤーフィルタが即反映）、`panToField` は300msデバウンスで安定時のみ実行。
- `handlePickerSelect`: `previewField` クリア → `selectedField` セット → `flyToField` → シート閉じ → `map.resize()`。
- `handlePickerClose`: シート閉じ → `previewField` クリア → `map.resize()`。

**C. シート閉じ時の不具合修正:**

- シート開く時に `selectedField`/`selectedPoint`/`recordPopOpen` をクリアし中途半端な状態を防止。
- シート閉じ時に `requestAnimationFrame(() => map.resize())` でオーバーレイ除去後のレイアウト崩れを解消。
- `window.addEventListener("resize")` + `visualViewport.addEventListener("resize")` でiOS Safari のアドレスバー表示/非表示によるMapLibreの地図幅・高さ崩れに対応。
- シートは `absolute inset-0` のオーバーレイ方式を維持し、地図コンテナのレイアウト幅に影響しない。

**変更ファイル:**

- `src/features/map/FieldSearchSheet.tsx`（書き直し）
- `src/features/map/MapCanvas.tsx`（状態追加・レイヤー追加・ハンドラ追加・ボタン変更）

**セルフレビュー:**

- `npx tsc --noEmit` 変更ファイルにエラーなし／`npm run lint` 既存warningのみ／`npm run build` 全ページ成功。

**残（次セッション）:**

- **ユーザー実機確認 U-010（最優先）**: PR #39 の9点（ボタン名／見出し／検索欄なし／スクロール／プレビュー／地図安定／タップ選択／閉じて復帰／地図崩れなし）。
- 既存の U-002/U-005〜U-009 も未確認。
- 任意機能候補: T-051/T-052/T-048/T-053/T-054/T-055〜T-058 据え置き。

### 2026-06-23 — UI/UXリデザイン PR #38（squashマージ 77ae814・ブランチ claude/zealous-cerf-senlzg）

ユーザーから「BottomNav を MenuDrawer + SideNav に置き換え、/map を主導線にし /home をステータスダッシュボードにする」方針で PR #38 を作成。Codex レビュー3ラウンド（計11件 P2）すべて対応し、ナビ定義の一元化も実施。

**A. ナビ体系の全面移行:**

- `BottomNav.tsx` と `FAB.tsx` を削除。代わりに `MenuDrawer.tsx`（モバイル用スライドイン）と `SideNav.tsx`（PC lg以上で常時表示）を新設。
- `DrawerContext.tsx` を新設し、AppShell のハンバーガーボタンから MenuDrawer の開閉状態を共有。
- `navItems.ts` を新設し、8項目のナビ定義（`NAV_ITEMS`）と `isNavActive()` を一元化。MenuDrawer・SideNav の両方がこれを参照。
- AppShell のハンバーガーは常時表示（戻るボタンがあるときは `right-12`、ないときは `left-2`）。`lg:hidden` で PC では非表示。
- `HeaderAccountChip` に `hasBack` prop を追加し、戻るボタン＋未ログイン時にログインボタンを隠してハンバーガーとの重なりを防止。

**B. 画面の役割再定義:**

- `/map`（`MapCanvas.tsx`）: PC では右側に `MapDetailPanel.tsx`（新設）を常時表示（田んぼ一覧・選択時の詳細・ピン一覧）。モバイルではボトムシートのまま。
- `/home`（`HomeScreen.tsx`）: ステータスダッシュボード化。未対応異常バナー・クイックアクション（写真/音声/マップ/田んぼ）・最近の記録・田んぼ概要。匿名時は田んぼセクションにログイン促進を表示（「未登録」と誤表示しない）。
- `/menu`（`page.tsx`）: 設定ハブとしてのリンク先を整理（`/menu/site` ではなく `/menu` へ）。
- `app/page.tsx`（`/`）: ランディングページから `/map` へ直接リダイレクト。

**C. 認証・印刷対応:**

- `useAuth.ts` の `signOut()`: `window.location.href = "/login"` でフルページ遷移し React 状態をクリア（SPA内遷移だと古い状態が残る問題を解消）。
- `SideNav`: `print:hidden` で印刷時に非表示。
- `AppShell`: 外側 `div` に `print:block print:h-auto` を追加し、印刷時に `h-dvh` が切り詰めない。

**D. Codex レビュー対応（3ラウンド・計11件 P2）:**

- **Round 1**（cb5b07a・4件）: ①設定リンクを `/menu` へ修正 ②田んぼ取得失敗時のエラー表示（`loadError` state）③SideNav に `print:hidden` ④田んぼ詳細の `backHref="/fields"`
- **Round 2**（0ae9cd8・4件）: ⑤戻るボタン付きページでハンバーガー常時表示 ⑥記録一覧空状態のモード別メッセージ（`recordsMode`）⑦印刷時の `print:block print:h-auto` ⑧匿名時の田んぼセクションにログイン促進
- **Round 3**（fa42066・3件）: ⑨signOut の `window.location.href` 遷移 ⑩`recordsMode` state 追跡 ⑪`HeaderAccountChip` の `hasBack` prop でログインボタン/ハンバーガー重なり防止

**E. ナビ定義一元化（baa5da0）:**

- MenuDrawer と SideNav に重複していた `NAV_ITEMS` 配列と `isNavActive` 関数を `navItems.ts` に切り出し。リンク先・表示順・アクティブ判定の基準が1箇所で管理される。

**変更ファイル一覧:**

- 新規: `navItems.ts`, `DrawerContext.tsx`, `MenuDrawer.tsx`, `SideNav.tsx`, `MapDetailPanel.tsx`
- 削除: `BottomNav.tsx`, `FAB.tsx`
- 修正: `AppShell.tsx`, `HeaderAccountChip.tsx`, `HomeScreen.tsx`, `MapCanvas.tsx`, `useAuth.ts`, `icons.tsx`, `layout.tsx`, `app/page.tsx`, `app/map/page.tsx`, `app/menu/page.tsx`, 他 page.tsx 群

**セルフレビュー:**

- 全コミットで `npx tsc --noEmit` エラーなし／`npm run lint` 既存warningのみ／`npm run build` 全ページ成功。

**残（次セッション）:**

- **ユーザー実機確認 U-009（最優先）**: PR #38 の8点（ハンバーガー→Drawer／SideNav／MapDetailPanel／signOut遷移／匿名ホーム／印刷／戻る+ハンバーガー／空状態メッセージ）。
- 既存の U-002/U-005〜U-008 も未確認。
- 任意機能候補: T-051/T-052/T-048/T-053/T-054/T-055〜T-058 据え置き。

### 2026-06-21 — Map Hub Phase 1（main直push 22fd0c5）

ユーザーから「マップをホーム相当にしないと先に進まない」「田んぼを選ぶか登録するかを明確にする」「写真・音声・ピン追加は初期表示で迷わせない」と指摘。Claude Code 実装分を Codex Desktop で監視・レビューし、制限到達後に引き継いで修正、main へ直接 push（ユーザー承認済み）。

**選んだ進め方: 整理**

- 対象は `/map` の UI/UX 導線のみ。DB、認証、Storage、RLS、保存処理には触っていない。
- `/map` では BottomNav を非表示にし、白いサブヘッダーを削除して実画像マップを主役化。
- 初期ボトムシートは「田んぼを選ぶ」状態に統一。田んぼ一覧と「一覧にない田んぼを登録する」CTAを同じ場所に置き、既存田んぼ選択と追加登録の迷いを減らした。
- 田んぼ詳細は「この田んぼに記録する」を主ボタン化。「詳細を見る」「ピン追加」は副導線、名前変更/描き直し/削除はアコーディオン内へ退避。
- ピン詳細は「この地点を記録」を主導線化。
- FABは初期状態で `未対応を見る` / `記録する` / `追加・管理` の3カテゴリだけ表示。写真で記録、音声メモ、田んぼ追加、ピン追加はカテゴリを開いた時だけ表示。
- 田んぼ詳細からピン追加した場合は AddPinSheet で対象田んぼを初期選択。FABからピン追加した場合は従来どおり未選択。
- ダミーデータの田んぼ形状は四角い色枠に見えないよう、不整形ポリゴンへ調整。本番のなぞり描き登録データ表示は U-008/T-058 で実機確認する。

**確認済み:**

- `npm.cmd run build` 成功。
- `npm.cmd run lint` 成功（既存 warning のみ）。
- `https://rice-knowledge-map.vercel.app/map` HTTP 200 確認。
- Codex内蔵ブラウザは `node_repl` の `sandboxPolicy` エラーで起動不可だったため、ローカル Chrome + Playwright でスクリーンショット確認。

**再開メモ（Claude Code / Codex 共通）:**

- 次回以降の通常作業は必ず別ブランチを作成して進める。main直pushはユーザーが明示許可した場合のみ。
- 再開時は `main` の `22fd0c5` 以降を前提にする。
- Windows では `npm` ではなく `npm.cmd` を使う。
- `.codex/` はローカル作業ディレクトリ由来の未追跡ファイル。コミット対象にしない。
- UIの次タスクは T-055〜T-058 と U-008 を優先する。

### 2026-06-16 — レスポンシブ対応（PC/タブレット）PR #35＋Codex指摘対応 PR #36 マージ（ブランチ claude/ecstatic-brown-rnf9u0）

ユーザーから「saas でありPCブラウザでも機能しレスポンシブに表示されるべき。今はPCブラウザでもスマホサイズで表示されている。機能を壊さずレスポンシブ対応に変更する必要がある。」の指摘 → 案A（モバイルファースト維持＋段階的拡張）で2 PR に分けて対応。

**A. PR #35（0cf3e55）— 案A 段階的拡張:**

- 原因: `max-w-md`（448px）が AppShell・各画面の最外コンテナにハードコードされ、`md:` / `lg:` / `sm:` / `xl:` の breakpoint prefix がコードベースに1個もなかった（grep 0 hit）。`innerWidth`/`matchMedia` 等の JS 側ブレークポイント判定もなし → **CSS 追加のみで対応可能**。
- 最外コンテナ拡張:
  - `AppShell.tsx`（home/map/fields/records一覧/calendar/menu 共通）: `max-w-md` → `max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl`
  - `app/records/[id]/page.tsx`（5箇所）: `max-w-md md:max-w-2xl lg:max-w-3xl`
  - `LoginScreen.tsx` / `InviteRedeemScreen.tsx`: `max-w-md md:max-w-lg`
  - `ConfirmRecordScreen.tsx`: `max-w-md md:max-w-2xl lg:max-w-3xl`
  - `app/page.tsx`（トップランディング）: 最外 max-w-md 解除＋各セクション内側で個別 max-w キャップ（hero `max-w-2xl md:max-w-3xl`、Features `max-w-6xl md:grid-cols-3`、Footer CTA `max-w-4xl md:px-12 md:py-14`、CTAボタン `sm:max-w-md`）
- BottomNav: 内側 flex 行に `mx-auto w-full max-w-md` 追加（PC でタブが間延びしないよう中央寄せ、背景白線は全幅維持）
- カード一覧の複数列化（共通: `grid gap-2.5 md:grid-cols-2 lg:grid-cols-3`）: HomeScreen 田んぼカード／`/fields` 一覧／`/records` 日付グループ内
- マップのボトムシート群（PC で全幅張り付き防止）: MapBottomSheet・田んぼ選択カード・ピン追加バナーに `mx-auto w-full max-w-md md:max-w-2xl`
- PWA Service Worker: `CACHE_NAME` を `rkm-static-v1` → `v2` に bump（古いCSSキャッシュへの保険）

**B. PR #36（e7e2c07）— Codex P2 指摘対応:**

- 指摘: `/map` は `<AppShell fullBleed>` でレンダリングされるが、PR #35 の `xl:max-w-6xl` キャップが fullBleed でも効いてしまい、1920px の幅広ビューポートでマップ幅 72rem に制限され左右にグレー帯が残る。
- 対応: AppShell 最外コンテナのクラスを条件付きに変更。`fullBleed: true`（`/map`）→ `w-full`（全幅）／`fullBleed: false`（home 等）→ 従来通り段階的キャップ。
- `fullBleed` は `/map` でのみ使用（`grep` で確認済み）。ヘッダー中央ロゴ・絶対配置のアカウントチップ/戻るボタン・WeatherHeader は全幅でも自然な配置。ボトムシート群は既に内側で `max-w-md md:max-w-2xl` キャップ済み。

**進め方の記録:**

- ユーザーは「先にマージして本番確認」を選択（PCネイティブ化や密度調整は後回し）。
- PR #35 マージ後すぐに Codex から P2 指摘1件 → PR #36 で即対応 → マージ。
- PR #35 → #36 でブランチ `claude/ecstatic-brown-rnf9u0` を再利用するため、main から切り直して `git push --force-with-lease`。マージ済み履歴は main 側に残るのでデータロスなし。
- セルフレビュー: 両 PR で `npx tsc --noEmit` エラーなし／`npm run lint` 既存warningのみ／`npm run build` 全19ページ成功。

**残（次セッション）:**

- **ユーザー実機確認 U-007（最優先）**: PR #35/#36 のレスポンシブ8点（PC幅トップ／home・fields・records／map全幅／ボトムシート中央寄せ／タブレット2列／モバイル1列／ログイン後URL／ログイン後の幅維持）。特に「ログインするとスマホ幅に戻る」と報告があった件が解消するか要確認（コードにはログイン依存の幅バグなし、本番URL（旧コード）へのリダイレクトが疑われていた）。
- 任意機能候補: 据え置き（T-051/T-052/T-053/T-054/T-048）。
- PCのデザイン作り込み（タイポグラフィ密度・デスクトップネイティブ化）はユーザー判断待ち。

### 2026-06-15 — Phase F（記録詳細・マップ・記録削除の導線改善）PR #33 マージ（ブランチ claude/ecstatic-brown-rnf9u0 → squashマージ 5d74265）

ユーザーから「アプリの導線が良くない」（複数田んぼ管理で別の田んぼに記録してしまう事故・マップから田んぼ詳細に行けない・記録削除不可）の指摘 → 1 PR にまとめて対応。Copilotクォーター切れのためセルフレビュー必須で実施。

**A. 記録詳細 → その田んぼ・地点への導線（`src/app/records/[id]/page.tsx`）:**

- 「追記する」ボタンの URL に `field=`/`point=`/`pointType=` を引き継ぐクエリビルダー（`URLSearchParams`）を追加。受け取り側（AudioRecordScreen/PhotoRecordScreen）は既に対応済み。**未指定だと新規記録画面が GPS で田んぼを自動選択するため、隣接圃場で別の田んぼに保存される事故を防ぐ。**
- 田んぼ名バッジを `Link` で `/fields/[id]` へ、地点バッジを `/records?point=...` へ（fieldId/pointId が null のときは従来通り `span`）。
- ヘッダーの戻るボタンを `<button onClick={goBack}>` に変更し、`router.back()` + `window.history.length > 1` フォールバックで `/records` へ。田んぼ詳細→記録詳細→戻る で田んぼに戻れるようになる。

**B. マップポリゴン → 田んぼ詳細（`src/features/map/MapCanvas.tsx`）:**

- 田んぼ選択時の操作カード（名前変更/描き直す/削除）の上に「**この田んぼの詳細を見る**」緑CTAを追加。DB保存前のローカルid（`user-field-*` 接頭辞）は詳細ページが見つからないため CTA を隠す。
- `IconChevronRight` を import に追加。

**C. 記録の削除（`src/lib/data/recordDetail.ts` + 詳細ページ）:**

- データ層に `deleteRecord(recordId)` を新設。順序: ①`record_media` の storage path を `select` → ②`records.delete()` で行削除（comments/media/status_events は `on delete cascade` で連動削除）→ ③Storage ファイルを `remove()`（best-effort）。
- ②が失敗したら何も消さない。③の失敗は孤児ファイルが残るだけで実害軽微（warn のみ）。RLS拒否は `.select('id')` の0件成功で `denied` として検出。
- `RecordDetail` 型に `fieldId`/`pointId`/`pointType` を追加（追記クエリ・バッジ Link 化に必要）。`RecordDetailData` の `live`/`demo` に `canDelete: boolean` を追加。
- **権限**: DB側RLSは owner/editor 全員に DELETE 許可しているが、**家族間の誤削除を防ぐためUI上は「記録者本人 OR グループのowner」のみ⋮メニューを表示**。canDelete は `loadRecordDetail` 内で `farm_group_members` の role を `maybeSingle()` で確認して計算。
- 詳細ヘッダの「⋮」を有効化（canDelete=true のときのみ）→ドロップダウンメニュー（role="menu"/menuitem・aria-haspopup/expanded）→確認モーダル（cascade警告付き）→削除実行→`router.replace(/fields/[id])`（fieldIdあり）または `/records`（履歴に404URLを残さない）。
- モーダルは親の `overflow-hidden` を抜けるため `fixed inset-0` 採用。

**セルフレビュー（Copilotクォーター切れ代替）:**

- `npx tsc --noEmit` エラーなし／`npm run lint` 既存warningのみ（変更ファイルに新規warning無し）／`npm run build` 全19ページ成功。
- 受け取り側（AudioRecordScreen/PhotoRecordScreen の `?field=`/`?point=`/`?pointType=` 処理）の存在確認済み。
- `record_media` cascade は migration `0001_init.sql:334`（`on delete cascade`）で確認。
- ピンの `user-field-*` ローカルid除外で詳細ページ404を防止。
- 削除モーダル位置: 親の `flex h-dvh max-w-md` には `relative` が無く `absolute` が初期含有ブロックに falls through するため `fixed inset-0` に変更。
- canDelete の `farm_group_members` 追加クエリは記録1件あたり最大1回・single record detail page・ホットパスでない。

**進め方の記録:**

- ユーザーは「まだ作業はしなくていい」段階で提案だけ → 「まとめていきましょう」で着手 → PR #33 を draft で作成 → 「ドラフトを解除するとcodexのレビューが来る」で `update_pull_request(draft=false)` → Codexレビュー無しのままユーザー判断でマージOK。
- Copilot は今期クォーター切れのためレビューは Codex 頼み（次回以降も同じ前提で動く）。draft 解除時のみ自動レビューが来る。
- このPRの監視購読（subscribe_pr_activity）はマージで自動終了。

**残（次セッション）:**

- **ユーザー実機確認 U-006（最優先）**: 上記7点（追記が同田んぼ／バッジLink／戻る／マップCTA／⋮削除／非表示／owner削除）。
- 任意機能候補: T-051（記録詳細→マップで見る・lat/lng のとき）／T-052（コメント編集・削除・各IconMoreが現状ダミー）／T-053（複数グループ本格対応・保留中）／T-054（soft-delete・保留中）／T-048（AI整理・任意）。
- **複数田んぼ運用の体感確認**を経て次の導線改善ポイントを見つける流れが自然。

### 2026-06-14 — トップのWebランディング刷新・Codex/セルフレビュー全対応・PR #31 マージ（ブランチ claude/rice-pwa-ux-refinements-o8fxj4 → squashマージ 8bde66d）

PR #31 を **squashマージで本番反映**（コミット17本を1本に集約）。理由: 同一機能に対する review 修正の往復コミットが多く、main の履歴を1機能=1コミットで読みやすく保つため。下記はこのセッション分（上記「続き3」と同じブランチに積み増し→まとめてマージ）。

**トップページ（`/`）を王道のWebランディングに作り替え（src/app/page.tsx）:**

- アプリ内スプラッシュ（自動で /home へリダイレクト）をやめ、常時表示の**ランディング**に: ヒーロー（実写真背景＋アイブロウ＋見出し＋本文＋CTA2種「アプリをはじめる/使い方を見る」＋スクロール誘導）→ 機能セクション3カード → フッターCTA。
- **背景モーションを大幅強化**: Ken Burns を 8s・拡大1.08→1.32＋大きめパンに（globals.css の `splash-kb-a/b/c`）、さらに**スクロール連動パララックス**（背景が遅れて流れ＋フェード）。`HeroBackdrop` がスライドを opacity クロスフェード。
- 背景デフォルトはフリー写真（siteContent の Unsplash 3枚）。ユーザーは画像/テキストを差し替え可能（既存機能）。
- 当環境は外部画像が遮断されスクショは SVG フォールバック表示。**実写真はプレビュー/本番でのみ**確認できる。
- 重要な教訓: **ユーザーは文章/ASCIIモックではデザインを判断できない**。実機/プレビューで「見せて」確認する。

**「未対応」判定の構造バグ是正（Codex指摘の核心）:**

- `records.status` のDB既定値は `'open'` → 通常の写真/作業/水管理/音声記録もすべて open になり「未対応」を誤判定していた。
- `src/lib/data/records.ts` に `isUnresolvedIssue()` と `ISSUE_POINT_TYPES = [caution, levee_damage, poor_drainage]` を新設。判定は **pointType ベース**（`ai_category` 由来）にして、拡張前に `record_type='photo'` で保存された**旧データの異常記録も拾う**。
- 適用: RecordsScreen の「未対応」バッジ/`status=open` 絞り込み、FieldDetailScreen の openRecords・全クリア判定、HomeScreen のバナー件数（サーバクエリを `.or(record_type.eq.issue, ai_category.in.(...))` に。group_id 絞りは外し記録一覧と同じ RLS可視の全グループ横断に）。

**100件上限の取りこぼし対策:**

- `loadRecords({ all: true })` を追加（`range()` ページングで PostgREST 最大行数を超えても全件取得）。export・`/records?status=open`・FieldDetailScreen（`{ fieldId, all: true }`）で使用。`loadRecords({ fieldId })` にサーバ側の田んぼ絞り込みも追加。

**エクスポート（src/app/export/page.tsx）:**

- 年フィルタ/月グルーピングを表示と同じ**ローカル日付基準**（`new Date()`）に（年末年始のズレ防止）。`recordedAt` 欠落時の `startsWith/slice` クラッシュをガード。

**カレンダー/複数グループ — 設計判断「単一アクティブグループに統一」（ユーザー承認済み）:**

- 背景: viewer 書込みを RLS で禁止する migration 0006 と field 整合トリガーにより、複数グループ時の不整合が露呈。
- 決定: カレンダーは **`ensureGroupId()`（最初の所属＝アクティブグループ）に統一**。`createSchedule` は ensureGroupId、`CalendarScreen` は田んぼ選択をアクティブグループ内に限定＋`getMyRole()` で **viewer には追加/完了/削除を非表示**。`toggleScheduleDone/deleteSchedule` は `.select('id')` で **0行（RLS拒否）を検出**して false。
- **ホーム/記録一覧は従来どおり RLS可視の全グループ横断**（records.ts は元々グループ非絞り込み）。複数グループの本格対応（loadSchedules 横断・田んぼ/予定ごとのロール）は**将来タスク**として保留。

**その他のレビュー対応:**

- `RemotePhoto`: キャッシュ画像で `onLoad` が発火せず opacity:0 のまま固まる問題を `img.complete` 判定で解消、src変更でフェード再実行。
- FieldDetail 全クリア表示: 全ポイントが normal の時だけ「すべて正常」、対応済み含む場合は「要対応はありません（対応済みを含む）」。
- 未使用CSS（mask-rise/splash-sub/line-grow）削除、ヒーロー画像の二重プリロード・未使用の `app_entered` 書込みを撤去。

**進め方の記録:**

- セルフレビュー（/code-review 高強度・7観点）→ Codex 自動レビューを複数ラウンド。Codex指摘は **計14点すべて対応**。
- 途中で **GitHub MCP が認証切れ**（OAuth が Google Drive にリダイレクトする不調）。git push は常時可。最終的に MCP 復帰後に **squashマージ**。今後 PR でCodex対応を自動化するには MCP 再認証 or 各PRで `@codex review`。
- このPRの監視購読（subscribe_pr_activity）はマージで自動終了。

**残（次セッション）:**

- **ユーザー実機確認（最優先）**: トップのヒーロー＆モーション／ホーム未対応バナーの件数／記録一覧の未対応バッジ／田んぼ詳細／export／カレンダー（viewer がいれば書込み非表示）。→ U-002 に反映。
- 複数グループの本格対応（保留）。記録の AI 整理（T-048・任意）。

### 2026-06-13（続き3） — UX作り込み・動作不良修正・レビュー解消（ブランチ claude/rice-pwa-ux-refinements-o8fxj4）

> 注: この「続き3」分は上の 2026-06-14 分と同じブランチに積まれ、まとめて **PR #31（8bde66d）でマージ済み**。

**バグ/レビュー指摘の修正:**

- **カレンダー**: 6月ラベルの文字化け `6␣␣␣` → `6月`（CalendarScreen.tsx）
- **ホーム異常バナー**: 存在しない `field_records` を `records` に修正（件数取得が常に失敗→0で非表示だった）。`/records?status=open` の絞り込みを RecordsScreen に実装（open/needs_check を「未対応」として表示・バナー文言追加）。`RecordItem` に `status`/`recordedAt` を追加
- **エクスポート**: 月キーを ISO（recordedAt）由来の `YYYY-MM` に変更し `2026年6月月` 破損を修正。AppShell のヘッダー/天気/下ナビに `print:hidden` を付与し印刷時のアプリ枠混入を解消（外枠も `print:` で展開）。`loadRecords({limit})` を追加しエクスポートは全件取得（100件上限を解除）
- **ピン種別の分類**: `saveRecord` の種別→record_type マップを全 FieldPointType に拡張（canal/levee_damage/poor_drainage/other）。`records.ts`/`recordDetail.ts` の読み戻し・ラベルも全種対応。`RecordItem.pointType` を `FieldPointType` に拡張
- **カバー写真のグループ取り違え**: `loadFarmData` で feature.properties に `group_id` を載せ、複数グループ所属時に別グループのパスへ保存されるのを防止

**ヒーロー/画像読み込み:**

- スプラッシュを作り直し（page.tsx）: スライドを重ねた opacity クロスフェード（残留＝ゴーストレイヤー解消）、画像プリロード、Ken Burns を `onLoad` 後に開始（読み込み前に動き切る問題を解消）、PaddyPhoto フォールバックで黒画面回避、setState updater 内の副作用を撤去
- 孤児コンポーネント `HeroSection.tsx` / `AppIntroSection.tsx` を削除（PR #23残骸・どこからも未参照）
- `RemotePhoto`/`RecordThumb` に `loading="lazy"`・`decoding="async"`・フェードイン追加

**導線・画面:**

- F-03: `/calendar`・`/fields`・`/records` の AppShell に `backDynamic`（戻る導線統一）
- F-06: 田んぼ詳細を再設計（状態サマリー帯／ピンを要対応優先＋状態バッジ／最近3件／カバー写真なし時の追加促し／装飾3数字を撤去）
- F-UX: 保存後は田んぼ詳細に戻る（fieldId あり）＋保存トースト。`/fields` 一覧カードを詳細ページ起点に統一

**DB:**

- migration `0006_schedule_authz.sql`: 予定の書き込みを owner/editor 限定（P1・viewer書込禁止）＋ field_id 同グループ整合トリガー追加。**Supabase本番（rice-farm-app）へ MCP で適用済み**（get_advisors 新規警告なし）

### 2026-06-13（続き2） — UX大幅強化 PR-E〜I（PR #29）

**実施内容:**

- **PR-E（スプラッシュ強化）**: Ken Burns効果（3方向）・クロスフェード遷移（前/後2レイヤー）・テキスト時間差フェードイン・プログレスバー・CSS追加（ken-burns-*/sink/fab-pop/toast-in/out）・使い方セクション7項目に拡充（全表示）

- **PR-F（戻るボタン・FAB・トースト）**: BackButtonクライアントコンポーネント新設・AppShellにbackDynamic prop追加・/records/new・/guide・/menu/siteに戻るボタン追加・FABコンポーネント（写真/音声の扇状展開）HomeScreenに配置・ToastProvider（success/error）をlayout.tsxに組み込み

- **PR-G（天気予報ヘッダー）**: 気象庁無料API連携・GPS→最近傍都道府県エリアコード選択（47都道府県対応）・WeatherHeaderコンポーネント（日時表示＋今日の天気アイコン＋タップで1週間ドロワー展開）・SVG天気アイコン6種（sunny/partly-cloudy/cloudy/rainy/snowy/thundery）・AppShellに組み込み・30分キャッシュ

- **PR-H（家族共有カレンダー）**: migration 0005（farm_schedulesテーブル・RLS・updated_atトリガー）Supabase本番適用・ScheduleデータLayer（CRUD）・CalendarScreen（月グリッド・日選択・予定追加フォーム・完了チェック・削除）・/calendar新設・BottomNavに「予定」タブ追加・IconTrash追加

- **PR-I（異常バナー・エクスポート）**: HomeScreenに未対応異常件数バナー（open/needs_check件数）・/export記録PDFエクスポートページ（年＋田んぼフィルタ・月別グループ・window.print）・メニューにエクスポートリンク追加

- **PR #29** squashマージ → main本番反映（Vercel自動デプロイ）

### 2026-06-13（続き） — UX リデザイン・Codex レビュー対応（PR #26〜#28）

**実施内容:**

- **PR #26**: fields/page.tsx の groupId 参照を `field.groupId` に修正（削除済みの state 変数参照バグ）

- **PR #27（UX リデザイン）**:
  - `src/app/page.tsx`: スプラッシュページ（全画面ヒーロー + 「アプリへ入る」ボタン、sessionStorage でスキップ）
  - `src/app/home/page.tsx`: /home ルート新設（AppShell + HomeScreen）
  - `src/features/home/HomeScreen.tsx`: 田んぼ一覧を主役に全面再設計。最近の記録・使い方 を折りたたみ（デフォルト閉）、最大 5 件
  - `src/app/fields/[id]/page.tsx`: 田んぼ詳細ページ新設（Next.js 15 準拠 `params: Promise<{id:string}>`）
  - `src/features/fields/FieldDetailScreen.tsx`: 田んぼ詳細画面（カバー写真・ピン一覧・最近の記録・記録ボタン）
  - `src/components/layout/AppShell.tsx`: backHref/backLabel props 追加・背景を緑グラデーション（from-green-50 to-gray-100）
  - `src/components/layout/BottomNav.tsx`: ホームタブを /home に変更、/fields 配下もアクティブ判定
  - `src/lib/data/siteContent.ts`: DEFAULT_SLIDES を田んぼ風景 Unsplash 画像 3 枚に変更

- **PR #28（Codex/Copilot レビュー対応）**:
  - PhotoRecordScreen / AudioRecordScreen: `?pointType=` URL パラメータの型安全バリデーション（VALID_POINT_TYPES Set）、欠落時は loadFarmData から推論
  - FieldDetailScreen / HomeScreen / fields/page.tsx: groupId を `String()` でラップしない（undefined → "undefined" 文字列バグ修正）
  - PhotoRecordScreen: 田んぼチップ選択/解除時に pointId もクリア
  - FieldDetailScreen: 全 FieldPointType（canal/levee_damage/poor_drainage/other）を POINT_TYPE_LABELS に追加
  - MapBottomSheet: 「記録する」リンクに `&pointType=` クエリ追加

---

### 2026-06-13 — PR #22〜#25 UX 刷新 4 本・post-merge 修正

**実施内容:**

- **PR-A (#22)**: `supabase/migrations/0004_field_photos_site_content.sql` 新規作成。
  - `farm_fields` に `photo_path text` カラム追加
  - `group_site_content` テーブル新設（group_id PK・hero_slides jsonb・RLS ポリシー）
  - `updated_by` を `profiles` 参照に統一、`updated_at` 自動更新トリガー追加

- **PR-B (#23)**: ヒーロー・アプリ説明・/guide・サイト設定 UI
  - `src/components/ui/RemotePhoto.tsx` 新設（img onError → PaddyPhoto fallback、failedSrc でリセット対応）
  - `src/lib/data/siteContent.ts` 新設（loadSiteContent / saveSiteContent、demo/anon は DEFAULT_SLIDES）
  - `src/features/home/HeroSection.tsx` 新設（6s 自動送りスライドショー、cleanup 対応）
  - `src/features/home/AppIntroSection.tsx` 新設（アプリ概要説明）
  - `src/app/guide/page.tsx` + `src/features/guide/GuideContent.tsx` 新設
  - `src/app/menu/site/page.tsx` + `src/features/menu/SiteContentEditor.tsx` 新設（管理者のみ表示）
  - `src/lib/data/farm.ts` に `getMyRole(groupId)` 追加（user_id フィルタで権限昇格防止）
  - `src/features/home/HomeScreen.tsx` に HeroSection + AppIntroSection 追加
  - globals.css に hero-fade / hero-zoom / rise アニメーション追加

- **PR-C (#24)**: 音声入力
  - `src/lib/hooks/useSpeechRecognition.ts` 新設（Web Speech API、ja-JP、連続モードなし、hydration-safe）
  - `src/components/ui/VoiceInputButton.tsx` 新設（非対応環境で null 返却、animate-pulse）
  - 対象 6 箇所に追加: PhotoRecordScreen / AudioRecordScreen / records/[id] / AddPinSheet / PointEditDialog / FieldNameDialog

- **PR-D (#25)**: 田んぼ実写・導線・point_id 連携
  - `src/lib/utils/imageCompress.ts` 新設（長辺 1600px / JPEG 0.8 共通ユーティリティ）
  - `src/lib/supabase/types.ts` に `photo_path` 追加
  - `src/lib/data/farm.ts` に `updateFieldPhoto()` 追加、GeoJSON に `group_id` / `photo_path` 追加
  - `src/app/fields/page.tsx` 全面改修（FieldItem に groupId、カバー写真 signed URL、カメラボタン、タップ → /records?field=）
  - `src/features/records/RecordsScreen.tsx` に `?field=` 絞り込み + 解除バナー追加
  - `src/features/map/MapBottomSheet.tsx` の「記録する」に `?field=&point=` クエリ追加
  - `src/features/records/recordDraft.ts` に `pointId` フィールド追加
  - `src/lib/data/recordSave.ts` に `point_id` insert 追加
  - `src/features/records/PhotoRecordScreen.tsx` / `AudioRecordScreen.tsx` に pointId 読込・引き継ぎ追加

- **post-merge 修正 (da99c84)**: `fields/page.tsx` のカメラボタン条件を削除済みの `groupId` 状態変数から `field.groupId` に修正。未マージ（ブランチ上）。

---

## 運用ルール

- 1 タスク 1 目的。UI 作業と DB 作業を混ぜない
- スクリーンショットまたは動画なしに UI 作業を完了扱いにしない
- main へのマージ（= 本番反映）と Supabase 変更はユーザー承認後のみ
- 通常作業は別ブランチで行う。main直pushはユーザーが明示許可した場合のみ
- 作業完了時は作業ログと残タスクを更新し、Claude Code / Codex Desktop のどちらでも再開できる状態にする
- キー・URL 等の実値はリポジトリに一切書かない
