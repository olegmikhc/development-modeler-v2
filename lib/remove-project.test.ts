import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {removeProject} from './remove-project';
import {migrateWorkforce} from './workforce';
import {neutral,Investment} from '@/types/model';
it('removes only project-owned records, preserves company obligations and source snapshot',()=>{
 const m=migrateWorkforce(demoModel()),pid=m.projects[0].id;
 const investment=(id:string,projectId:string|null):Investment=>({id,name:id,projectId,enabled:true,type:'annual',rate:10,compounding:'simple',incomePayment:'maturity',maturityMonth:12,autoSettle:true,tranches:[],repayments:[]});
 m.investments=[investment('project',pid),investment('company',null)];
 m.scenarios.push({id:'project-scenario',name:'Project scenario',adjustments:{...neutral,projectId:pid}});m.activeScenario='project-scenario';
 const saved=structuredClone(m),next=removeProject(m,pid);
 expect(m).toEqual(saved);expect(next.projects).toEqual(m.projects.slice(1));
 expect(next.investments?.map(i=>i.id)).toEqual(['company']);
 expect(next.scenarios.some(s=>s.id===next.activeScenario)).toBe(true);
 expect(next.scenarios.some(s=>s.adjustments.projectId===pid)).toBe(false);
 expect(next.workforce).toEqual(m.workforce);expect(next.corporate).toEqual(m.corporate);
});
it('supports deleting the last project and ignores an unknown ID',()=>{
 const m=demoModel();m.projects=m.projects.slice(0,1);m.scenarios=[{id:'only',name:'Only',adjustments:{...neutral,projectId:m.projects[0].id}}];m.activeScenario='only';
 expect(removeProject(m,'missing')).toBe(m);
 const next=removeProject(m,m.projects[0].id);expect(next.projects).toEqual([]);expect(next.activeScenario).toBe('base');expect(next.scenarios[0].adjustments).toEqual(neutral);
});
