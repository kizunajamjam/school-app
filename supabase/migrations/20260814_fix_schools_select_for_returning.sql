-- schools_select が INSERT ... RETURNING を弾いてしまう問題の修正
--
-- PostgreSQL は INSERT ... RETURNING の際、挿入行に対して INSERT の WITH CHECK だけでなく
-- SELECT ポリシーの USING も評価する。
-- (PostgreSQL ドキュメント「Row Security Policies」の Policies Applied by Command Type 表を参照)
--
-- schools_select は get_my_role(id) IS NOT NULL だったが、スクール作成のその瞬間は
-- 作成者はまだ school_members に存在しない。作成者を admin にする handle_new_school は
-- AFTER INSERT トリガーで、ポリシー評価より後に走るためである。
-- 結果 SELECT ポリシーが false となり、INSERT 自体は正しいのに 42501 で失敗していた。
--
-- supabase-js の .insert().select() は Prefer: return=representation を送るため必ず
-- RETURNING になる。作成者が自分の作ったスクールを見られるのは当然なので、
-- SELECT ポリシーに created_by = auth.uid() を追加して解消する。

drop policy schools_select on public.schools;

create policy schools_select on public.schools
  for select
  using (
    public.get_my_role(id) is not null
    or created_by = auth.uid()
  );
