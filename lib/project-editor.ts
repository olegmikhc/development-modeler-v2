import {Project,Tier,Curve,neutral} from '@/types/model';
import {distribute,weights,timeline} from './financial-engine';
export function tierMode(p:Project,t:Tier){return t.schedule?.mode||p.salesMode}
/** Base allocations, before demand and scenario transformations. */
export function baseTierMonths(p:Project,t:Tier){
 if(tierMode(p,t)==='MANUAL')return [...t.manual];
 const start=timeline(p,neutral).salesStart+t.offset;
 return [...Array(start-1).fill(0),...distribute(t.units,weights(t.window,t.schedule?.curve||p.salesCurve,t.schedule?.custom||p.salesCustom),true)];
}
export function changeTierCurve(p:Project,t:Tier,choice:Curve|'MANUAL'):Tier{
 const current=baseTierMonths(p,t),saved=t.schedule?.custom||p.salesCustom;
 const custom=choice==='Custom'&&!saved.some(n=>n>0)?weights(t.window,(t.schedule?.curve||p.salesCurve)==='Custom'?'Even':t.schedule?.curve||p.salesCurve):saved;
 return {...t,...(choice==='MANUAL'?{manual:current}:{}),schedule:{mode:choice==='MANUAL'?'MANUAL':'AUTO',curve:choice==='MANUAL'?(t.schedule?.curve||p.salesCurve):choice,custom}};
}
export function shiftedWindow(start:number,duration:number,delta:number,edge:'move'|'start'|'end',horizon:number){
 const end=start+duration-1;
 if(edge==='end')return {start,duration:Math.max(1,Math.min(horizon-start+1,duration+delta))};
 const next=Math.max(1,Math.min(edge==='start'?end:horizon-duration+1,start+delta));
 return {start:next,duration:edge==='start'?end-next+1:duration};
}
