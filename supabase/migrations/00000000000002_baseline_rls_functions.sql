-- ベースライン(2/3): RLS有効化 + ヘルパー関数 + トリガー + ポリシー
--
-- get_my_role() は SECURITY DEFINER で school_members を直接参照するため、
-- school_members 自身のポリシーからも安全に呼び出せる(RLS再帰を回避できる)。
-- この関数の所有者(postgres)は RLS をバイパスする権限を持つ。

-- ── ヘルパー関数 ─────────────────────────────────────────────────────────
create or replace function public.get_my_role(p_school_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.school_members
  where school_id = p_school_id and user_id = auth.uid()
  limit 1;
$$;

-- ── トリガー: 新規ユーザー登録時に profiles を自動作成 ──────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── トリガー: スクール作成者を自動的に admin にする ──────────────────────────
create or replace function public.handle_new_school()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.school_members (school_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_school_created
  after insert on public.schools
  for each row execute function public.handle_new_school();

-- ── トリガー: 最後の admin の削除・降格を防ぐ ────────────────────────────────
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
  target_school_id uuid;
begin
  target_school_id := coalesce(old.school_id, new.school_id);

  if (tg_op = 'DELETE' and old.role = 'admin')
     or (tg_op = 'UPDATE' and old.role = 'admin' and new.role <> 'admin') then
    select count(*) into admin_count
    from public.school_members
    where school_id = target_school_id and role = 'admin';

    if admin_count <= 1 then
      raise exception 'school_members: 最後の管理者を削除・降格することはできません';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger on_school_member_change
  before update or delete on public.school_members
  for each row execute function public.prevent_last_admin_removal();

-- ── RLS 有効化 ───────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.children enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.invitations enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────
-- 自分のプロフィール、または同じスクールに所属するメンバーのプロフィールを閲覧可能。
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.school_members my, public.school_members theirs
      where my.user_id = auth.uid()
        and theirs.user_id = profiles.id
        and theirs.school_id = my.school_id
    )
  );

create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid());

-- ── schools ──────────────────────────────────────────────────────────────
create policy schools_select on public.schools
  for select
  using (public.get_my_role(id) is not null);

create policy schools_insert on public.schools
  for insert
  with check (created_by = auth.uid());

create policy schools_update on public.schools
  for update
  using (public.get_my_role(id) = 'admin');

create policy schools_delete on public.schools
  for delete
  using (public.get_my_role(id) = 'admin');

-- ── school_members ───────────────────────────────────────────────────────
create policy school_members_select on public.school_members
  for select
  using (public.get_my_role(school_id) is not null);

create policy school_members_insert on public.school_members
  for insert
  with check (public.get_my_role(school_id) = 'admin');

create policy school_members_delete on public.school_members
  for delete
  using (public.get_my_role(school_id) = 'admin');

-- ── children ─────────────────────────────────────────────────────────────
create policy children_select on public.children
  for select
  using (
    public.get_my_role(school_id) = 'admin'
    or guardian_id = auth.uid()
  );

create policy children_insert on public.children
  for insert
  with check (
    guardian_id = auth.uid()
    and public.get_my_role(school_id) is not null
  );

create policy children_update on public.children
  for update
  using (
    public.get_my_role(school_id) = 'admin'
    or guardian_id = auth.uid()
  );

create policy children_delete on public.children
  for delete
  using (
    public.get_my_role(school_id) = 'admin'
    or guardian_id = auth.uid()
  );

-- ── events ───────────────────────────────────────────────────────────────
create policy events_select on public.events
  for select
  using (public.get_my_role(school_id) is not null);

create policy events_insert on public.events
  for insert
  with check (public.get_my_role(school_id) = 'admin');

create policy events_update on public.events
  for update
  using (public.get_my_role(school_id) = 'admin');

create policy events_delete on public.events
  for delete
  using (public.get_my_role(school_id) = 'admin');

-- ── attendance ───────────────────────────────────────────────────────────
-- 管理者はスクール内の全出欠を閲覧・訂正可能。保護者は自分の子どもの分のみ。
create policy attendance_select on public.attendance
  for select
  using (
    exists (
      select 1 from public.children c
      where c.id = attendance.child_id and c.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.id = attendance.event_id and public.get_my_role(e.school_id) = 'admin'
    )
  );

create policy attendance_insert on public.attendance
  for insert
  with check (
    exists (
      select 1 from public.children c
      join public.events e on e.id = attendance.event_id
      where c.id = attendance.child_id
        and c.school_id = e.school_id
        and (c.guardian_id = auth.uid() or public.get_my_role(e.school_id) = 'admin')
    )
  );

create policy attendance_update on public.attendance
  for update
  using (
    exists (
      select 1 from public.children c
      where c.id = attendance.child_id and c.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.id = attendance.event_id and public.get_my_role(e.school_id) = 'admin'
    )
  );

-- ── invitations ──────────────────────────────────────────────────────────
-- 招待トークンの検証(招待受諾フロー)はまだメンバーでないユーザーが行うため、
-- サーバー側で service_role クライアントを使って読む(RLSはバイパスする)。
-- authenticated からの通常アクセスは管理者による招待リンクの発行・管理のみ許可する。
create policy invitations_select on public.invitations
  for select
  using (public.get_my_role(school_id) = 'admin');

create policy invitations_insert on public.invitations
  for insert
  with check (public.get_my_role(school_id) = 'admin');

create policy invitations_delete on public.invitations
  for delete
  using (public.get_my_role(school_id) = 'admin');
