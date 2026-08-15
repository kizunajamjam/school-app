-- クラスは掛け持ちがあるため、children.class_id（1件）から中間テーブルへ移行する
--
-- カテゴリー（U-10 等の学年区分）は1人1つのままでよいが、
-- クラス（火曜クラス等）は「火曜と土曜の両方に通う」ような掛け持ちが実際にある。

create table public.child_classes (
  child_id uuid not null references public.children (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (child_id, class_id)
);

create index child_classes_class_id_idx on public.child_classes (class_id);

-- 既存の割り当てを移行してから列を落とす
insert into public.child_classes (child_id, class_id)
select id, class_id
from public.children
where class_id is not null;

alter table public.children drop column class_id;

-- ── RLS ──────────────────────────────────────────────────────────────────
-- 見え方は children と揃える（管理者はスクール内全件、保護者は自分の子どもの分のみ）。
alter table public.child_classes enable row level security;

create policy child_classes_select on public.child_classes
  for select
  using (
    exists (
      select 1 from public.children c
      where c.id = child_classes.child_id
        and (c.guardian_id = auth.uid() or public.get_my_role(c.school_id) = 'admin')
    )
  );

create policy child_classes_insert on public.child_classes
  for insert
  with check (
    exists (
      select 1 from public.children c
      where c.id = child_classes.child_id
        and (c.guardian_id = auth.uid() or public.get_my_role(c.school_id) = 'admin')
    )
    -- 他スクールのクラスを紐付けられないようにする
    and exists (
      select 1 from public.classes cl, public.children c
      where cl.id = child_classes.class_id
        and c.id = child_classes.child_id
        and cl.school_id = c.school_id
    )
  );

create policy child_classes_delete on public.child_classes
  for delete
  using (
    exists (
      select 1 from public.children c
      where c.id = child_classes.child_id
        and (c.guardian_id = auth.uid() or public.get_my_role(c.school_id) = 'admin')
    )
  );

-- ── GRANT ────────────────────────────────────────────────────────────────
-- 付け外しのみで、更新の概念は無い。
grant select, insert, delete on table public.child_classes to authenticated;
grant select, insert, update, delete on table public.child_classes to service_role;
