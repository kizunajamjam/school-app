-- prevent_last_admin_removal がスクール削除そのものを阻んでしまう問題の修正
--
-- schools を削除すると school_members へ on delete cascade が波及し、その子行削除で
-- prevent_last_admin_removal が発火して「最後の管理者を削除・降格することはできません」
-- で失敗していた。結果、schools_delete ポリシーで許可しているはずの
-- 「管理者によるスクール削除」が一切実行できない状態だった。
--
-- ON DELETE CASCADE は親行削除後の AFTER トリガーとして実行されるため、
-- 子行削除の時点で親の schools 行は既に消えている。これを利用して、
-- スクールごと消えるケースだけ素通しする。

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

  -- スクール自体が削除された場合の cascade は素通しする
  if tg_op = 'DELETE' and not exists (
    select 1 from public.schools where id = target_school_id
  ) then
    return old;
  end if;

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
