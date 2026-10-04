import {describe,it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {neutral} from '@/types/model';
import {calculateProjectRevenue,calculateProjectCashFlow,calculatePortfolioCashFlow,calculateCorporateOverhead,costAmount,round} from './index';

describe('percentage costs and P&L use the same contract revenue',()=>{
 for(const count of [0,2,20])it(`uses manually scheduled revenue for ${count} units, including incomplete or excess allocations`,()=>{
  const p=demoModel().projects[0];p.salesMode='MANUAL';
  p.units.forEach(u=>u.tiers.forEach(t=>{t.manual=[]}));
  p.units[0].tiers[0].manual=[count];
  const commission=p.costs.find(c=>c.name==='Sales Commission')!;commission.amount=12;
  const a={...neutral,price:7,commission:20};
  const result=calculateProjectCashFlow(p,a);
  expect(calculateProjectRevenue(p,a)).toBe(result.revenue);
  expect(result.revenue).toBe(round(count*p.units[0].tiers[0].price*1.07));
  expect(costAmount(commission,p,a)).toBe(round(result.revenue*.12*1.2));
  expect(result.costs['Sales Commission']).toBe(round(result.revenue*.12*1.2));
 });
 it('weights different project rates in consolidated P&L',()=>{
  const m=demoModel();m.projects.forEach((p,i)=>{p.costs.find(c=>c.name==='Sales Commission')!.amount=i===0?12:3});
  const r=calculatePortfolioCashFlow(m);
  const expected=round(m.projects.reduce((s,p,i)=>s+calculateProjectRevenue(p)*(i===0?.12:.03),0));
  expect(r.costs['Sales Commission']).toBe(expected);
  expect(r.costs['Sales Commission']/r.revenue).not.toBe(.12);
 });
 it('uses manual revenue for corporate percentage overhead too',()=>{
  const m=demoModel();m.projects=m.projects.slice(0,1);const p=m.projects[0];p.salesMode='MANUAL';p.units.forEach(u=>u.tiers.forEach(t=>{t.manual=[]}));p.units[0].tiers[0].manual=[1];
  const c=m.corporate[0];m.corporate=[{...c,type:'% Revenue',amount:5,anchor:'Fixed Month',start:1,duration:3}];
  expect(round(calculateCorporateOverhead(m).reduce((s,r)=>s+r.amount,0))).toBe(round(calculateProjectCashFlow(p).revenue*.05));
 });
});
