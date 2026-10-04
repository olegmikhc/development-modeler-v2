-- Synthetic fixtures only. Run in an isolated PostgreSQL, never in a real Supabase project.
insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000001','owner@test.invalid'),('00000000-0000-4000-8000-000000000002','visitor@test.invalid');
insert into organizations(id,name,owner_id) values('10000000-0000-4000-8000-000000000001','Test','00000000-0000-4000-8000-000000000001');
insert into organization_members values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','owner');
insert into financial_models(id,organization_id,name,data) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Shared','{"id":"20000000-0000-4000-8000-000000000001"}'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Private','{"id":"20000000-0000-4000-8000-000000000002"}');
insert into model_shares(model_id,token_hash,expires_at,created_by) values('20000000-0000-4000-8000-000000000001',encode(digest('test-token','sha256'),'hex'),now()+interval '1 day','00000000-0000-4000-8000-000000000001');
set role anon;
do $$begin
 if (select count(*) from financial_models)<>0 then raise exception 'Anonymous model leak';end if;
 if read_shared_model('test-token') is null then raise exception 'Valid link not readable';end if;
 if read_shared_model('invalid-token') is not null then raise exception 'Invalid link readable';end if;
end$$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if (select count(*) from financial_models)<>0 then raise exception 'Unapproved visitor leak';end if;
 begin perform save_financial_model('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Hack','{"id":"20000000-0000-4000-8000-000000000001"}',1);raise exception 'Unexpected write';exception when others then if sqlerrm not like '%Editor access required%' then raise;end if;end;
 if request_model_edit('test-token')<>'pending' then raise exception 'Request failed';end if;
 begin perform resolve_model_request((select id from model_access_requests limit 1),true);raise exception 'Self approval';exception when others then if sqlerrm not like '%manager access required%' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select resolve_model_request((select id from model_access_requests limit 1),true);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if (select count(*) from financial_models)<>1 then raise exception 'Model scope leak';end if;
 if save_financial_model('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Edited','{"id":"20000000-0000-4000-8000-000000000001"}',1)<>2 then raise exception 'Editor save failed';end if;
 begin perform save_financial_model('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Stale','{"id":"20000000-0000-4000-8000-000000000001"}',1);raise exception 'Stale write';exception when others then if sqlerrm not like '%Conflict%' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select resolve_model_request((select id from model_access_requests limit 1),false);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if (select count(*) from financial_models)<>0 then raise exception 'Revoked read';end if;
 begin perform save_financial_model('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Revoked','{"id":"20000000-0000-4000-8000-000000000001"}',2);raise exception 'Revoked write';exception when others then if sqlerrm not like '%Editor access required%' then raise;end if;end;
end$$;
reset role;
update model_shares set expires_at=now()-interval '1 day';
set role anon;
do $$begin if read_shared_model('test-token') is not null then raise exception 'Expired share readable';end if;end$$;
reset role;
