import {describe,it,expect} from 'vitest';
import {demoModel} from './demo';
import {neutral} from '@/types/model';
import {calculatePortfolioCashFlow} from './financial-engine';
import {scopedResult,matrix,breakEvenPrice} from './sensitivity';

describe('single project company expenses',()=>{
 it('assigns all company costs and payroll once, including late payments',()=>{
  const model=demoModel();model.projects=model.projects.slice(0,1);
  const before=JSON.stringify(model);
  const total=calculatePortfolioCashFlow(model,neutral),project=total.projects[0];
  expect(project.cost).toBe(total.cost);expect(project.costs.Payroll).toBeGreaterThan(0);
  expect(project.profit).toBe(total.profit);expect(project.months).toEqual(total.months);
  expect(scopedResult(model,model.projects[0].id,neutral).cost).toBe(total.cost);
  expect(JSON.stringify(model)).toBe(before);
  model.corporate.push({id:'late',name:'Late company cost',type:'One-Time',amount:12345,start:80,duration:1,anchor:'Fixed Month',offset:0,custom:[]});
  const extended=calculatePortfolioCashFlow(model,neutral);
  expect(extended.cost-total.cost).toBe(12345);
  expect(extended.projects[0].months[79].categories['Late company cost']).toBe(12345);
  expect(extended.projects[0].cost).toBe(extended.cost);
 });
 it('uses the same company-inclusive economics in sensitivity and break-even',()=>{
  const model=demoModel();model.projects=model.projects.slice(0,1);const pid=model.projects[0].id;
  expect(matrix(model,pid,neutral)[2][2].result.cost).toBe(calculatePortfolioCashFlow(model,neutral).cost);
  expect(breakEvenPrice(model,pid,neutral).price).toBeCloseTo(breakEvenPrice(model,'portfolio',neutral).price,6);
 });
 it('returns company costs to portfolio when another project is added, without changing the total',()=>{
  const model=demoModel(),other=model.projects[1];model.projects=model.projects.slice(0,1);
  const single=calculatePortfolioCashFlow(model,neutral);
  model.projects.push({...other,units:[],costs:[],payroll:[],infrastructure:[],land:{...other.land,cost:0,pricingMode:'Manual',type:'Full Payment'},construction:{...other.construction,costPerM2:0,items:[],showVilla:undefined}});
  const multi=calculatePortfolioCashFlow(model,neutral);
  expect(multi.projects[0].cost).toBeLessThan(single.projects[0].cost);
  expect(multi.cost).toBeCloseTo(single.cost,2);
 });
});
