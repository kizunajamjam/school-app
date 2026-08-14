-- ベースライン(3/3): テーブル権限(GRANT)
--
-- RLS はあくまで「行」の制御。テーブルへの操作自体を許可する GRANT が
-- 別途必要(service_role も RLS はバイパスするが GRANT は必要)。
-- anon にはデータ権限を一切与えない(スクール名等の公開ページは本アプリでは提供しない)。

grant select, insert, update, delete on table
  public.profiles,
  public.schools,
  public.school_members,
  public.children,
  public.events,
  public.attendance
to authenticated, service_role;

-- invitations: 更新の概念が無い(発行と失効=削除のみ)。
-- トークン検証は未所属ユーザーが行うためサーバー側 service_role で読む。
grant select, insert, delete on table public.invitations to authenticated;
grant select, insert, update, delete on table public.invitations to service_role;
