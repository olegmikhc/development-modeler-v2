import {describe,it,expect} from 'vitest';
import {createProject,demoModel,id} from '@/lib/demo';
import {Infrastructure,neutral} from '@/types/model';
import {calculateConstructionSpend,calculateInfrastructureSpend,calculateProjectCashFlow,calculatePortfolioCashFlow,infrastructureWindow,moveInfrastructure,timeline} from './index';
import {migrateInfrastructure} from '@/lib/infrastructure-migration';
import {modelEnvelope} from '@/lib/validation/model';
import {fitTimeline} from '@/lib/fit-timeline';
const gym=():Infrastructure=>({id:id(),name:'Gym',area:200,costPerM2:1000,offset:2,duration:4,curve:'Even'});
const sum=(rows:{amount:number}[])=>rows.reduce((s,r)=>s+r.amount,0);
describe('infrastructure budgets',()=>{
 it('adds 200k plus 5% contingency to the owner project, without adding saleable inventory or revenue',()=>{
  const m=demoModel(),before=calculatePortfolioCashFlow(m),p=m.projects[0],baseBuild=sum(calculateConstructionSpend(p));p.infrastructure=[gym()];
  const after=calculatePortfolioCashFlow(m);
  expect(after.cost-before.cost).toBeCloseTo(210000,2);
  expect(after.projects[0].cost-before.projects[0].cost).toBeCloseTo(210000,2);
  expect(after.projects[1]).toEqual(before.projects[1]);
  expect(after.revenue).toBe(before.revenue);expect(after.gla).toBe(before.gla);expect(after.units).toBe(before.units);
  expect(sum(calculateConstructionSpend(p))).toBe(baseBuild);
  expect(calculateInfrastructureSpend(p).map(r=>[r.month,r.amount])).toEqual([[7,50000],[8,50000],[9,50000],[10,50000]]);
  expect(after.costs['Infrastructure · Gym']).toBe(200000);
 });
 it('keeps fractional budgets exact across curves and applies only the selected project scenario',()=>{
  const p=createProject();p.infrastructure=[{...gym(),area:17.33,costPerM2:999.99,duration:7,curve:'S-Curve'}];
  expect(sum(calculateInfrastructureSpend(p,{...neutral,construction:10}))).toBeCloseTo(19062.81,2);
  expect(sum(calculateInfrastructureSpend(p,{...neutral,construction:10,projectId:'another'}))).toBeCloseTo(17329.83,2);
 });
 it('moves with main construction but uses independent duration, and includes late expenses beyond horizon',()=>{
  const p=createProject();p.costs=[];p.infrastructure=[{...gym(),offset:50}];
  expect(infrastructureWindow(p,p.infrastructure[0],{...neutral,pbgDelay:3,constructionDuration:10})).toEqual({start:58,duration:4,end:61});
  const result=calculateProjectCashFlow(p);expect(result.months).toHaveLength(58);expect(result.months[57].categories['Infrastructure · Gym']).toBe(50000);
  const moved=moveInfrastructure(p,p.infrastructure[0].id,-100);expect(infrastructureWindow(moved,moved.infrastructure![0]).start).toBe(1);
  const resized=moveInfrastructure(moved,p.infrastructure[0].id,2,'end');expect(sum(calculateInfrastructureSpend(resized))).toBeCloseTo(200000,2);expect(resized.infrastructure![0].duration).toBe(6);
 });
 it('retains facilities through validation and fits their schedules without changing their budgets',()=>{
  const m=demoModel();m.projects[0].infrastructure=[{...gym(),offset:30}];
  expect(modelEnvelope.parse(m).projects[0].infrastructure).toEqual(m.projects[0].infrastructure);
  const fit=fitTimeline(m,24),p=fit.projects[0];expect(infrastructureWindow(p,p.infrastructure![0]).end).toBe(24);expect(sum(calculateInfrastructureSpend(p))).toBe(200000);
  expect(modelEnvelope.safeParse({...m,projects:[{...m.projects[0],infrastructure:[{...gym(),area:-1}]}]}).success).toBe(false);
 });
 it('removes legacy bars without deleting budgets or losing linked expense timing',()=>{
  const m=demoModel(),p=m.projects[0];delete p.infrastructure;
  p.timeline.stages.push({name:'Finishing',start:19,duration:3,anchor:'Construction Start',offset:14},{name:'Infrastructure',start:17,duration:5,anchor:'Construction Start',offset:12});
  p.construction.mode='Advanced';p.construction.items.push({name:'Finishing',amount:777});
  p.costs.push({id:id(),name:'External works',amount:12000,driver:'Fixed $',timing:'Timeline Stage',stage:'Infrastructure',start:1,duration:1});
  const before=calculateProjectCashFlow(p),upgraded=migrateInfrastructure(m),q=upgraded.projects[0];
  expect(q.timeline.stages.map(s=>s.name)).not.toContain('Finishing');expect(q.timeline.stages.map(s=>s.name)).not.toContain('Infrastructure');
  expect(q.infrastructure).toEqual([]);expect(calculateProjectCashFlow(q)).toEqual(before);
  expect(migrateInfrastructure(upgraded)).toBe(upgraded);expect(p.infrastructure).toBeUndefined();expect(p.timeline.stages).toHaveLength(4);
 });
 it('deleting a facility removes only its extra costs',()=>{const p=createProject(),before=calculateProjectCashFlow(p);p.infrastructure=[gym()];expect(calculateProjectCashFlow(p).cost).toBeGreaterThan(before.cost);p.infrastructure=[];expect(calculateProjectCashFlow(p)).toEqual(before);expect(timeline(p).handover).toBe(23)});
});
