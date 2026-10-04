import {it,expect} from 'vitest';
import {createProject,demoModel} from '@/lib/demo';
import {neutral} from '@/types/model';
import {calculateProjectCashFlow,calculatePortfolioCashFlow,projectWindow,moveProjectActivity} from './index';
import {calculateFinancing} from '@/lib/investments';
const project=()=>{const p=createProject();p.costs=[];p.payroll=[];p.timeline.stages=[];p.infrastructure=[];p.land.type='Full Payment';p.units.forEach(u=>u.tiers.forEach(t=>t.plan.type='Full Cash'));return p;};
it('ignores legacy display padding and follows shortened and extended stages',()=>{
 const p=project(),original=calculateProjectCashFlow(p,neutral,120);expect(original.months.length).toBe(projectWindow(p).end);
 const shorter=moveProjectActivity(p,'Construction',-8,'end');shorter.timeline.salesDuration=8;shorter.units.forEach(u=>u.tiers.forEach(t=>{t.window=8;t.offset=0}));
 const result=calculateProjectCashFlow(shorter,neutral,120);expect(result.months.length).toBe(projectWindow(shorter).end);expect(result.months.length).toBeLessThan(original.months.length);
 const extended=moveProjectActivity(p,'Construction',40,'end');expect(calculateProjectCashFlow(extended).months.length).toBe(projectWindow(extended).end);
});
it('includes unfunded stages and keeps deferred collections after handover',()=>{
 const p=project();p.timeline.stages=[{name:'Long stage',start:40,duration:5}];expect(calculateProjectCashFlow(p).months.length).toBe(44);
 p.timeline.stages=[];p.units.forEach(u=>u.tiers.forEach(t=>t.plan={...t.plan,type:'Custom',custom:[{offset:0,percent:50},{offset:60,percent:50}]}));
 const r=calculateProjectCashFlow(p);expect(r.months.length).toBeGreaterThan(projectWindow(p).end);expect(r.months.reduce((s,m)=>s+m.inflow,0)).toBeCloseTo(r.revenue,2);
});
it('portfolio ends at latest project or company obligation; investments can extend it',()=>{
 const m=demoModel();m.projects=[project()];m.horizon=120;m.corporate=[];m.resources=[];m.workforce={version:1,departments:[],employees:[]};m.investments=[];
 const r=calculatePortfolioCashFlow(m);expect(r.months.length).toBe(projectWindow(m.projects[0]).end);
 m.corporate=[{id:'late',name:'Late bill',type:'One-Time',amount:100,start:55,duration:1,anchor:'Fixed Month',offset:0,custom:[]}];expect(calculatePortfolioCashFlow(m).months.length).toBe(55);
 m.investments=[{id:'i',name:'Investor',projectId:null,enabled:true,type:'annual',rate:10,compounding:'simple',incomePayment:'maturity',maturityMonth:70,autoSettle:true,tranches:[{id:'t',month:1,amount:1000}],repayments:[]}];expect(calculateFinancing(m).months.length).toBe(70);
});
