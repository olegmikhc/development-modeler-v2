-- Model-specific editing. A link never grants write access on its own.
create table public.model_editors (
 model_id uuid references public.financial_models(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 granted_by uuid not null references auth.users(id),
 primary key(model_id,user_id)
);
create table public.model_access_requests (
 id uuid primary key default gen_random_uuid(),
 model_id uuid not null references public.financial_models(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 unique(model_id,user_id)
);
alter table public.model_editors enable row level security;
alter table public.model_access_requests enable row level security;
create function public.manages_model(mid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from financial_models m where m.id=mid and can_edit_org(m.organization_id))
$$;
create function public.edits_model(mid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select manages_model(mid) or exists(select 1 from model_editors e where e.model_id=mid and e.user_id=auth.uid())
$$;
create policy model_editor_read on public.financial_models for select to authenticated using(public.edits_model(id));
create policy request_read on public.model_access_requests for select to authenticated using(user_id=auth.uid() or public.manages_model(model_id));
create policy editor_read on public.model_editors for select to authenticated using(user_id=auth.uid() or public.manages_model(model_id));
create policy editor_version_read on public.model_versions for select to authenticated using(public.edits_model(model_id));
create policy editor_version_insert on public.model_versions for insert to authenticated with check(public.edits_model(model_id) and created_by=auth.uid());

-- SECURITY DEFINER exposes only a revision-checked update; editors cannot reassign ownership.
create or replace function public.save_financial_model(model_uuid uuid,org_uuid uuid,model_name text,payload jsonb,expected_revision bigint) returns bigint language plpgsql security definer set search_path=public as $$
declare rev bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if payload->>'id' is distinct from model_uuid::text then raise exception 'Model ID mismatch';end if;
 if expected_revision=0 then
  if not can_edit_org(org_uuid) then raise exception 'Editor access required';end if;
  insert into financial_models(id,organization_id,name,data) values(model_uuid,org_uuid,model_name,payload) returning revision into rev;
 else
  if not edits_model(model_uuid) then raise exception 'Editor access required';end if;
  update financial_models set data=payload,name=model_name,revision=revision+1,updated_at=now()
   where id=model_uuid and organization_id=org_uuid and revision=expected_revision returning revision into rev;
  if rev is null then raise exception 'Conflict: refresh the model before saving';end if;
 end if;
 return rev;
end $$;
revoke all on function public.save_financial_model(uuid,uuid,text,jsonb,bigint) from public;
grant execute on function public.save_financial_model(uuid,uuid,text,jsonb,bigint) to authenticated;

create function public.request_model_edit(share_token text) returns text language plpgsql security definer set search_path=public,extensions as $$
declare mid uuid;mail text;
begin
 if auth.uid() is null then raise exception 'Sign in before requesting access';end if;
 select model_id into mid from model_shares where token_hash=encode(digest(share_token,'sha256'),'hex') and expires_at>now();
 if mid is null then raise exception 'Link expired or unavailable';end if;
 if edits_model(mid) then return 'approved';end if;
 select email into mail from auth.users where id=auth.uid();
 insert into model_access_requests(model_id,user_id,email) values(mid,auth.uid(),coalesce(mail,''))
 on conflict(model_id,user_id) do update set status='pending',created_at=now();
 return 'pending';
end $$;
create function public.resolve_model_request(request_uuid uuid,approve boolean) returns void language plpgsql security definer set search_path=public as $$
declare req model_access_requests;
begin
 select * into req from model_access_requests where id=request_uuid for update;
 if req.id is null or not manages_model(req.model_id) then raise exception 'Model manager access required';end if;
 if approve then insert into model_editors(model_id,user_id,granted_by) values(req.model_id,req.user_id,auth.uid()) on conflict do nothing;
 else delete from model_editors where model_id=req.model_id and user_id=req.user_id;end if;
 update model_access_requests set status=case when approve then 'approved' else 'rejected' end where id=request_uuid;
end $$;
revoke all on function public.manages_model(uuid),public.edits_model(uuid),public.request_model_edit(text),public.resolve_model_request(uuid,boolean) from public;
grant execute on function public.manages_model(uuid),public.edits_model(uuid),public.request_model_edit(text),public.resolve_model_request(uuid,boolean) to authenticated;
