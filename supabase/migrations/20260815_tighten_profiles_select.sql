-- profiles の閲覧範囲を絞る
--
-- 従来は「同じスクールのメンバーなら誰のプロフィールでも閲覧可」だった。
-- 画面には出していなかったが、保護者が PostgREST を直接叩けば
-- 他の家庭の保護者名を一覧できてしまう（会員名簿の部分的な流出）。
--
-- 実際に必要なのは次の3つだけなので、そこまで絞る:
--   1. 自分自身
--   2. 管理者から見た、自スクールのメンバー全員（会員一覧で保護者名を出すため）
--   3. 誰から見ても、自分が所属するスクールの管理者（出欠履歴の変更者名を出すため）
--
-- 結果として、保護者が他の保護者のプロフィールを読むことはできなくなる。

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select
  using (
    -- 1. 自分自身
    id = auth.uid()

    -- 2. 自分が管理者であるスクールに所属している人
    or exists (
      select 1
      from public.school_members m
      where m.user_id = profiles.id
        and public.get_my_role(m.school_id) = 'admin'
    )

    -- 3. 自分が所属しているスクールの管理者
    or exists (
      select 1
      from public.school_members m
      where m.user_id = profiles.id
        and m.role = 'admin'
        and public.get_my_role(m.school_id) is not null
    )
  );
