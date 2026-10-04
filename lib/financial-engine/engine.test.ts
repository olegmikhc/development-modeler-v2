import {describe,it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {neutral} from '@/types/model';
import {calculateLandPayments,timeline,moveProjectActivity,calculateBuyerCollections,calculateSalesPlan,calculateConstructionSpend,calculateProjectPayroll,calculatePeakFunding,calculateProjectCashFlow,calculatePortfolioCashFlow,distribute} from './index';
const total=(xs:{amount:number}[])=>xs.reduce((s,x)=>s+x.amount,0);
describe('development calculation engine',()=>{
it('seeds 58 units, 3,655 m² and $9m sales',()=>{const r=calculatePortfolioCashFlow(demoModel());expect(r.units).toBe(58);expect(r.gla).toBe(3655);expect(r.revenue).toBe(9000000)});
it('land: 30% down and eight quarterly payments fully conserve cost',()=>{const p=demoModel().projects[0],r=calculateLandPayments(p);expect(r.map(x=>x.month)).toEqual([1,3,6,9,12,15,18,21,24]);expect(r[0].amount).toBe(p.land.cost*.3);expect(total(r)).toBe(p.land.cost)});
it('PBG starts when land controlled, not when paid off',()=>{const p=demoModel().projects[0];expect(timeline(p).pbgStart).toBe(1);p.land.permitAfterInitial=false;expect(timeline(p).pbgStart).toBe(24)});
it('PBG delay shifts construction and sales',()=>{const p=demoModel().projects[0];expect(timeline(p).salesStart).toBe(5);const t=timeline(p,{...neutral,pbgDelay:2});expect(t.salesStart).toBe(7);expect(t.constructionStart).toBe(7)});
it('installments shorten to end by completion, conserving cash',()=>{const p=demoModel().projects[0],tier=p.units[0].tiers[1];const rows=calculateBuyerCollections([{month:20,units:1,value:120000,tier,unit:'1BR'}],p);expect(Math.max(...rows.map(x=>x.month))).toBe(22);expect(total(rows)).toBe(120000)});
it('S curve construction conserves budget',()=>{const p=demoModel().projects[0];expect(total(calculateConstructionSpend(p))).toBe(1970*800)});
it('payroll follows construction',()=>{const p=demoModel().projects[0];expect(calculateProjectPayroll(p)[0].month).toBe(5);expect(calculateProjectPayroll(p,{...neutral,pbgDelay:2})[0].month).toBe(7)});
it('peak funding never becomes negative for positive balances',()=>{expect(calculatePeakFunding([{month:1,cumulative:20}])).toEqual({peak:0,peakMonth:0});expect(calculatePeakFunding([{month:1,cumulative:-20},{month:2,cumulative:-80}])).toEqual({peak:80,peakMonth:2})});
it('cash roll-forward is exact',()=>{const r=calculateProjectCashFlow(demoModel().projects[0]);r.months.forEach((m,i)=>expect(m.cumulative).toBeCloseTo((r.months[i-1]?.cumulative||0)+m.net,2));expect(r.months.at(-1)!.cumulative).toBeCloseTo(r.profit,2)});
it('portfolio includes projects and corporate exactly once',()=>{const m=demoModel();m.corporate=[];m.resources=[];const r=calculatePortfolioCashFlow(m);expect(r.cost).toBeCloseTo(r.projects.reduce((s,p)=>s+p.cost,0)+252000,2);expect(r.months.at(-1)!.cumulative).toBeCloseTo(r.profit,2)});
it('extends horizon to avoid truncating obligations',()=>{const m=demoModel();m.horizon=12;m.projects[0].start=48;const r=calculatePortfolioCashFlow(m);expect(r.months.length).toBeGreaterThan(60);expect(r.months.at(-1)!.cumulative).toBeCloseTo(r.profit,2)});
it('integer sales distribution preserves inventory',()=>{expect(distribute(17,[1,1,1,1],true).reduce((a,b)=>a+b,0)).toBe(17);const p=demoModel().projects[0];expect(calculateSalesPlan(p).reduce((s,x)=>s+x.units,0)).toBe(30)});
});
describe('validation and resource dependencies',()=>{
it('shared sales and marketing follow PBG delays',()=>{const m=demoModel(),a=calculatePortfolioCashFlow(m),b=calculatePortfolioCashFlow(m,{...neutral,pbgDelay:2});expect(a.months[3].outflow).toBeGreaterThan(0);expect(b.months[3].categories.Payroll).toBe(5000);expect(b.months[5].categories.Payroll).toBe(10000);expect(b.projects.every(p=>!p.costs.Payroll)).toBe(true)});
it('detects oversold manual inventory',()=>{const p=demoModel().projects[0];p.salesMode='MANUAL';p.units[0].tiers[0].manual=[99];expect(calculateProjectCashFlow(p).warnings.some(x=>x.includes('Sales > Available Units'))).toBe(true)});
it('allocation conserves all shared resource expenses',()=>{const m=demoModel();const r=calculatePortfolioCashFlow(m);const without=calculatePortfolioCashFlow({...m,resources:[]});expect(r.cost-without.cost).toBe(60000)});
});
describe('auxiliary stages and empty models',()=>{
it('moves a linked architecture budget with the stage',()=>{const p=demoModel().projects[0];const before=calculateProjectCashFlow(p);p.timeline.stages[0].offset=2;const after=calculateProjectCashFlow(p);expect(before.months[0].categories.Architecture).toBe(5000);expect(after.months[0].categories.Architecture||0).toBe(0);expect(after.months[2].categories.Architecture).toBe(5000);expect(after.cost).toBe(before.cost)});
it('retains shared expenses when no project exists',()=>{const m=demoModel();m.projects=[];m.corporate=[];m.resources=m.resources.map(r=>({...r,anchor:'Fixed Month'}));const r=calculatePortfolioCashFlow(m);expect(r.cost).toBe(60000)});
});

it('allows sales and construction one month before PBG completion',()=>{let p=demoModel().projects[0];p.timeline.pbgDuration=6;for(const name of ['Sales','Construction'] as const)p=moveProjectActivity(p,name,-2);const t=timeline(p);expect(t.pbgEnd).toBe(6);expect(t.salesStart).toBe(5);expect(t.constructionStart).toBe(5);expect(calculateConstructionSpend(p).filter(r=>r.amount>0)[0].month).toBe(5);expect(calculateSalesPlan(p).filter(r=>r.units>0)[0].month).toBe(5);expect(timeline(p,{...neutral,pbgDelay:2}).constructionStart).toBe(7)});
it('early activity dragging and resizing cannot pass month one or invert duration',()=>{const p=demoModel().projects[0];for(const name of ['Sales','Construction'] as const){const moved=moveProjectActivity(p,name,-100);expect(name==='Sales'?timeline(moved).salesStart:timeline(moved).constructionStart).toBe(1);const resized=moveProjectActivity(p,name,100,'start');expect(name==='Sales'?resized.timeline.salesDuration:resized.timeline.constructionDuration).toBe(1)}});
