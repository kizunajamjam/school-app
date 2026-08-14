-- カテゴリー・クラスのマスタ追加と、children への紐付け
--
-- カテゴリー(U-10 等の学年区分)とクラス(火曜クラス、初級クラス等)は
-- スクールが定義する運営上のマスタなので、管理者だけが編集できる別テーブルとして持つ。
-- children からは1件ずつ参照する(1子ども = 1カテゴリー + 1クラス)。
--
-- 未分類の会員が存在しうるため NULL 許容とし、マスタ側が消えた場合は
-- 会員ごと消えないよう on delete set null にする。

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index categories_school_id_idx on public.categories (school_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index classes_school_id_idx on public.classes (school_id);

alter table public.children
  add column category_id uuid references public.categories (id) on delete set null,
  add column class_id uuid references public.classes (id) on delete set null;

create index children_category_id_idx on public.children (category_id);
create index children_class_id_idx on public.children (class_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
-- 閲覧はメンバー全員(保護者も選択肢として必要)、編集は管理者のみ。
alter table public.categories enable row level security;
alter table public.classes enable row level security;

create policy categories_select on public.categories
  for select
  using (public.get_my_role(school_id) is not null);

create policy categories_insert on public.categories
  for insert
  with check (public.get_my_role(school_id) = 'admin');

create policy categories_update on public.categories
  for update
  using (public.get_my_role(school_id) = 'admin');

create policy categories_delete on public.categories
  for delete
  using (public.get_my_role(school_id) = 'admin');

create policy classes_select on public.classes
  for select
  using (public.get_my_role(school_id) is not null);

create policy classes_insert on public.classes
  for insert
  with check (public.get_my_role(school_id) = 'admin');

create policy classes_update on public.classes
  for update
  using (public.get_my_role(school_id) = 'admin');

create policy classes_delete on public.classes
  for delete
  using (public.get_my_role(school_id) = 'admin');

-- ── GRANT ────────────────────────────────────────────────────────────────
grant select, insert, update, delete on table
  public.categories,
  public.classes
to authenticated, service_role;
