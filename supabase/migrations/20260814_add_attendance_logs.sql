-- 出欠の変更履歴
--
-- 「保護者が直前に欠席へ変えた」「管理者が代理で訂正した」を後から追えるようにする。
-- アプリ側の書き忘れで欠測しないよう、attendance へのトリガーで自動記録する。
--
-- attendance 行そのもの(id)ではなく event_id + child_id を持つのは、
-- attendance が upsert で作り直されても履歴が切れないようにするため。

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  status text not null check (status in ('attending', 'absent', 'undecided')),
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index attendance_logs_event_child_idx
  on public.attendance_logs (event_id, child_id, changed_at desc);

-- ── 自動記録トリガー ──────────────────────────────────────────────────────
create or replace function public.log_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 同じ状態での再送信では履歴を増やさない
  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  insert into public.attendance_logs (event_id, child_id, status, changed_by)
  values (new.event_id, new.child_id, new.status, new.updated_by);

  return new;
end;
$$;

create trigger on_attendance_changed
  after insert or update on public.attendance
  for each row execute function public.log_attendance_change();

-- ── 既存の出欠を初期履歴として取り込む ────────────────────────────────────
insert into public.attendance_logs (event_id, child_id, status, changed_by, changed_at)
select event_id, child_id, status, updated_by, updated_at
from public.attendance;

-- ── RLS ──────────────────────────────────────────────────────────────────
-- 閲覧範囲は attendance と同じ。書き込みは上記トリガー(SECURITY DEFINER)経由のみ。
alter table public.attendance_logs enable row level security;

create policy attendance_logs_select on public.attendance_logs
  for select
  using (
    exists (
      select 1 from public.children c
      where c.id = attendance_logs.child_id and c.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.id = attendance_logs.event_id and public.get_my_role(e.school_id) = 'admin'
    )
  );

-- ── GRANT ────────────────────────────────────────────────────────────────
-- 利用者は読み取りのみ。挿入はトリガーが所有者権限で行う。
grant select on table public.attendance_logs to authenticated;
grant select, insert, update, delete on table public.attendance_logs to service_role;
