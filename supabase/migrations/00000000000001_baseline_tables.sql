-- ベースライン(1/3): テーブル定義
--
-- サッカースクール出欠管理アプリ school-app の初期スキーマ。
-- schools(スクール) を頂点に、school_members(所属: admin/guardian)、
-- children(会員=子ども)、events(練習・試合)、attendance(出欠)、
-- invitations(招待リンク) を持つ。

-- ── profiles: auth.users の 1:1 拡張 ────────────────────────────────────────
-- 表示名など、RLS越しに他メンバーへ見せてよい情報のみを持つ。
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'auth.users の公開用プロフィール(表示名等)';

-- ── schools: スクール(テナント) ──────────────────────────────────────────
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- ── school_members: スクールとユーザーの所属関係 ────────────────────────────
create table public.school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'guardian')),
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index school_members_school_id_idx on public.school_members (school_id);
create index school_members_user_id_idx on public.school_members (user_id);

-- ── children: 会員(子ども) ──────────────────────────────────────────────
-- guardian_id は profiles(id) を参照する(auth.users ではなく)。
-- profiles.id は auth.users.id と 1:1 なので参照先として問題なく、
-- PostgREST の埋め込みクエリ(children から profiles を JOIN 取得)にも必要。
create table public.children (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  grade text,
  created_at timestamptz not null default now()
);

create index children_school_id_idx on public.children (school_id);
create index children_guardian_id_idx on public.children (guardian_id);

-- ── events: 練習・試合 ───────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  title text not null,
  type text not null check (type in ('practice', 'match')),
  starts_at timestamptz not null,
  location text,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index events_school_id_idx on public.events (school_id);
create index events_starts_at_idx on public.events (starts_at);

-- ── attendance: 出欠 ─────────────────────────────────────────────────────
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  status text not null check (status in ('attending', 'absent', 'undecided')) default 'undecided',
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  unique (event_id, child_id)
);

create index attendance_event_id_idx on public.attendance (event_id);
create index attendance_child_id_idx on public.attendance (child_id);

-- ── invitations: 招待リンク ─────────────────────────────────────────────
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users (id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index invitations_school_id_idx on public.invitations (school_id);
