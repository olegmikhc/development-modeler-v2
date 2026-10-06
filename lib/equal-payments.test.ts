import {describe,it,expect} from 'vitest';
import {calculateInvestment,calculateFinancing,createInvestment} from './investments';
import {demoModel} from './demo';
import {modelEnvelope} from './validation/model';
import {Investment} from '@/types/model';
const make=(patch:Partial<Investment>={}):Investment=>({...createInvestment(),rate:12,compounding:'monthly',tranches:[{id:crypto.randomUUID(),month:1,amount:100000}],repaymentPlan:{mode:'equal',startMonth:18,endMonth:24},...patch});
describe('Equal repayment periods',()=>{
 it('matches a deferred annuity with monthly capitalization and seven inclusive payments',()=>{
  const r=calculateInvestment(make(),'2027-01-01');
  const expected=100000*1.01**17*.01/(1-1.01**-7);
  expect(r.equalPayment).toBeCloseTo(expected,1);
  expect(r.months.slice(0,17).every(m=>m.principalPaid+m.incomePaid===0)).toBe(true);
  expect(r.months.slice(17)).toHaveLength(7);
  for(const m of r.months.slice(17,23))expect(m.principalPaid+m.incomePaid).toBeCloseTo(r.equalPayment!,2);
  expect(Math.abs(r.months[23].principalPaid+r.months[23].incomePaid-r.equalPayment!)).toBeLessThan(.1);
  expect(r.principalPaid).toBe(100000);expect(r.principalBalance+r.incomeBalance).toBe(0);
  expect(r.incomePaid).toBe(r.incomeAccrued);expect(r.warnings).toEqual([]);
 });
 it('handles zero interest, one payment and ignores preserved manual rows and monthly payouts',()=>{
  const inv=make({rate:0,incomePayment:'monthly',repayments:[{id:'old',month:1,principal:5000000,income:0}]});
  const r=calculateInvestment(inv,'2027-01-01');expect(r.equalPayment).toBe(14285.71);expect(r.principalPaid).toBe(100000);
  expect(inv.repayments[0].principal).toBe(5000000);
  const once=calculateInvestment({...inv,repaymentPlan:{mode:'equal',startMonth:18,endMonth:18}},'2027-01-01');expect(once.equalPayment).toBe(100000);
 });
 it('recomputes simple interest on outstanding capital and handles fixed and profit share returns',()=>{
  const simple=calculateInvestment(make({compounding:'simple'}),'2027-01-01');
  expect(simple.months[17].incomeAccrued).toBe(1000);
  expect(simple.months[18].incomeAccrued).toBeCloseTo(simple.months[17].principalBalance*.01,2);
  for(const type of ['fixed','profit-share'] as const){const r=calculateInvestment(make({type,rate:20}),'2027-01-01',20000);expect(r.incomePaid).toBe(20000);expect(r.equalPayment).toBeCloseTo(120000/7,2);}
 });
 it('preserves settings through export validation and includes generated payments in financing',()=>{
  const model=demoModel();model.investments=[make()];
  const restored=modelEnvelope.parse(JSON.parse(JSON.stringify(model))) as unknown as typeof model;
  expect(restored.investments![0].repaymentPlan).toEqual(model.investments[0].repaymentPlan);
  const r=calculateFinancing(restored),detail=r.investors[0];
  expect(r.months[17].principalPaid+r.months[17].incomePaid).toBeCloseTo(detail.equalPayment!,2);
  expect(r.incomeAccrued).toBe(detail.incomePaid);
 });
 it('respects multiple contributions, warns if the chosen period precedes a tranche, and keeps manual mode intact',()=>{
  const inv=make({tranches:[{id:'a',month:1,amount:50000},{id:'b',month:20,amount:50000}]});
  const r=calculateInvestment(inv,'2027-01-01');expect(r.warnings.some(w=>w.includes('М20'))).toBe(true);expect(r.principalPaid).toBe(100000);
  expect(r.months[18].principalPaid+r.months[18].incomePaid).toBe(0);
  const manual=make({repaymentPlan:{mode:'manual',startMonth:18,endMonth:24}});
  expect(calculateInvestment(manual,'2027-01-01').months).toEqual(calculateInvestment({...manual,repaymentPlan:undefined},'2027-01-01').months);
 });
});
