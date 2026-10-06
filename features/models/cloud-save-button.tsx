'use client';
import {useRef,useState} from 'react';
import {CloudUpload,Check,LoaderCircle} from 'lucide-react';
import {FinancialModel} from '@/types/model';
import {saveCloudModel} from '@/lib/save-cloud-model';
import {stableJSON} from '@/lib/stable-json';
import {appPath} from '@/lib/app-path';
export function CloudSaveButton({model}:{model:FinancialModel}){
 const [busy,setBusy]=useState(false),[saved,setSaved]=useState(''),[error,setError]=useState('');
 const running=useRef(false),snapshot=stableJSON(model),isSaved=saved===snapshot;
 const save=async()=>{
  if(running.current)return;running.current=true;setBusy(true);setError('');
  const document=structuredClone(model),captured=stableJSON(document);
  try{await saveCloudModel(document);setSaved(captured)}
  catch(e){setError(e instanceof Error?e.message:typeof e==='object'&&e&&'message' in e?String(e.message):'Не удалось сохранить. Попробуйте ещё раз.')}
  finally{running.current=false;setBusy(false)}
 };
 return <div className="sidebar-cloud-save"><button className={`cloud-save-button ${isSaved?'saved':''}`} disabled={busy} onClick={save} title={`Сохранить все данные модели «${model.name}» в Supabase`}>
 {busy?<LoaderCircle className="cloud-save-spinner" size={19}/>:isSaved?<Check size={19}/>:<CloudUpload size={19}/>}
 <span>{busy?'Сохраняем…':isSaved?'Сохранено в облаке':'Сохранить в облако'}</span></button>
 <p role="status" className={error?'cloud-save-error':''}>{error|| (busy?'Отправляем данные выбранной модели':isSaved?'Все данные этой модели сохранены':saved?'Есть изменения — сохраните их в облако':'Проекты, расходы, сценарии и инвестиции')}</p>
 {error&&<a href={appPath('/login/')}>Вход в облачный аккаунт ↗</a>}
 </div>;
}
