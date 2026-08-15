-- 出欠の締切と、アプリ内通知
--
-- 締切: イベントごとに任意で設定する。締切を過ぎると保護者は出欠を変えられない。
--       管理者は締切後も訂正できる（当日の欠席連絡を代理入力する運用があるため）。
--
-- 通知: 外部サービス（メール／プッシュ）は使わず、まずアプリ内の通知として持つ。
--       イベントの追加・変更を DB トリガーで拾うので、アプリ側の書き忘れで
--       通知が飛ばない事故が起きない。メール送信を足す場合もこのテーブルを起点にできる。

-- ── 締切 ─────────────────────────────────────────────────────────────────
alter table public.events add column deadline_at timestamptz;

comment on column public.events.deadline_at is '出欠回答の締切。NULL は締切なし';

-- 締切後は保護者の書き込みを RLS で止める。画面側でも止めるが、
-- PostgREST を直接叩かれても通らないようにする。
drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
  for insert
  with check (
    exists (
      select 1
      from public.children c
      join public.events e on e.id = attendance.event_id
      where c.id = attendance.child_id
        and c.school_id = e.school_id
        and (
          public.get_my_role(e.school_id) = 'admin'
          or (
            c.guardian_id = auth.uid()
            and (e.deadline_at is null or now() < e.deadline_at)
          )
        )
    )
  );

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
  for update
  using (
    exists (
      select 1
      from public.children c
      join public.events e on e.id = attendance.event_id
      where c.id = attendance.child_id
        and c.school_id = e.school_id
        and (
          public.get_my_role(e.school_id) = 'admin'
          or (
            c.guardian_id = auth.uid()
            and (e.deadline_at is null or now() < e.deadline_at)
          )
        )
    )
  );

-- ── 通知 ─────────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  type text not null check (type in ('event_created', 'event_updated', 'deadline_soon')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 未読の取得が主な用途なので、その形でインデックスを張る
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ── 通知を作るトリガー ───────────────────────────────────────────────────
-- 宛先はそのスクールの保護者全員。管理者は自分の操作なので通知しない。
create or replace function public.notify_guardians_of_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
  v_title text;
  v_when text;
begin
  if tg_op = 'INSERT' then
    v_type := 'event_created';
    v_title := '新しい予定が追加されました';
  else
    -- 中身が変わっていないなら通知しない（メモの微修正などで飛ばさない）
    if old.starts_at = new.starts_at
       and old.title = new.title
       and coalesce(old.location, '') = coalesce(new.location, '')
       and coalesce(old.deadline_at, 'epoch'::timestamptz)
           = coalesce(new.deadline_at, 'epoch'::timestamptz)
    then
      return new;
    end if;
    v_type := 'event_updated';
    v_title := '予定が変更されました';
  end if;

  -- 日時は日本時間で表示する
  v_when := to_char(new.starts_at at time zone 'Asia/Tokyo', 'MM/DD HH24:MI');

  insert into public.notifications (user_id, school_id, type, title, body, link)
  select
    m.user_id,
    new.school_id,
    v_type,
    v_title,
    new.title || '（' || v_when || '）',
    '/' || new.school_id || '/events/' || new.id
  from public.school_members m
  where m.school_id = new.school_id
    and m.role = 'guardian';

  return new;
end;
$$;

create trigger on_event_changed
  after insert or update on public.events
  for each row execute function public.notify_guardians_of_event();

-- ── RLS ──────────────────────────────────────────────────────────────────
-- 自分宛ての通知だけ。作成はトリガー（SECURITY DEFINER）が行う。
alter table public.notifications enable row level security;

create policy notifications_select on public.notifications
  for select
  using (user_id = auth.uid());

-- 既読にする用途のみ。他の列を書き換えられても自分の通知の範囲に閉じる。
create policy notifications_update on public.notifications
  for update
  using (user_id = auth.uid());

-- ── GRANT ────────────────────────────────────────────────────────────────
-- 利用者は読む・既読にするだけ。作成・削除はサーバー側のみ。
grant select, update on table public.notifications to authenticated;
grant select, insert, update, delete on table public.notifications to service_role;
