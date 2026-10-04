insert into auth.users(id,email,email_confirmed_at) values
('00000000-0000-4000-8000-000000000001','owner@test.invalid',now()),
('00000000-0000-4000-8000-000000000002','friend@test.invalid',now()),
('00000000-0000-4000-8000-000000000003','stranger@test.invalid',now()),
('00000000-0000-4000-8000-000000000004','pending@test.invalid',null);
insert into organizations(id,name,owner_id) values('10000000-0000-4000-8000-000000000001','Owner org','00000000-0000-4000-8000-000000000001');
insert into organization_members values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','owner');
insert into financial_models(id,organization_id,name,data) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Shared','{"id":"20000000-0000-4000-8000-000000000001","name":"Shared","projects":[]}'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Private','{"id":"20000000-0000-4000-8000-000000000002"}');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select invite_model_viewer('20000000-0000-4000-8000-000000000001',' FRIEND@test.invalid ');
select invite_model_viewer('20000000-0000-4000-8000-000000000001','pending@test.invalid');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$declare cp jsonb;cid uuid;org uuid;begin
 if (select count(*) from list_invited_models())<>1 then raise exception 'Wrong invitation visibility';end if;
 if (select count(*) from financial_models)<>0 then raise exception 'Original leaked into editable list';end if;
 if edits_model('20000000-0000-4000-8000-000000000001') then raise exception 'Viewer became editor';end if;
 begin perform save_financial_model('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Hack','{"id":"20000000-0000-4000-8000-000000000001"}',1);raise exception 'Unexpected write';exception when others then if sqlerrm not like '%Editor access required%' then raise;end if;end;
 begin perform invite_model_viewer('20000000-0000-4000-8000-000000000001','stranger@test.invalid');raise exception 'Unexpected invite';exception when others then if sqlerrm not like '%manager access required%' then raise;end if;end;
 cp:=copy_invited_model('20000000-0000-4000-8000-000000000001');cid:=(cp->>'id')::uuid;
 if cid='20000000-0000-4000-8000-000000000001' then raise exception 'Same ID';end if;
 select organization_id into org from financial_models where id=cid;
 if org='10000000-0000-4000-8000-000000000001' or org is null then raise exception 'Wrong copy owner';end if;
 perform save_financial_model(cid,org,'My copy',cp||'{"name":"My copy"}',1);
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$begin
 if (select count(*) from list_invited_models())<>0 then raise exception 'Stranger leak';end if;
 begin perform copy_invited_model('20000000-0000-4000-8000-000000000001');raise exception 'Unexpected copy';exception when others then if sqlerrm not like '%Invitation and verified email required%' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$begin if (select count(*) from list_invited_models())<>0 then raise exception 'Unverified leak';end if;end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select revoke_model_viewer('20000000-0000-4000-8000-000000000001','friend@test.invalid');
do $$begin if (select name from financial_models where id='20000000-0000-4000-8000-000000000001')<>'Shared' then raise exception 'Original changed';end if;end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$begin
 if (select count(*) from list_invited_models())<>0 then raise exception 'Revocation failed';end if;
 if (select count(*) from financial_models)<>1 then raise exception 'Own copy lost after revocation';end if;
end $$;
reset role;
set role anon;
do $$begin
 begin perform list_invited_models();raise exception 'Anonymous leak';exception when insufficient_privilege then null;end;
end $$;
