# データベース設計

Supabase (PostgreSQL) を使用。マイグレーションは `supabase/migrations/` にあり、**ファイル名順に**適用する。

1. `00000000000001_baseline_tables.sql` — テーブル定義
2. `00000000000002_baseline_rls_functions.sql` — RLS有効化・ヘルパー関数・トリガー・ポリシー
3. `00000000000003_baseline_grants.sql` — GRANT（RLSとは別に必要）
4. `20260814_fix_schools_select_for_returning.sql` — 後述の RETURNING 問題の修正
5. `20260814_fix_last_admin_trigger_on_cascade.sql` — スクール削除がトリガーで阻まれる問題の修正
6. `20260814_add_categories_and_classes.sql` — カテゴリー・クラスのマスタ追加
7. `20260814_add_attendance_logs.sql` — 出欠の変更履歴
8. `20260815_lock_school_creation.sql` — スクール新規作成の禁止
9. `20260815_tighten_profiles_select.sql` — profiles の閲覧範囲を絞る

## 前提: 単一スクール専用アプリ

本アプリは特定の1スクール専用。保護者が複数スクールに所属することはない
（1人の保護者が複数の子どもを通わせることはある）。

スキーマは `schools` を頂点とするマルチテナント構成のままだが、これは RLS の土台
（`get_my_role(school_id)`）として機能しているため残している。運用上は `schools` の行は1件だけ。

**スクール行は運用者が SQL で1件だけ作る**（アプリからは作れない）:

```sql
insert into public.schools (name, created_by)
values ('スクール名', '<運営者の auth.users.id>');
```

作成者は `handle_new_school` トリガーで自動的に `admin` になる。

## テーブル

| テーブル | 説明 |
| --- | --- |
| `profiles` | `auth.users` の1:1拡張。表示名を持つ。ユーザー登録時にトリガーで自動作成 |
| `schools` | スクール（テナント） |
| `school_members` | スクールへの所属。`role`: `admin` \| `guardian` |
| `categories` | カテゴリー（U-10 等の学年区分）。スクール単位のマスタ。管理者のみ編集可 |
| `classes` | クラス（火曜クラス等）。スクール単位のマスタ。管理者のみ編集可 |
| `children` | 会員（子ども）。`guardian_id` は登録した保護者(`profiles.id`)。`category_id` / `class_id` を各1件参照 |
| `events` | 練習・試合。`type`: `practice` \| `match` |
| `attendance` | 出欠。`event_id` + `child_id` で一意。`status`: `attending` \| `absent` \| `undecided` |
| `attendance_logs` | 出欠の変更履歴。`attendance` へのトリガーで自動記録。利用者は読み取りのみ |
| `invitations` | 招待リンク。`token` + `expires_at`（7日間有効、失効しない限り使い回し可能） |

`children.category_id` / `class_id` は NULL 許容（未分類の会員がありうる）で、マスタ削除時は
`on delete set null`。他スクールのマスタIDを送り込まれないよう、Server Action 側でも
自スクールの一覧に含まれるか検証している（`children/actions.ts` の `resolveMasterIds`）。

## ロールとアクセス制御

- 単一スクール内のロールは `admin`（運営者）と `guardian`（保護者）の2種類のみ
- スクール作成者は `handle_new_school` トリガーで自動的に `admin` になる
- `prevent_last_admin_removal` トリガーが、最後の管理者の削除・降格を防ぐ

RLSは `get_my_role(p_school_id)`（`SECURITY DEFINER`）を軸に構成：

- `schools`: 閲覧はメンバーのみ、**作成は禁止**（ポリシーと GRANT の両方を剥奪済み）、更新・削除は管理者のみ
- `children` / `attendance`: 管理者はスクール内全件、保護者は自分の子どもの分のみ
- `events` / `categories` / `classes`: 閲覧はメンバー全員、作成・変更・削除は管理者のみ
- `invitations`: 閲覧・作成・削除とも管理者のみ
- `profiles`: 自分自身／管理者から見た自スクールのメンバー／自分が所属するスクールの管理者、のみ閲覧可。
  保護者が他の保護者のプロフィール（氏名）を読むことはできない
- 招待受諾（`acceptInvitationAsGuardian`）は新規メンバーがまだ`school_members`に存在しないため、`lib/supabase/admin.ts` の service role クライアントでRLSをバイパスして実行する

## ハマりどころ（実際に踏んだもの）

### INSERT ... RETURNING は SELECT ポリシーも評価する

PostgreSQL は `INSERT ... RETURNING` の際、挿入行に対して INSERT の `WITH CHECK` だけでなく
**SELECT ポリシーの `USING` も評価する**。supabase-js の `.insert().select()` は
`Prefer: return=representation` を送るため必ず RETURNING になる。

`schools_select` を `get_my_role(id) IS NOT NULL` だけにしていたところ、スクール作成の瞬間は
作成者がまだ `school_members` に居ない（`handle_new_school` は AFTER INSERT）ため
SELECT ポリシーが false になり、INSERT 自体は正しいのに `42501` で失敗していた。
`created_by = auth.uid()` を SELECT ポリシーに足して解消している。

**新しいテーブルを足すときは、「INSERT 直後のその行が SELECT ポリシーを通るか」を必ず確認すること。**

### cascade 削除と BEFORE DELETE トリガーの併用

`schools` を消すと `school_members` へ `on delete cascade` が波及し、そこで
`prevent_last_admin_removal` が誤発火してスクール削除が一切できなくなっていた。
cascade は親行削除後の AFTER トリガーとして走るため、子トリガー側で
「親がもう存在しないなら素通し」する早期 return を入れて解消している。

## 拡張時の注意

- 「1子どもに複数の保護者」が必要になった場合は `child_guardians` 中間テーブルへの移行を検討（現状は `children.guardian_id` 1本のみ）
- 管理者の権限分離（コーチ等）が必要になった場合は `school_members.role` の check制約とRLSポリシーの拡張が必要
- カテゴリー・クラスの表示順は `created_at`（登録順）。並べ替えが必要になれば `sort_order` 列の追加を検討
