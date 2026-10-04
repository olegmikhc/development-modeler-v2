import {describe,it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {neutral} from '@/types/model';
import {calculateConstructionSpend,calculateProjectCashFlow,showVillaBudget,moveShowVilla,timeline} from './index';
import {modelEnvelope} from '@/lib/validation/model';
import {fitTimeline} from '@/lib/fit-timeline';
const total=(xs:{amount:number}[])=>xs.reduce((s,x)=>s+x.amount,0);
describe('show villa',()=>{
 it('moves one unit budget earlier without changing units, revenue or total costs',()=>{const p=demoModel().projects[0],before=calculateProjectCashFlow(p);p.construction.showVilla={unitId:p.units[0].id,start:1,duration:2};const after=calculateProjectCashFlow(p);expect(showVillaBudget(p)).toBe(p.units[0].area*p.construction.costPerM2);expect(total(calculateConstructionSpend(p).filter(x=>x.month<=2))).toBe(showVillaBudget(p));expect(after.cost).toBeCloseTo(before.cost,2);expect(after.units).toBe(before.units);expect(after.revenue).toBe(before.revenue);});
 it('conserves advanced budget with scenario uplift',()=>{const p=demoModel().projects[0];p.construction.mode='Advanced';p.construction.items=[{name:'Total',amount:1234567.89}];const a={...neutral,construction:13};const before=total(calculateConstructionSpend(p,a));p.construction.showVilla={unitId:p.units[1].id,start:2,duration:7};expect(total(calculateConstructionSpend(p,a))).toBeCloseTo(before,2);});
 it('moves and resizes independently of PBG and main construction',()=>{const p=demoModel().projects[0];p.construction.showVilla={unitId:p.units[0].id,start:timeline(p).constructionStart,duration:6};const q=moveShowVilla(p,-100);expect(q.construction.showVilla?.start).toBe(1);expect(q.timeline).toEqual(p.timeline);expect(moveShowVilla(q,2,'start').construction.showVilla).toMatchObject({start:3,duration:4});expect(timeline(q,{...neutral,pbgDelay:6}).constructionStart).not.toBe(q.construction.showVilla?.start);});
 it('preserves optional configuration through validation and horizon fitting',()=>{const m=demoModel();expect(modelEnvelope.safeParse(m).success).toBe(true);m.projects[0].construction.showVilla={unitId:m.projects[0].units[0].id,start:28,duration:5};expect(modelEnvelope.parse(m).projects[0].construction.showVilla?.start).toBe(28);expect(fitTimeline(m,24).projects[0].construction.showVilla).toMatchObject({start:20,duration:5});});
 it('falls back to full main budget if unit is removed',()=>{const p=demoModel().projects[0],before=total(calculateConstructionSpend(p));p.construction.showVilla={unitId:'missing',start:1,duration:2};expect(showVillaBudget(p)).toBe(0);expect(total(calculateConstructionSpend(p))).toBe(before);});
});
