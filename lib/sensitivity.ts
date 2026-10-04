import {calculateFinancing} from '@/lib/investments';
import {calculatePortfolioCashFlow,calculateProjectCashFlow,calculateSalesPlan} from '@/lib/financial-engine';
import {FinancialModel,MarketPlan,neutral,Result,Adjustments} from '@/types/model';
export const defaultMarket=():MarketPlan=>({lockedThrough:0,demand:[],prices:[],holdingMonthly:0,targetMargin:30});
export function scopedResult(model:FinancialModel,scope:string,a:Adjustments):Result {
 const p=model.projects.find(p=>p.id===scope);
 return p?calculateProjectCashFlow(p,a,model.horizon,model.startDate):calculatePortfolioCashFlow(model,a);
}
export function futurePrice(model:FinancialModel,scope:string,a:Adjustments){
 const sales=model.projects.filter(p=>scope==='portfolio'||p.id===scope).flatMap(p=>calculateSalesPlan(p,a)).filter(s=>!s.locked);
 const area=sales.reduce((n,s)=>n+s.units*s.area,0);
 return {area,price:area?sales.reduce((n,s)=>n+s.value,0)/area:0};
}
export function solveTarget(model:FinancialModel,scope:string,a:Adjustments,target:number,basis:'operating'|'developer'='operating'){
 a={...a,projectId:scope==='portfolio'?undefined:scope};
 const future=futurePrice(model,scope,a);
 if(!future.area)return {status:'no-inventory' as const,price:0,adjustment:0};
 if(target<0||target>=100)return {status:'unreachable' as const,price:0,adjustment:0};
 let lo=-99.999,hi=100;
 const margin=(price:number)=>(basis==='developer'&&scope==='portfolio'?calculateFinancing(model,{...a,price}).developerMargin:scopedResult(model,scope,{...a,price}).margin)*100;
 while(margin(hi)<target&&hi<1e6)hi=hi*2+100;
 if(margin(hi)<target)return {status:'unreachable' as const,price:0,adjustment:0};
 for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(margin(mid)>=target)hi=mid;else lo=mid;}
 return {status:'ok' as const,price:futurePrice(model,scope,{...a,price:hi}).price,adjustment:hi};
}
export function npv(r:Result,annual:number){return r.months.reduce((v,m)=>v+m.net/Math.pow(1+annual/100,m.month/12),0)}
export function matrix(model:FinancialModel,scope:string,a:Adjustments,includeFinancing=false,axis:'speed'|'construction'='speed'){
 return (axis==='speed'?[-30,-15,0,15,30]:[-10,0,10,20,30]).map(change=>[-20,-10,0,10,20].map(price=>{
 const adjustments={...a,projectId:scope==='portfolio'?undefined:scope,price:(1+a.price/100)*(1+price/100)*100-100,...(axis==='speed'?{speed:(1+a.speed/100)*(1+change/100)*100-100}:{construction:(1+a.construction/100)*(1+change/100)*100-100})};
 return {price,speed:change,change,adjustments,result:scopedResult(model,scope,adjustments),financing:includeFinancing&&scope==='portfolio'?calculateFinancing(model,adjustments):undefined};
 }));
}

/** Price boundary for lifetime profit, with fixed contracts and all other inputs unchanged. */
export function breakEvenPrice(model:FinancialModel,scope:string,a:Adjustments,basis:'operating'|'developer'='operating'){
 const scoped={...a,projectId:scope==='portfolio'?undefined:scope};
 const current=futurePrice(model,scope,scoped);
 const profit=(price:number)=>basis==='developer'&&scope==='portfolio'?calculateFinancing(model,{...scoped,price}).developerProfit:scopedResult(model,scope,{...scoped,price}).profit;
 if(!current.area)return {status:'no-inventory' as const,price:0,cushion:null};
 if(profit(-100)>=0)return {status:'covered' as const,price:0,cushion:current.price>0?100:null};
 let lo=-100,hi=100;
 while(profit(hi)<0&&hi<1e6)hi=hi*2+100;
 if(profit(hi)<0)return {status:'unreachable' as const,price:0,cushion:null};
 for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(profit(mid)>=0)hi=mid;else lo=mid;}
 const price=futurePrice(model,scope,{...scoped,price:hi}).price;
 return {status:'ok' as const,price,cushion:current.price>0?(current.price-price)/current.price*100:null};
}
