import {Adjustments,FinancialModel,Tier} from '@/types/model';
import {calculateSalesPlan,timeline} from './financial-engine';
export interface SalesStress {capacity:number;cashPercent:number;down:number;term:number;priceChange:number}
export function portfolioSales(model:FinancialModel,a:Adjustments){return model.projects.flatMap(p=>calculateSalesPlan(p,a).map(s=>({...s,projectId:p.id,project:p.name})));}
/** Preserve planned release dates; FIFO overflow moves forward across the whole portfolio. */
export function stressSales(source:FinancialModel,a:Adjustments,options:SalesStress){
 const model=structuredClone(source),sales=portfolioSales(source,a).sort((x,y)=>x.month-y.month);
 const capacity=Math.max(1,Math.round(options.capacity));
 const total=sales.reduce((n,s)=>n+s.units,0),cash=sales.filter(s=>s.tier.plan.type==='Full Cash').reduce((n,s)=>n+s.units,0);
 const keep=Math.min(cash,Math.floor(total*Math.max(0,Math.min(100,options.cashPercent))/100));
 const lookup=new Map<string,Tier>();
 for(const p of model.projects){p.salesMode='MANUAL';for(const u of p.units)for(const t of u.tiers){if(t.schedule)t.schedule.mode='MANUAL';t.manual=[];t.units=0;lookup.set(`${p.id}:${t.id}`,t)}}
 let month=1,used=0,cashSeen=0,cashKept=0;
 for(const sale of sales){
  const p=model.projects.find(p=>p.id===sale.projectId)!;
  const original=lookup.get(`${p.id}:${sale.tier.id}`)!;
  for(let i=0;i<sale.units;i++){
   if(month<sale.month){month=sale.month;used=0}if(used>=capacity){month++;used=0}used++;
   let target=original;
   if(sale.tier.plan.type==='Full Cash'){
    cashSeen++;const retained=Math.floor(cashSeen*keep/Math.max(1,cash));
    if(retained>cashKept){cashKept=retained}else{
     const unit=p.units.find(u=>u.tiers.some(t=>t.id===original.id))!;
     const key=`stress-${original.id}`;
     target=unit.tiers.find(t=>t.id===key)!;
     if(!target){target={...structuredClone(original),id:key,name:`${original.name} · Installment`,price:original.price*(1+options.priceChange/100),units:0,manual:[],plan:{type:'Installment',down:options.down,maxTerm:options.term,finish:'No Restriction',fixedMonth:24,custom:[]}};unit.tiers.push(target)}
    }
   }
   target.units++;while(target.manual.length<month)target.manual.push(0);target.manual[month-1]++;
  }
 }
 for(const p of model.projects){const t=timeline(p,a),end=Math.max(t.salesStart,...p.units.flatMap(u=>u.tiers.flatMap(t=>t.manual.map((n,i)=>n?i+1:0))));p.timeline.salesDuration=Math.max(p.timeline.salesDuration,Math.ceil((end-t.salesStart+1)*(1+a.speed/100)));}
 return model;
}
