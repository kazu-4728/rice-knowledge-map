# AGENTS.md

`rice-knowledge-map` で作業するエージェント（Codex / Claude Code）向けの基本ルールです。

---

## 1. UI判断の基準

- 1画面に情報を詰め込まない。見た目を悪くする要素は「小さくする・下部シートへ・タップ後に出す・別画面へ移す」のいずれかで扱う
- マップ以外の画面（/home /fields /records /calendar）もマップと同じ基準で整える
- 迷ったら「写真を撮る → 話す → 保存する → 地図に残る」が短くなる方を選ぶ

## 2. 目指す方向

- フルスクリーンに近い実画像マップ（/map）
- 薄く軽いヘッダー
- 下部ボトムシートで追加情報
- フローティング操作ボタン（片手で届く位置）
- 写真・音声記録への強い導線
- 余白・角丸・半透明のあるスマホアプリUI
- マップ以外の画面も「次の1操作が明確」な構造にする

## 3. 避ける方向

- 古い業務システム風
- 管理ダッシュボード風（表や一覧が主役）
- 白いカードを並べるだけの画面
- 大きすぎるヘッダー・多すぎるフィルター
- 天気・予定・同期状態が主役に見える画面
- 情報と操作ボタンが混在した画面

## 4. 技術方針

```text
Frontend : Next.js 15.3（App Router）
Language : TypeScript 5.8
UI       : React 19 + Tailwind CSS 4
Map      : MapLibre GL JS 5.24
Base map : 国土地理院 空中写真タイル
Backend  : Supabase Auth / Postgres / Storage / RLS
Deploy   : Vercel（main マージで自動デプロイ）
```

- UI確認も最終実装もNext.js内で行う。HTMLだけの別モックは原則作らない
- Tailwind CSS v4 を標準とし、`globals.css` は必要最小限にする
- `npx tsc --noEmit` + `npm run lint` + `npm run build` でセルフレビューを必ず行う

## 5. 現在のフェーズ（2026-06-26）

UI/UX 改善フェーズ。現在はユーザーが実機で困った導線を1件ずつ直す段階です。

残タスクの詳細・実機確認の記録は `tasks/TASKS.md` を参照。Claude Code 固有の引き継ぎは `CLAUDE.md` を参照。

## 6. 作業ルール

- 1 PR = 1目的。UI改修・DB変更・機能追加を混ぜない
- UIタスクの DONE 条件: Vercel Preview URL がある、既存5代表フローが壊れていない、iPhone実機確認済み（iOSタッチが関わる場合）
- 実装コード以外の変更（docs・tasks）は実装 PR に混ぜない
- Supabase への変更（migration 適用・Storage 設定）はユーザー承認後のみ
