import {FinancialModel} from '@/types/model';
import {stageStart} from '@/lib/financial-engine';

/** Remove legacy placeholder bars, retaining every existing monetary assumption. */
export function migrateInfrastructure(model:FinancialModel):FinancialModel {
 let changed=false;
 const projects=model.projects.map(p=>{
  if(p.infrastructure!==undefined)return p;
  changed=true;
  const removed=p.timeline.stages.filter(s=>s.name==='Finishing'||s.name==='Infrastructure');
  const costs=p.costs.map(c=>{
   const stage=c.timing==='Timeline Stage'?removed.find(s=>s.name===c.stage):undefined;
   // Preserve the actual window of an existing linked expense before removing its bar.
   return stage?{...c,timing:'Custom' as const,stage:undefined,start:stageStart(p,stage),duration:stage.duration}:c;
  });
  return {...p,infrastructure:[],timeline:{...p.timeline,stages:p.timeline.stages.filter(s=>!removed.includes(s))},costs,construction:{...p.construction,items:p.construction.items.map(item=>item.name==='Finishing'?{...item,name:'Other construction'}:item)}};
 });
 return changed?{...model,projects}:model;
}
