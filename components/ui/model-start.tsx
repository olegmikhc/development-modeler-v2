'use client';
import {AppSelect} from '@/components/ui/app-select';
import {tr,useLanguage} from '@/lib/i18n';
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function ModelStart({value,onChange}:{value:string;onChange:(date:string)=>void}){
 useLanguage();const year=Number(value.slice(0,4)),month=value.slice(5,7);
 const years=Array.from({length:Math.max(2100,year)-Math.min(2000,year)+1},(_,i)=>Math.min(2000,year)+i);
 return <div className="model-start" role="group" aria-label={tr('Model start · M1')}><span>{tr('Model start · M1')}</span><AppSelect aria-label={tr('Start month')} value={month} onChange={e=>onChange(`${year}-${e.target.value}-01`)}>{months.map((name,i)=><option key={name} value={String(i+1).padStart(2,'0')}>{tr(name)}</option>)}</AppSelect><AppSelect aria-label={tr('Start year')} value={year} onChange={e=>onChange(`${e.target.value}-${month}-01`)}>{years.map(y=><option key={y} value={y}>{y}</option>)}</AppSelect></div>;
}
