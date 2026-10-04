import {describe,it,expect} from 'vitest';
import {createProject,demoModel} from './demo';
import {baseTierMonths,changeTierCurve,shiftedWindow} from './project-editor';
import {calculateSalesPlan,calculateProjectCashFlow} from './financial-engine';
import {modelEnvelope} from './validation/model';
import {neutral} from '@/types/model';
import {stressSales} from './portfolio-sales';
const sum=(xs:number[])=>xs.reduce((n,x)=>n+x,0);
describe('unified sales editor',()=>{
 it('preserves legacy auto and manual plans when no per-group settings exist',()=>{const p=createProject(),tier=p.units[0].tiers[0];expect(sum(baseTierMonths(p,tier))).toBe(tier.units);p.salesMode='MANUAL';tier.manual=[0,1,2];expect(baseTierMonths(p,tier)).toEqual([0,1,2])});
 it('switches only one group to manual without changing its base revenue or dates',()=>{const p=createProject(),before=calculateSalesPlan(p),tier=p.units[0].tiers[0];p.units[0].tiers[0]=changeTierCurve(p,tier,'MANUAL');const after=calculateSalesPlan(p);expect(after.map(s=>[s.month,s.units,s.value,s.tier.id])).toEqual(before.map(s=>[s.month,s.units,s.value,s.tier.id]));expect(p.salesMode).toBe('AUTO');expect(p.units[0].tiers[1].schedule).toBeUndefined()});
 it('allows different curves and manual counts across groups with identical names',()=>{const p=createProject();p.units[0].tiers.forEach(t=>{t.name='Same';t.units=12;t.window=4;t.offset=0});const [a,b,c]=p.units[0].tiers;p.units[0].tiers=[changeTierCurve(p,a,'Front Loaded'),changeTierCurve(p,b,'Back Loaded'),{...changeTierCurve(p,c,'MANUAL'),manual:[0,0,0,0,12]}];const rows=calculateSalesPlan(p);expect(rows.filter(s=>s.tier.id===a.id).map(s=>s.units)).toEqual([5,4,2,1]);expect(rows.filter(s=>s.tier.id===b.id).map(s=>s.units)).toEqual([1,2,4,5]);expect(rows.filter(s=>s.tier.id===c.id).map(s=>s.month)).toEqual([5])});
 it('does not apply seasonality twice when converting a base plan to manual',()=>{const p=createProject();p.market={lockedThrough:0,demand:[100,100,100,100,50,50,50,50],prices:[],holdingMonthly:0,targetMargin:30};const before=calculateSalesPlan(p,{...neutral,speed:10,price:5});const tier=p.units[0].tiers[0];p.units[0].tiers[0]=changeTierCurve(p,tier,'MANUAL');const after=calculateSalesPlan(p,{...neutral,speed:10,price:5});expect(after.map(s=>[s.month,s.units,s.value])).toEqual(before.map(s=>[s.month,s.units,s.value]))});
 it('starts a custom curve from nonzero weights without losing inventory',()=>{const p=createProject(),tier=p.units[0].tiers[0],custom=changeTierCurve(p,tier,'Custom');expect(sum(baseTierMonths(p,custom))).toBe(tier.units);expect(custom.schedule?.custom.some(n=>n>0)).toBe(true)});
 it('validates mixed manual allocation and preserves overrides on import',()=>{const m=demoModel(),p=m.projects[0],tier=p.units[0].tiers[0];p.units[0].tiers[0]={...changeTierCurve(p,tier,'MANUAL'),manual:[99]};expect(calculateProjectCashFlow(p).warnings.some(s=>s.includes('manual sales allocation mismatch'))).toBe(true);expect(modelEnvelope.parse(m).projects[0].units[0].tiers[0].schedule?.mode).toBe('MANUAL')});
 it('keeps total unit counts when portfolio stress converts overridden curves to manual',()=>{const m=demoModel();m.projects.forEach(p=>p.units.forEach(u=>{u.tiers=u.tiers.map(t=>changeTierCurve(p,t,'Back Loaded'))}));const before=m.projects.reduce((s,p)=>s+calculateSalesPlan(p).reduce((n,r)=>n+r.units,0),0);const after=stressSales(m,neutral,{capacity:2,cashPercent:50,down:30,term:12,priceChange:0});expect(after.projects.reduce((s,p)=>s+calculateSalesPlan(p).reduce((n,r)=>n+r.units,0),0)).toBe(before)});
});
describe('schedule gestures',()=>{
 it('moves the full interval without changing duration and clamps at boundaries',()=>{expect(shiftedWindow(5,6,-20,'move',36)).toEqual({start:1,duration:6});expect(shiftedWindow(5,6,50,'move',36)).toEqual({start:31,duration:6})});
 it('resizes either edge with a minimum duration of one month',()=>{expect(shiftedWindow(5,6,2,'start',36)).toEqual({start:7,duration:4});expect(shiftedWindow(5,6,50,'start',36)).toEqual({start:10,duration:1});expect(shiftedWindow(5,6,-50,'end',36)).toEqual({start:5,duration:1});expect(shiftedWindow(5,6,50,'end',36)).toEqual({start:5,duration:32})});
});
