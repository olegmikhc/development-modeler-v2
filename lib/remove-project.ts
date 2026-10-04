import {FinancialModel,neutral} from '@/types/model';
import {migrateWorkforce} from './workforce';

/** Remove project-owned records without reassigning their obligations to the portfolio. */
export function removeProject(input:FinancialModel,projectId:string):FinancialModel {
 if(!input.projects.some(p=>p.id===projectId))return input;
 const model=migrateWorkforce(input);
 const scenarios=model.scenarios.filter(s=>s.adjustments.projectId!==projectId);
 if(!scenarios.length)scenarios.push({id:'base',name:'Базовый',adjustments:{...neutral}});
 return {...model,
  projects:model.projects.filter(p=>p.id!==projectId),
  investments:model.investments?.filter(i=>i.projectId!==projectId),
  scenarios,
  activeScenario:scenarios.some(s=>s.id===model.activeScenario)?model.activeScenario:(scenarios.find(s=>s.id==='base')||scenarios[0]).id,
  resources:model.resources.map(r=>({...r,allocations:Object.fromEntries(Object.entries(r.allocations).filter(([id])=>id!==projectId))})),
 };
}
