# school-app

サッカースクール運営者向けの出欠管理アプリ。会員（子ども）のイベント（練習・試合）ごとの出欠を保護者が入力し、運営者（管理者）が管理する。

## セットアップ

### 1. Supabaseプロジェクトを作成

1. [Supabase](https://supabase.com) で新規プロジェクトを作成
2. `../supabase/migrations/` 配下の3ファイルを、SupabaseダッシュボードのSQL Editorで **番号順に** 実行する
   - `00000000000001_baseline_tables.sql`
   - `00000000000002_baseline_rls_functions.sql`
   - `00000000000003_baseline_grants.sql`
3. Supabaseダッシュボード → Authentication → Email で「Confirm email」の要否を確認（有効な場合、新規登録時に確認メールが送信される）

### 2. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に Supabaseダッシュボード → Settings → API の値を設定する。

### 3. 開発サーバー起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く。

## デモ用アカウント

プロトタイプ提示用に、管理者・保護者それぞれのアカウントを作成できます。

```bash
node --env-file=.env.local scripts/create-demo-user.mjs "<メールアドレス>" "<パスワード>" "デモ管理者" admin
```

```bash
node --env-file=.env.local scripts/create-demo-user.mjs "<メールアドレス>" "<パスワード>" "デモ保護者" guardian
```

既に同じメールが存在する場合はパスワードを上書きします。
スクール行が1件も無いと失敗するので、先に Supabase 側で作成しておいてください
（[docs/DATABASE.md](../docs/DATABASE.md) 参照）。

本来、保護者は招待リンク経由で参加します。このスクリプトはデモのために直接作るものです。

Supabase 側の制約として、メールアドレスは TLD が必要（`user@test` のような形式は拒否される）、
パスワードは既定で6文字以上です。

> ⚠️ **実際に使ったメールアドレスとパスワードをこのリポジトリに書かないでください。**
> 本リポジトリは公開されており、管理者アカウントはスクール内の全会員名・全保護者名を閲覧できます。
> 実データを入れる前に、デモアカウントは必ず削除するかパスワードを変更してください。

## 技術スタック

- Next.js 16 (App Router) / React 19 / TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS v4

## ドキュメント

- [docs/DATABASE.md](../docs/DATABASE.md) — テーブル設計・RLS方針
- [docs/ROLES.md](../docs/ROLES.md) — ロールと権限マトリクス
- [docs/SCREENS.md](../docs/SCREENS.md) — 画面一覧
