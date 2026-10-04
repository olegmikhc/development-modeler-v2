'use client';
import {downloadBlob} from '@/lib/export/excel';
import {appPath} from '@/lib/app-path';
import {ViewerInvites} from './viewer-invites';
import {AccessRequests} from './access-requests';
import {stableJSON} from '@/lib/stable-json';
import {migrateWorkforce} from '@/lib/workforce';
import {tr,useLanguage} from '@/lib/i18n';
import {useState} from 'react';
import {Link2,Copy,LockKeyhole,Save} from 'lucide-react';
import {supabase,syncModel} from '@/lib/supabase';
import {FinancialModel} from '@/types/model';
export function ShareModel({model}:{model:FinancialModel}){useLanguage();const [link,setLink]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);const sb=supabase();
const save=async()=>{
 if(!sb)return;
 setBusy(true);setMessage('');
 try{
  const {data:auth,error:authError}=await sb.auth.getUser();
  if(authError||!auth.user?.email_confirmed_at)throw Error(tr('Sign in with a verified email to save changes.'));
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
   if(saved){const {error}=await sb.from('model_versions').insert({model_id:model.id,name:'Before saving from Share',data:saved.data});if(error)throw error;}
   await syncModel(model,org,saved?.revision??0);
  }
  window.dispatchEvent(new Event('model-cloud-saved'));
  setMessage(tr('This model is saved to cloud. You can now create a viewing link.'));
 }catch(e){setMessage(e instanceof Error?e.message:tr('Could not save the model. Your local changes are retained.'));}
 finally{setBusy(false);}
};return <div className="stack"><h3>{model.name}</h3><section className="v-share-file"><strong>Передать модель файлом</strong><p>Файл содержит только эту модель: проекты, сценарии и инвестиции. Получатель сможет импортировать и редактировать свою копию.</p><button className="btn" onClick={()=>downloadBlob(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),`${model.name}.json`)}>Скачать модель для передачи</button></section><div className="notice row"><LockKeyhole size={18}/><span>{tr("Only this model is shared for 7 days. The viewer can browse this model’s interactive pages without editing, copying or accessing other models. The link shows the latest cloud-saved version.")}</span></div>{sb&&<p>Для обмена ссылкой <a href={appPath('/login/')}>войдите в аккаунт</a>, затем сохраните эту модель в облако и создайте ссылку.</p>}{sb&&<button className="btn" disabled={busy} onClick={save}><Save size={16}/>{tr(busy?'Please wait…':'Save this model to cloud')}</button>}{!sb?<p>Обмен по ссылке пока недоступен: облако версии 2.0 не подключено. Передача файлом уже работает.</p>:<button className="btn dark" disabled={busy} onClick={async()=>{setBusy(true);setLink('');setMessage('');try{const {data:saved,error:readError}=await sb.from('financial_models').select('data').eq('id',model.id).maybeSingle();if(readError)throw readError;if(!saved||stableJSON(migrateWorkforce(saved.data))!==stableJSON(migrateWorkforce(model)))throw new Error(tr('Save the latest changes to this model in the cloud before creating a viewing link.'));const {data,error}=await sb.rpc('create_model_share',{model_uuid:model.id});if(error)throw error;const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);const viewerBase=local?(process.env.NEXT_PUBLIC_SITE_URL||'https://olegmikhc.github.io/development-modeler-v2'): `${location.origin}${appPath('')}`;setLink(`${viewerBase.replace(/\/$/,'')}/shared/?token=${encodeURIComponent(data)}`);setMessage(tr('Link created. It expires in 7 days.'))}catch(e){setMessage(e instanceof Error?e.message:'Save this model to cloud and sign in before sharing.')}finally{setBusy(false)}}}><Link2 size={16}/>{tr(" Create read-only link")}</button>}{link&&<><input aria-label={tr("Read-only model link")} value={link} readOnly/><button className="btn" onClick={()=>navigator.clipboard.writeText(link).then(()=>setMessage('Link copied.')).catch(()=>setMessage('Select and copy the link manually.'))}><Copy size={15}/>{tr(" Copy link")}</button></>}{message&&<p role="status">{message}</p>}{sb&&<ViewerInvites modelId={model.id}/>}<details><summary>{tr('Editing access')}</summary><AccessRequests modelId={model.id}/></details></div>}
