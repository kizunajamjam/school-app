-- スクールの新規作成を禁止する
--
-- 本アプリは特定の1スクール専用。保護者が複数スクールに所属することはなく、
-- 利用者がスクールを作る場面も無い。
-- それにもかかわらず「ログイン済みユーザーなら誰でも insert 可」のままだと、
-- 招待リンクを持たない第三者がサインアップしてスクールを量産できてしまう。
--
-- 画面(/schools/new)は削除済みだが、PostgREST は誰でも直接叩けるため
-- ポリシーと GRANT の両方を落として塞ぐ。
--
-- スクール行は運用者が Supabase の SQL Editor で 1 件だけ作る:
--   insert into public.schools (name, created_by)
--   values ('スクール名', '<運営者の auth.users.id>');
-- 作成者は handle_new_school トリガーで自動的に admin になる。

drop policy if exists schools_insert on public.schools;

revoke insert on table public.schools from authenticated;

-- 補足: schools_select に残る created_by = auth.uid() の条件は、
-- INSERT ... RETURNING 対策として入れたもの。作成経路が無くなった今は
-- 実質使われないが、意味としては正しいので残しておく。
