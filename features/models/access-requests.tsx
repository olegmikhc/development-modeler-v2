'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {tr,useLanguage} from '@/lib/i18n';
type Request={id:string;email:string;status:string};
export function AccessRequests({modelId}:{modelId:string}){
 useLanguage();const [rows,setRows]=useState<Request[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[manager,setManager]=useState(false);
 const load=async()=>{const sb=supabase();if(!sb)return;const permission=await sb.rpc('manages_model',{mid:modelId});if(permission.error){setMessage(tr('Access management requires the collaboration migration.'));return}setManager(permission.data===true);if(!permission.data)return;const {data,error}=await sb.from('model_access_requests').select('id,email,status').eq('model_id',modelId).order('created_at',{ascending:false});if(error)setMessage(error.message);else setRows(data||[])};
 useEffect(()=>{void load()},[modelId]);
 const resolve=async(id:string,approve:boolean)=>{setBusy(true);const {error}=await supabase()!.rpc('resolve_model_request',{request_uuid:id,approve});if(error)setMessage(error.message);else {setMessage(tr('Access updated.'));await load()}setBusy(false)};
 return <section className="stack"><div className="row spread"><h3>{tr('Editing access')}</h3><button className="btn" onClick={load}>{tr('Refresh')}</button></div>{manager&&!rows.length&&<p>{tr('No access requests yet.')}</p>}{manager&&rows.map(r=><div key={r.id} className="row spread"><div>{r.email}<small style={{display:'block'}}>{tr(r.status)}</small></div><div className="row">{r.status!=='approved'&&<button className="btn dark" disabled={busy} onClick={()=>resolve(r.id,true)}>{tr('Allow editing')}</button>}{r.status!=='rejected'&&<button className="btn" disabled={busy} onClick={()=>resolve(r.id,false)}>{tr(r.status==='approved'?'Revoke access':'Decline')}</button>}</div></div>)}{message&&<p role="status">{message}</p>}</section>;
}
