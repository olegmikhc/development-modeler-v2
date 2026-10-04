'use client';
import {useRef,useState} from 'react';
import {modelEnvelope} from '@/lib/validation/model';
import {copyModel} from '@/lib/copy-model';
import {useModels} from '@/store/model-store';
import {FinancialModel} from '@/types/model';
export function ModelImport({notify}:{notify:(message:string)=>void}){
 const input=useRef<HTMLInputElement>(null),[busy,setBusy]=useState(false),store=useModels();
 return <div className="v-import"><button className="btn" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Загрузка…':'Импортировать модель из файла'}</button><span>JSON из первой версии или 2.0 · откроется отдельной копией</span><input ref={input} hidden type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);try{if(file.size>10*1024*1024)throw Error('Файл больше 10 МБ.');const parsed=modelEnvelope.safeParse(JSON.parse(await file.text()));if(!parsed.success)throw Error('Файл не соответствует формату модели. Исходные модели не изменены.');const copy=copyModel(parsed.data as FinancialModel);copy.name=parsed.data.name+' · Импорт';store.importModel(copy);notify('Модель импортирована отдельной копией.')}catch(error){notify(error instanceof Error?error.message:'Не удалось прочитать файл.')}finally{setBusy(false);if(input.current)input.current.value=''}}}/></div>;
}
