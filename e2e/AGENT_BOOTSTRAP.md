# E2E資格情報のセッション間引き継ぎ（Claude Code向け）

E2E（`npx playwright test`）は実Supabaseに接続するため、`.env.local` /
`.env.e2e.local`（ともに`.gitignore`対象）に資格情報が必要。これらは
コンテナ固有のファイルのため、Claude Codeのセッションをまたぐと消える。

このファイルは、Claude Codeセッションが**実値をリポジトリに書かずに**
その都度これらのファイルを再発行するための手順書。Supabase MCP接続
（プロジェクトの管理者権限）はセッションのファイルシステムと異なり
アカウント単位で維持されるため、ここに書いた手順さえ分かれば
毎回Secretsを新規登録しなくても再現できる。

対象プロジェクト: `rice-farm-app`（project_id: `uakcrkylonvgcmwuyyyk`。
本番URLのホスト名の一部であり非公開情報ではない）。
E2E専用アカウント: `e2e-verifier@rice-knowledge-map.test`
（専用グループ、RLSで実データと分離。パスワードのみ管理者権限で都度発行する）。

## 手順

### 1. まず既存の資格情報が生きているか確認する

```
node scripts/e2e-check-auth.mjs
```

`OK` が出たら以下の手順は不要。そのまま `npx playwright test` を実行してよい。
`MISSING: ...` または `LOGIN_FAILED: ...` が出た場合のみ次に進む。

### 2. Supabase MCPで公開情報を取得する

- `get_project_url`（project_id: `uakcrkylonvgcmwuyyyk`）→ Supabase URL
- `get_publishable_keys`（同project_id）→ `disabled`でない鍵のうち、
  `sb_publishable_...`形式（modern publishable key）を優先して使う。
  `anon`（legacy JWT）は将来無効化される可能性があるため新規手順では使わない
  （`tasks/TASKS.md`「次の実行候補」のlegacy anonキー無効化を参照）。

どちらも公開情報（本番アプリのクライアントバンドルに含まれる値。
`.env.local`が.gitignore対象なのは運用上の慣例であり、値そのものは非公開情報ではない）。

### 3. Supabase MCPでE2Eアカウントのパスワードを再発行する

`execute_sql`（project_id: `uakcrkylonvgcmwuyyyk`）で、ランダムな新パスワードを
生成してから以下を実行する（`<新パスワード>`は都度生成した値に置き換える。
実行結果やパスワードそのものをコミットメッセージ・PR本文・チャット外の
場所に書き残さない）。

新パスワードは**英数字のみ**で生成する（`'`はSQL文字列を破壊し、
`$`・空白・バッククォート等は手順4の未クォートなシェル代入で
展開・分割されるため、DBに設定した値と`.env`に書く値がずれてログイン
不能になる）。例: `openssl rand -hex 16`（0-9a-fのみ、32文字）。

```sql
update auth.users
set encrypted_password = crypt('<新パスワード>', gen_salt('bf')),
    updated_at = now()
where email = 'e2e-verifier@rice-knowledge-map.test'
returning id, email;
```

`pgcrypto`拡張は`0001_init.sql`で有効化済みのため追加設定は不要。

### 4. .env.local / .env.e2e.local を書き出す

```
SUPABASE_URL=<手順2で取得したURL> \
SUPABASE_ANON_KEY=<手順2で取得したanonキー> \
E2E_EMAIL=e2e-verifier@rice-knowledge-map.test \
E2E_PASSWORD=<手順3で設定した新パスワード> \
  node scripts/e2e-write-env.mjs
```

### 5. 再確認してからE2Eを実行する

```
node scripts/e2e-check-auth.mjs
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test
```

`PW_CHROMIUM_PATH`は、プリインストール済みのChromiumバージョンと
Playwrightが既定で探すバージョンが異なる場合の回避策（playwright.config.ts参照）。
実際に必要かはセッションの環境による。

## 既知の制限

Claude Codeのリモート/クラウド実行環境では、ヘッドレスChromiumの
ブラウザプロセス自体が外部HTTPS（Supabase含む）へ到達できないことがある
（詳細は`playwright.config.ts`冒頭のコメント参照）。この場合、資格情報が
正しくてもブラウザ側の非同期データ取得を待つテストだけ失敗する
（静的なUI確認テストは正常に通る）。ログイン（globalSetup）は通常のNode
実行なので、この制限の影響を受けない。
