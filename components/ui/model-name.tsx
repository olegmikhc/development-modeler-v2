'use client';
import {useRef,useState} from 'react';
import {Pencil} from 'lucide-react';
import {tr,useLanguage} from '@/lib/i18n';

export function ModelName({value,onChange}:{value:string;onChange:(name:string)=>void}){
 useLanguage();const [editing,setEditing]=useState(false),[draft,setDraft]=useState(value);const cancelled=useRef(false);
 const save=()=>{if(!cancelled.current&&draft.trim()&&draft.trim()!==value)onChange(draft.trim());setEditing(false)};
 return editing?<input className="model-name-input" aria-label={tr('Developer name')} value={draft} maxLength={120} autoFocus onFocus={e=>e.target.select()} onChange={e=>setDraft(e.target.value)} onBlur={save} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}if(e.key==='Escape'){cancelled.current=true;setEditing(false)}}}/>:<h2><button className="model-name-button" title={tr('Edit developer name')} aria-label={tr('Edit developer name')} onClick={()=>{cancelled.current=false;setDraft(value);setEditing(true)}}><span>{value}</span><Pencil size={14} aria-hidden="true"/></button></h2>;
}
