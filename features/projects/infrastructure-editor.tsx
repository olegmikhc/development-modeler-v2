'use client';
import {Plus,Trash2} from 'lucide-react';
import {Field,Select} from '@/components/ui/controls';
import {Adjustments,Infrastructure,Project,neutral} from '@/types/model';
import {calculateInfrastructureSpend,infrastructureWindow,timeline} from '@/lib/financial-engine';
import {money,number} from '@/lib/format';
import {modelMonthLabel} from '@/lib/model-calendar';
import {id} from '@/lib/demo';
import {tr,useLanguage} from '@/lib/i18n';

export function InfrastructureEditor({project:p,a,startDate,onChange}:{project:Project;a:Adjustments;startDate:string;onChange:(items:Infrastructure[])=>void}){
 useLanguage();
 const items=p.infrastructure||[],scenario=a.projectId&&a.projectId!==p.id?neutral:a;
 const t=timeline(p,scenario),spend=calculateInfrastructureSpend(p,scenario),fmt=(n:number)=>money(n,false,p.currency);
 const update=(id:string,patch:Partial<Infrastructure>)=>onChange(items.map(item=>item.id===id?{...item,...patch}:item));
 return <div className="stack infrastructure-editor">
  <div className="notice"><strong>{tr('Infrastructure budget')} · {p.name}</strong><p>{tr('Add a gym, restaurant or other shared facility. Its budget is added to this project; its area is not included in saleable units.')}</p><small>{tr('Exclude these amounts from the main construction budget to avoid counting them twice.')}</small></div>
  {!items.length&&<div className="editor-section"><h3>{tr('No infrastructure facilities yet')}</h3><p>{tr('Add a facility and enter its area, construction cost and schedule.')}</p></div>}
  {items.map(item=>{const w=infrastructureWindow(p,item,scenario),total=spend.filter(r=>r.infrastructureId===item.id).reduce((sum,r)=>sum+r.amount,0);return <section className="editor-section" key={item.id}>
   <div className="row spread"><h3>{item.name||tr('Infrastructure facility')}</h3><button className="delete-btn" aria-label={`${tr('Remove infrastructure facility')}: ${item.name}`} onClick={()=>onChange(items.filter(i=>i.id!==item.id))}><Trash2 size={16}/></button></div>
   <div className="form-grid">
    <Field label="Facility name" value={item.name} onChange={name=>update(item.id,{name})}/>
    <Field label="Area · m²" type="number" value={item.area} onChange={area=>update(item.id,{area})}/>
    <Field label={`${tr('Construction cost / m²')} · ${p.currency}`} type="number" value={item.costPerM2} onChange={costPerM2=>update(item.id,{costPerM2})}/>
    <Field label="Start · model month" type="number" min={1} max={240} step={1} value={w.start} help={tr('The start moves with main construction. Duration remains independent.')} onChange={start=>update(item.id,{offset:start-t.constructionStart})}/>
    <Field label="Duration · months" type="number" min={1} max={240} step={1} value={item.duration} onChange={duration=>update(item.id,{duration})}/>
    <Select label="Spend curve" value={item.curve} options={['Even','S-Curve','Front Loaded','Back Loaded']} onChange={curve=>update(item.id,{curve})}/>
   </div>
   <div className="notice"><strong>{tr('Facility budget')}: {fmt(total)}</strong><p>{number(item.area)} м² × {fmt(item.costPerM2)} / м²{scenario.construction!==0&&` × ${number(1+scenario.construction/100)} (${tr('Scenario adjustment')})`}</p><small>M{w.start}–M{w.end} · {tr(modelMonthLabel(startDate,w.start))} — {tr(modelMonthLabel(startDate,w.end))}</small></div>
   {w.end>t.handover&&<p className="warning">{tr('This facility finishes after project handover. Adjust its schedule or the handover date in Timeline.')}</p>}
  </section>})}
  <div className="row spread"><button className="btn" onClick={()=>onChange([...items,{id:id(),name:tr('New infrastructure facility'),area:0,costPerM2:0,offset:0,duration:1,curve:'Even'}])}><Plus size={15}/>{tr('Add infrastructure facility')}</button><strong>{tr('Infrastructure total')}: {fmt(spend.reduce((sum,r)=>sum+r.amount,0))}</strong></div>
  {!!items.length&&<small>{tr('Construction scenarios also apply to infrastructure prices. Costs calculated as a percentage of construction include this budget.')}</small>}
 </div>;
}
