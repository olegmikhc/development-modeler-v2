-- Invited models are returned only by read RPCs, never loaded as editable originals.
create table public.model_viewer_invites (
 model_id uuid not null references public.financial_models(id) on delete cascade,
 email text not null check(email=lower(trim(email))),
 granted_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(model_id,email)
);
alter table public.model_viewer_invites enable row level security;
create policy viewer_invite_manage on public.model_viewer_invites for select to authenticated using(public.manages_model(model_id));
create function public.invite_model_viewer(mid uuid,recipient text) returns void language plpgsql security definer set search_path=public as $$
declare mail text:=lower(trim(recipient));
begin
 if not manages_model(mid) then raise exception 'Model manager access required';end if;
 if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verified email required';end if;
 if mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email';end if;
 if exists(select 1 from auth.users u where lower(u.email)=mail and (exists(select 1 from model_editors e where e.model_id=mid and e.user_id=u.id) or exists(select 1 from organization_members om join financial_models m on m.organization_id=om.organization_id where m.id=mid and om.user_id=u.id and om.role in ('owner','editor')))) then raise exception 'This user already has editing access. Revoke that access first.';end if;
 insert into model_viewer_invites(model_id,email,granted_by) values(mid,mail,auth.uid()) on conflict(model_id,email) do nothing;
end $$;
create function public.revoke_model_viewer(mid uuid,recipient text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not manages_model(mid) then raise exception 'Model manager access required';end if;
 delete from model_viewer_invites where model_id=mid and email=lower(trim(recipient));
end $$;
create function public.can_view_invited_model(mid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from model_viewer_invites i join auth.users u on lower(u.email)=i.email where i.model_id=mid and u.id=auth.uid() and u.email_confirmed_at is not null)
$$;
create function public.list_invited_models() returns setof jsonb language sql stable security definer set search_path=public as $$
 select m.data from financial_models m where can_view_invited_model(m.id) order by m.updated_at desc
$$;
create function public.copy_invited_model(mid uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare snapshot jsonb;new_id uuid:=gen_random_uuid();org uuid;new_name text;
begin
 if not can_view_invited_model(mid) then raise exception 'Invitation and verified email required';end if;
 select data into snapshot from financial_models where id=mid;
 if snapshot is null then raise exception 'Model unavailable';end if;
 select o.id into org from organizations o where o.owner_id=auth.uid() order by o.created_at limit 1;
 if org is null then org:=create_workspace('Personal workspace');end if;
 new_name:=coalesce(snapshot->>'name','Financial model')||' · Copy';
 snapshot:=snapshot||jsonb_build_object('id',new_id,'name',new_name,'created',now());
 insert into financial_models(id,organization_id,name,data) values(new_id,org,new_name,snapshot);
 return snapshot;
end $$;
revoke all on function public.invite_model_viewer(uuid,text),public.revoke_model_viewer(uuid,text),public.can_view_invited_model(uuid),public.list_invited_models(),public.copy_invited_model(uuid) from public;
grant execute on function public.invite_model_viewer(uuid,text),public.revoke_model_viewer(uuid,text),public.can_view_invited_model(uuid),public.list_invited_models(),public.copy_invited_model(uuid) to authenticated;
