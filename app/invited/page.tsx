'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {appPath} from '@/lib/app-path';
import {modelEnvelope} from '@/lib/validation/model';
import {FinancialModel} from '@/types/model';
import {useModels} from '@/store/model-store';
import {ModelViewer} from '@/features/models/model-viewer';
import {useVerifiedEditor} from '@/features/models/use-verified-editor';
import {tr,useLanguage} from '@/lib/i18n';
import {LanguageSwitch} from '@/components/ui/language-switch';
export default function InvitedModels(){
 useLanguage();const verified=useVerifiedEditor(),[models,setModels]=useState<FinancialModel[]>([]),[selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);setMessage('');const sb=supabase();if(!sb){setMessage(tr('Cloud workspace is not configured.'));setLoading(false);return}try{const {data,error}=await sb.rpc('list_invited_models');if(error)throw Error(error.message);setModels((data||[]).map((m:unknown)=>modelEnvelope.parse(m) as FinancialModel));}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setLoading(false)}};
 useEffect(()=>{if(verified)void load();else {setModels([]);setSelected(null)}},[verified]);
 const copy=async(id:string)=>{setBusy(true);setMessage('');try{const {data,error}=await supabase()!.rpc('copy_invited_model',{mid:id});if(error)throw Error(error.message);const m=modelEnvelope.parse(data) as FinancialModel;useModels.getState().importModel(m);window.location.assign(appPath('/'));}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 if(verified===null)return <div className="boot">{tr('Loading…')}</div>;
 if(!verified)return <main style={{margin:'40px auto',width:'90%',maxWidth:650}}><h1>{tr('Models shared with me')}</h1><p>{tr('Sign in with the verified email used in your invitation.')}</p><a className="btn dark" href={appPath('/login/')}>{tr('Sign in')}</a></main>;
 const model=models.find(m=>m.id===selected);
 return <><header className="shared-toolbar"><a className="btn" href={appPath('/')}>{tr('My workspace')}</a>{model?<><button className="btn" onClick={()=>setSelected(null)}>{tr('Models shared with me')}</button><button className="btn dark" disabled={busy} onClick={()=>copy(model.id)}>{tr('Create my editable copy')}</button></>:<><h1>{tr('Models shared with me')}</h1><button className="btn" disabled={loading} onClick={load}>{tr('Refresh')}</button></>}<LanguageSwitch/>{message&&<p role="status">{message}</p>}</header>{model?<ModelViewer key={model.id} model={model}/>:<div className="content"><p>{tr('Originals are read-only. Your copies are saved separately in your account.')}</p>{loading?<p>{tr('Loading…')}</p>:!models.length?<p>{tr('No invitations for this email yet.')}</p>:<div className="project-cards">{models.map(m=><section className="card" key={m.id}><h2>{m.name}</h2><p>{m.projects.length} {tr('projects')}</p><div className="row" style={{flexWrap:'wrap',marginTop:16}}><button className="btn" onClick={()=>setSelected(m.id)}>{tr('View model')}</button><button className="btn dark" disabled={busy} onClick={()=>copy(m.id)}>{tr('Create my editable copy')}</button></div></section>)}</div>}</div>}</>;
}
