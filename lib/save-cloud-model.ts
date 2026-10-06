'use client';
import {FinancialModel} from '@/types/model';
import {supabase,syncModel} from './supabase';
import {stableJSON} from './stable-json';

/** Save one complete model document; preserve the previous cloud version. */
export async function saveCloudModel(model:FinancialModel){
 const sb=supabase();
 if(!sb)throw Error('Облако не подключено.');
 const {data:auth,error:authError}=await sb.auth.getUser();
 if(authError||!auth.user?.email_confirmed_at)throw Error('Войдите в аккаунт с подтверждённой почтой.');
 const {data:saved,error}=await sb.from('financial_models').select('data,revision,organization_id').eq('id',model.id).maybeSingle();
 if(error)throw error;
 let org=saved?.organization_id;
 if(!org){
  const {data:members,error}=await sb.from('organization_members').select('organization_id').in('role',['owner','editor']).limit(1);
  if(error)throw error;
  org=members?.[0]?.organization_id;
  if(!org){const {data,error}=await sb.rpc('create_workspace',{workspace_name:'Development workspace'});if(error)throw error;org=data;}
 }
 if(!saved||stableJSON(saved.data)!==stableJSON(model)){
  if(saved){const {error}=await sb.from('model_versions').insert({model_id:model.id,name:'До сохранения в облако',data:saved.data});if(error)throw error;}
  await syncModel(model,org,saved?.revision??0);
 }
 window.dispatchEvent(new Event('model-cloud-saved'));
}
