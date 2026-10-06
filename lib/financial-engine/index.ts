import {salesAllocation} from '@/lib/sales-allocation';
import {DEFAULT_MODEL_START,modelMonthLabel} from '@/lib/model-calendar';
import {landPrice,leaseholdQuote} from '@/lib/land-price';
import {migrateWorkforce} from '@/lib/workforce';
import {Adjustments, Department, Anchor, CorporateCost, Cost, Curve, FinancialModel, Month, Project, Result, SharedResource, Tier, neutral} from '@/types/model';
const sum=(xs:number[])=>xs.reduce((a,b)=>a+b,0);
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
export const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function distribute(total:number,weights:number[],integer=false):number[]{
 if(!weights.length)return []; const w=weights.map(x=>Math.max(0,x)); const s=sum(w);if(!s)return weights.map(()=>0);
 const raw=w.map(x=>total*x/s);const out=raw.map(x=>integer?Math.floor(x):round(x));
 if(integer){let left=Math.round(total-sum(out));const order=raw.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f);for(let i=0;i<left;i++)out[order[i%order.length].i]++;}else out[out.length-1]=round(out[out.length-1]+total-sum(out));return out;
}
export function weights(duration:number,curve:Curve,custom:number[]=[]){return Array.from({length:Math.max(1,duration)},(_,i)=>curve==='Custom'?(custom[i]||0):curve==='Front Loaded'?duration-i:curve==='Back Loaded'?i+1:curve==='S-Curve'?Math.sin(Math.PI*(i+.5)/duration):1)}
export function calculateLandPayments(p:Project,a:Adjustments=neutral){const l=p.land,total=round(landPrice(p)*(1+a.land/100));if(l.type==='Full Payment')return [{month:p.start,amount:total}];if(l.type==='Custom Schedule')return l.custom.map(x=>({month:p.start+x.month-1,amount:round(x.amount*(1+a.land/100))}));const down=round(total*l.down/100);return [{month:p.start,amount:down},...distribute(total-down,Array(Math.max(1,l.count)).fill(1)).map((amount,i)=>({month:p.start+l.first-1+i*l.frequency,amount}))]}
export function timeline(p:Project,a:Adjustments=neutral){const t=p.timeline;const control=p.start+p.land.control-1; const landReady=p.land.permitAfterInitial?control:Math.max(p.start,...calculateLandPayments(p,a).map(x=>x.month));const pbgStart=Math.max(1,p.start+t.pbgOffset,t.pbgAfterLand===false?1:landReady);const pbgDuration=Math.max(1,t.pbgDuration+a.pbgDelay);const pbgEnd=pbgStart+pbgDuration-1;const salesStart=Math.max(1,(t.salesAfterPbg?pbgEnd+1:p.start)+t.salesOffset);const constructionStart=Math.max(1,(t.constructionAfterPbg?pbgEnd+1:p.start)+t.constructionOffset);const constructionDuration=Math.max(1,t.constructionDuration+a.constructionDuration);const completion=constructionStart+constructionDuration-1;return {pbgStart,pbgDuration,pbgEnd,salesStart,salesDuration:Math.max(1,Math.round(t.salesDuration/(1+a.speed/100))),constructionStart,constructionDuration,completion,handover:completion+t.handoverOffset};}
export function anchorMonth(p:Project,anchor:Anchor,a:Adjustments=neutral){const t=timeline(p,a);return anchor==='Fixed Month'?1:anchor==='Project Start'?p.start:anchor==='PBG Start'?t.pbgStart:anchor==='PBG End'?t.pbgEnd:anchor==='Sales Start'?t.salesStart:anchor==='Construction Start'?t.constructionStart:t.handover;}
export function stageStart(p:Project,s:Project['timeline']['stages'][number],a:Adjustments=neutral){return s.anchor?anchorMonth(p,s.anchor,a)+(s.offset||0):p.start+s.start-1;}
export function calculateProjectRevenue(p:Project,a:Adjustments=neutral){return round(sum(calculateSalesPlan(p,a).map(s=>s.value)))}
export function calculateSalesPlan(p:Project,a:Adjustments=neutral){
 a=a.projectId&&a.projectId!==p.id?neutral:a;
 const scenario=p.market?{...a,speed:0,price:0}:a;
 const t=timeline(p,scenario);
 return p.units.flatMap(u=>u.tiers.flatMap(tier=>{
 const duration=Math.max(1,Math.round(tier.window/(1+scenario.speed/100)));
 const start=t.salesStart+Math.round(tier.offset/(1+scenario.speed/100));
 const manual=(tier.schedule?.mode||p.salesMode)==='MANUAL';
 const sales=manual?tier.manual:distribute(tier.units,weights(duration,tier.schedule?.curve||p.salesCurve,tier.schedule?.custom||p.salesCustom),true);
 const market=p.market,lock=market?.lockedThrough||0,origin=Math.max(lock+1,t.salesStart);
 const mapped:number[]=[];let progress=0;
 if(market){
  const maxSlot=Math.max(0,(manual?sales.length:start+sales.length-1)-origin+1);
  for(let month=origin;progress<maxSlot&&month<=2400;month++){
   const demand=Math.max(0,market.demand[month-1]??100)/100*Math.max(.01,1+a.speed/100);
   const next=progress+demand;
   for(let slot=Math.floor(progress+1e-9);slot<Math.min(maxSlot,Math.floor(next+1e-9));slot++)mapped[slot]=month;
   progress=next;
  }
 }
 return sales.map((units,i)=>{
  const original=manual?i+1:start+i;
  const locked=!!market&&original<=lock;
  const month=market&&!locked?mapped[Math.max(0,original-origin)]??2400:original;
  const price=locked?1:(1+a.price/100)*(market?Math.max(0,market.prices[month-1]??100)/100*(market.priceFactor??1):1);
  return {month,units,value:round(units*tier.price*price),tier,unit:u.name,area:u.area,locked};
 }).filter(x=>x.units>0);
 }));
}
export function calculateBuyerCollections(sales:Array<Pick<ReturnType<typeof calculateSalesPlan>[number],'month'|'units'|'value'|'tier'|'unit'>>,p:Project,a:Adjustments=neutral){const t=timeline(p,a);return sales.flatMap(s=>{const plan=s.tier.plan;const kind=plan.type==='Full Cash'?(s.tier.name==='Normal Price'?'Normal Price Collections':'Full Cash Collections'):'Installment Collections';if(plan.type==='Full Cash')return [{month:s.month,amount:s.value,kind}];if(plan.type==='Custom')return plan.custom.map(x=>({month:s.month+x.offset,amount:round(s.value*x.percent/100),kind}));const end=plan.finish==='No Restriction'?Infinity:plan.finish==='Fixed Date'?plan.fixedMonth:plan.finish==='Handover'?t.handover:t.completion;const term=Math.max(1,Math.min(Math.max(1,plan.maxTerm+a.paymentTerm),end-s.month+1));const down=round(s.value*plan.down/100);return [{month:s.month,amount:down,kind},...distribute(s.value-down,Array(term).fill(1)).map((amount,i)=>({month:s.month+i,amount,kind}))];});}
export function showVillaWindow(p:Project){const v=p.construction.showVilla;if(!v)return null;return {start:v.start,duration:v.duration,end:v.start+v.duration-1};}
export function moveShowVilla(p:Project,delta:number,edge?:'start'|'end'):Project{const q=structuredClone(p),v=q.construction.showVilla;if(!v)return q;const end=v.start+v.duration-1;if(edge==='end')v.duration=Math.max(1,Math.min(240,v.duration+delta));else if(edge==='start'){v.start=Math.max(1,Math.min(240,end,v.start+delta));v.duration=end-v.start+1;}else v.start=Math.max(1,Math.min(240,v.start+delta));return q;}
export function showVillaBudget(p:Project,a:Adjustments=neutral){const v=p.construction.showVilla,u=p.units.find(u=>u.id===v?.unitId&&u.quantity>0),gla=sum(p.units.map(u=>u.area*u.quantity));if(!u||!gla)return 0;const base=p.construction.mode==='Simple'?gla*p.construction.costPerM2:sum(p.construction.items.map(x=>x.amount));return round(round(base*(1+a.construction/100))*u.area/gla);}
export function calculateConstructionSpend(p:Project,a:Adjustments=neutral){const t=timeline(p,a);const gla=sum(p.units.map(u=>u.area*u.quantity));const base=p.construction.mode==='Simple'?gla*p.construction.costPerM2:sum(p.construction.items.map(x=>x.amount));const total=round(base*(1+a.construction/100)),show=showVillaBudget(p,a),v=p.construction.showVilla;const rows=distribute(total-show,weights(t.constructionDuration,p.construction.curve,p.construction.custom)).map((amount,i)=>({month:t.constructionStart+i,amount}));if(v&&show)rows.push(...distribute(show,weights(v.duration,p.construction.curve,p.construction.custom)).map((amount,i)=>({month:v.start+i,amount})));return rows.sort((a,b)=>a.month-b.month);}

/** Infrastructure is additional construction, with its own area and payment window. */
export function infrastructureWindow(p:Project,item:NonNullable<Project['infrastructure']>[number],a:Adjustments=neutral){
 a=a.projectId&&a.projectId!==p.id?neutral:a;
 const start=Math.max(1,timeline(p,a).constructionStart+item.offset),duration=Math.max(1,item.duration);
 return {start,duration,end:start+duration-1};
}
export function calculateInfrastructureSpend(p:Project,a:Adjustments=neutral){
 a=a.projectId&&a.projectId!==p.id?neutral:a;
 return (p.infrastructure||[]).flatMap(item=>{
  const w=infrastructureWindow(p,item,a),budget=round(item.area*item.costPerM2*(1+a.construction/100));
  return distribute(budget,weights(w.duration,item.curve)).map((amount,i)=>({month:w.start+i,amount,category:`Infrastructure · ${item.name}`,infrastructureId:item.id}));
 });
}
export function moveInfrastructure(p:Project,id:string,delta:number,edge?:'start'|'end',a:Adjustments=neutral):Project{
 return {...p,infrastructure:(p.infrastructure||[]).map(item=>{
  if(item.id!==id)return item;
  const w=infrastructureWindow(p,item,a);
  const start=edge==='end'?w.start:Math.max(1,Math.min(edge==='start'?w.end:Infinity,w.start+delta));
  const duration=edge==='end'?Math.max(1,Math.min(240,w.duration+delta)):edge==='start'?w.end-start+1:w.duration;
  const scenario=a.projectId&&a.projectId!==p.id?neutral:a;
  return {...item,offset:start-timeline(p,scenario).constructionStart,duration};
 })};
}

export function calculateProjectPayroll(p:Project,a:Adjustments=neutral){return p.payroll.flatMap(e=>Array.from({length:e.duration},(_,i)=>({month:anchorMonth(p,e.anchor,a)+e.offset+i,amount:e.salary,role:e.role})));}
export function costAmount(c:Cost,p:Project,a:Adjustments=neutral){const revenue=calculateProjectRevenue(p,a),construction=sum([...calculateConstructionSpend(p,a),...calculateInfrastructureSpend(p,a)].map(x=>x.amount));const base=c.driver==='$ / unit'?sum(p.units.map(u=>u.quantity)):c.driver==='$ / m²'?sum(p.units.map(u=>u.quantity*u.area)):c.driver==='% Revenue'?revenue/100:c.driver==='% Construction'?construction/100:1;const adj=c.name==='Marketing'?a.marketing:c.name==='Sales Commission'?a.commission:c.name==='Contingency'?a.contingency:0;return round(c.amount*base*(1+adj/100));}
export function calculateProjectCosts(p:Project,a:Adjustments=neutral){const t=timeline(p,a);const rows=[...calculateLandPayments(p,a).map(x=>({...x,category:'Land Payments'})),...calculateConstructionSpend(p,a).map(x=>({...x,category:'Construction'})),...calculateInfrastructureSpend(p,a),...calculateProjectPayroll(p,a).map(x=>({...x,category:'Payroll'}))];p.costs.forEach(c=>{let start=p.start,duration=1;switch(c.timing){case 'During PBG':start=t.pbgStart;duration=t.pbgDuration;break;case 'Before Sales':start=t.salesStart-1;break;case 'During Sales':start=t.salesStart;duration=t.salesDuration;break;case 'During Construction':start=t.constructionStart;duration=t.constructionDuration;break;case 'At Handover':start=t.handover;break;case 'Custom':start=c.start;duration=c.duration;break;case 'Timeline Stage':{const stage=p.timeline.stages.find(s=>s.name===c.stage);if(stage){start=stageStart(p,stage,a);duration=stage.duration;}break;}}
rows.push(...distribute(costAmount(c,p,a),Array(Math.max(1,duration)).fill(1)).map((amount,i)=>({month:start+i,amount,category:c.name})));});
if(p.market?.holdingMonthly){const end=Math.max(t.salesStart,...calculateSalesPlan(p,a).map(x=>x.month));for(let month=t.salesStart;month<=end;month++)rows.push({month,amount:p.market.holdingMonthly,category:'Sales holding costs'});}
return rows;}
export function calculateCorporateOverhead(model:FinancialModel,a:Adjustments=neutral){return model.corporate.flatMap(c=>{const start=c.anchor==='Fixed Month'?c.start:Math.min(...model.projects.map(p=>anchorMonth(p,c.anchor,a)))+c.offset;const value=c.type==='% Revenue'?sum(model.projects.map(p=>calculateProjectRevenue(p,a)))*c.amount/100:c.amount;const amounts=c.type==='Custom'?c.custom:c.type==='One-Time'?[value]:c.type==='% Revenue'?distribute(value,Array(c.duration).fill(1)):Array(c.duration).fill(value);return amounts.map((amount,i)=>({month:start+i,amount,category:c.name}));});}
export function allocateSharedResources(model:FinancialModel,a:Adjustments=neutral){return model.resources.flatMap(r=>{const resourceStart=r.anchor&&r.anchor!=='Fixed Month'?Math.min(...model.projects.map(p=>anchorMonth(p,r.anchor!,a)))+(r.offset||0):r.start;const bases=model.projects.map(p=>r.method==='By Revenue'?calculateProjectRevenue(p,a):r.method==='By Units'?sum(p.units.map(u=>u.quantity)):r.method==='By GLA'?sum(p.units.map(u=>u.quantity*u.area)):r.method==='Manual %'?(r.allocations[p.id]||0):1);return Array.from({length:r.duration},(_,i)=>(r.method==='Corporate'||!model.projects.length)?[{month:resourceStart+i,amount:r.monthly,projectId:null as string|null,category:r.name}]:distribute(r.monthly,bases).map((amount,j)=>({month:resourceStart+i,amount,projectId:model.projects[j].id as string|null,category:r.name}))).flat();});}
function createMonths(n:number,start:string):Month[]{return Array.from({length:n},(_,i)=>{return {month:i+1,label:modelMonthLabel(start,i+1),inflow:0,outflow:0,net:0,cumulative:0,contracts:0,units:0,categories:{},collections:{}}});}
export function calculatePeakFunding(months:Pick<Month,'month'|'cumulative'>[]){let min=0,month=0;for(const m of months)if(m.cumulative<min){min=m.cumulative;month=m.month}return {peak:round(-min),peakMonth:month};}
function finish(months:Month[],revenue:number,units:number,gla:number,warnings:string[],duration:number):Result {let cumulative=0;const costs:Record<string,number>={};months.forEach(m=>{m.inflow=round(m.inflow);m.outflow=round(m.outflow);m.net=round(m.inflow-m.outflow);cumulative=round(cumulative+m.net);m.cumulative=cumulative;Object.entries(m.categories).forEach(([k,v])=>costs[k]=round((costs[k]||0)+v));});const cost=round(sum(months.map(m=>m.outflow))),profit=round(revenue-cost);return {months,revenue:round(revenue),cost,profit,margin:revenue?profit/revenue:0,units,gla,...calculatePeakFunding(months),warnings,duration,costs};}
export function validateProject(p:Project,a:Adjustments=neutral){const w:string[]=[],t=timeline(p,a);if(p.construction.showVilla&&!p.units.some(u=>u.id===p.construction.showVilla!.unitId&&u.quantity>0))w.push(`${p.name}: Show villa — select an available unit type`);p.units.forEach(u=>{if(sum(u.tiers.map(x=>x.units))!==u.quantity)w.push(`${p.name}: Unit Allocation Mismatch — ${u.name}`);u.tiers.forEach(tier=>{if(tier.price<=0)w.push(`${p.name}: No Unit Prices — ${tier.name}`);if((tier.schedule?.mode||p.salesMode)==='MANUAL'){const allocation=salesAllocation(tier.units,tier.manual);if(!allocation.valid)w.push(`${p.name}: manual sales allocation mismatch — ${u.name} / ${tier.name}: ${allocation.allocated} / ${allocation.planned}; ${allocation.difference<0?'still to allocate':'over plan'} ${Math.abs(allocation.difference)}`);}if(tier.plan.type==='Custom'&&Math.abs(sum(tier.plan.custom.map(x=>x.percent))-100)>.001)w.push(`${p.name}: custom buyer payments must sum to 100%`);});});if(p.land.pricingMode==='Leasehold'&&!leaseholdQuote(p.land))w.push(`${p.name}: enter leasehold years and IDR per USD; using manual land price until complete`);if(p.land.pricingMode==='Leasehold'&&p.currency!=='USD')w.push(`${p.name}: leasehold calculator requires USD project currency; using manual price`);if(!landPrice(p))w.push(`${p.name}: No Land Cost`);if(p.land.type==='Custom Schedule'&&Math.abs(sum(p.land.custom.map(x=>x.amount))-landPrice(p))>.01)w.push(`${p.name}: land schedule does not equal land cost`);if(t.salesStart<=t.pbgEnd)w.push(`${p.name}: Sales Before PBG`);if(t.constructionStart<=t.pbgEnd)w.push(`${p.name}: Construction Before PBG`);if(!p.timeline.salesAfterPbg||!p.timeline.constructionAfterPbg)w.push(`${p.name}: Missing Timeline Dependencies`);if(p.construction.curve==='Custom'&&Math.abs(sum(p.construction.custom)-100)>.001)w.push(`${p.name}: Construction Curve != 100%`);if(!sum(calculateConstructionSpend(p,a).map(x=>x.amount)))w.push(`${p.name}: Missing Construction Cost`);if(!p.costs.some(c=>/tax/i.test(c.name)&&c.amount>0))w.push(`${p.name}: No Tax`);const sales=calculateSalesPlan(p,a);if(sum(sales.map(x=>x.units))>sum(p.units.map(u=>u.quantity)))w.push(`${p.name}: Sales > Available Units`);if(calculateBuyerCollections(sales,p,a).some(c=>c.month>t.handover))w.push(`${p.name}: Installments After Completion`);return w;}
/** Calendar bounds come from configured stages; cash calculations may extend for obligations. */
export function projectWindow(p:Project,a:Adjustments=neutral){
 a=a.projectId&&a.projectId!==p.id?neutral:a;
 const t=timeline(p,a),starts=[p.start,t.pbgStart,t.salesStart,t.constructionStart,...p.timeline.stages.map(s=>stageStart(p,s,a)),...(p.infrastructure||[]).map(i=>infrastructureWindow(p,i,a).start),...(p.construction.showVilla?[p.construction.showVilla.start]:[])];
 const start=Math.max(1,Math.min(...starts)),end=Math.max(start,t.handover,t.pbgEnd,t.completion,t.salesStart+t.salesDuration-1,...p.timeline.stages.map(s=>stageStart(p,s,a)+s.duration-1),...(p.infrastructure||[]).map(i=>infrastructureWindow(p,i,a).end),...(p.construction.showVilla?[p.construction.showVilla.start+p.construction.showVilla.duration-1]:[]));
 return {start,end,duration:end-start+1};
}
export function calculateProjectCashFlow(p:Project,a:Adjustments=neutral,_horizon=0,start=DEFAULT_MODEL_START,extra:{month:number;amount:number;category:string}[]=[]):Result {a=a.projectId&&a.projectId!==p.id?neutral:a;const sales=calculateSalesPlan(p,a),collections=calculateBuyerCollections(sales,p,a),costs=[...calculateProjectCosts(p,a),...extra];const duration=Math.max(projectWindow(p,a).end,...sales.map(x=>x.month),...collections.map(x=>x.month),...costs.map(x=>x.month));const months=createMonths(duration,start);collections.forEach(x=>{const m=months[x.month-1];if(m){m.inflow+=x.amount;m.collections[x.kind]=(m.collections[x.kind]||0)+x.amount}});costs.forEach(x=>{const m=months[x.month-1];if(m){m.outflow+=x.amount;m.categories[x.category]=(m.categories[x.category]||0)+x.amount}});sales.forEach(x=>{const m=months[x.month-1];if(m){m.contracts+=x.value;m.units+=x.units}});const warnings=validateProject(p,a);if(sales.some(x=>x.month>=2400))warnings.push(`${p.name}: sales exceed the 200-year calculation limit`);if([...costs,...collections].some(x=>x.month<1))warnings.push(`${p.name}: scheduled activity before model start`);return finish(months,sum(sales.map(x=>x.value)),sum(p.units.map(u=>u.quantity)),sum(p.units.map(u=>u.quantity*u.area)),warnings,duration);}
export function calculatePortfolioCashFlow(model:FinancialModel,a:Adjustments=neutral){model=migrateWorkforce(model);const staff=calculateWorkforcePayroll(model,a);const shared=[...allocateSharedResources(model,a),...staff],corporate=[...calculateCorporateOverhead(model,a),...shared.filter(x=>!x.projectId)];const projects=model.projects.map(p=>calculateProjectCashFlow(p,a,model.horizon,model.startDate, [...shared.filter(x=>x.projectId===p.id),...(model.projects.length===1?corporate:[])]));const duration=Math.max(1,...projects.map(p=>p.duration),...corporate.map(c=>c.month));const months=createMonths(duration,model.startDate);projects.forEach(p=>p.months.forEach((m,i)=>{const target=months[i];target.inflow+=m.inflow;target.outflow+=m.outflow;target.units+=m.units;target.contracts+=m.contracts;Object.entries(m.categories).forEach(([k,v])=>target.categories[k]=(target.categories[k]||0)+v);Object.entries(m.collections).forEach(([k,v])=>target.collections[k]=(target.collections[k]||0)+v)}));(model.projects.length===1?[]:corporate).forEach(c=>{const m=months[c.month-1];if(m){m.outflow+=c.amount;m.categories[c.category]=(m.categories[c.category]||0)+c.amount;}});const warnings=projects.flatMap(p=>p.warnings);if(!model.corporate.some(c=>c.name==='Office Rent'&&c.amount>0))warnings.push('Portfolio: No Office Rent');if(model.projects.some(p=>p.currency!==model.currency))warnings.push('Portfolio: mixed currencies are not converted; align project currencies');model.resources.forEach(r=>{if(r.method==='Manual %'&&Math.abs(sum(Object.values(r.allocations))-100)>.001)warnings.push(`${r.name}: manual allocation must sum to 100%`)});const result=finish(months,sum(projects.map(p=>p.revenue)),sum(projects.map(p=>p.units)),sum(projects.map(p=>p.gla)),warnings,duration);if(result.peak>0)result.warnings.push(`Negative Cash: ${result.peak.toLocaleString('en-US')} funding required in month ${result.peakMonth}`);return {...result,projects};}
export const calculateProjectPnL=calculateProjectCashFlow;
export const calculatePortfolioPnL=calculatePortfolioCashFlow;

export function departmentWindow(model:FinancialModel,d:Department,a:Adjustments=neutral){const projects=model.projects;const base=d.anchor==='Fixed Month'||!projects.length?1:Math.min(...projects.map(p=>anchorMonth(p,d.anchor,a)));const start=Math.max(1,base+d.offset);return {start,end:start+d.duration-1,duration:d.duration};}
export function moveDepartment(model:FinancialModel,departmentId:string,delta:number,edge:'move'|'start'|'end'='move',a:Adjustments=neutral):FinancialModel {const m=migrateWorkforce(model);return {...m,workforce:{...m.workforce!,departments:m.workforce!.departments.map(d=>{if(d.id!==departmentId)return d;const w=departmentWindow(m,d,a);if(edge==='end')return {...d,duration:Math.max(1,Math.min(240,d.duration+delta))};const change=Math.max(1-w.start,edge==='start'?Math.min(delta,d.duration-1):delta);return {...d,offset:d.offset+change,duration:edge==='start'?d.duration-change:d.duration};})}};}
export function calculateWorkforcePayroll(input:FinancialModel,a:Adjustments=neutral){const model=migrateWorkforce(input),wf=model.workforce!;return wf.employees.flatMap(e=>{const d=wf.departments.find(d=>d.id===e.departmentId);if(!d)return [];const w=departmentWindow(model,d,a);const allocations=[{projectId:null as string|null,amount:e.salary}];return Array.from({length:w.duration},(_,i)=>allocations.map(x=>({...x,month:w.start+i,category:'Payroll',departmentId:d.id,department:d.name,employeeId:e.id,role:e.role,name:e.name}))).flat();});}

/** Move/resize sales and construction with signed offsets around their anchor. */
export function moveProjectActivity(p:Project,name:'Sales'|'Construction',delta:number,edge?:'start'|'end',a:Adjustments=neutral):Project {
 const q=structuredClone(p),t=q.timeline,w=timeline(p,a),sales=name==='Sales';
 const offset=sales?'salesOffset':'constructionOffset',duration=sales?'salesDuration':'constructionDuration';
 const start=sales?w.salesStart:w.constructionStart,base=(sales?t.salesAfterPbg:t.constructionAfterPbg)?w.pbgEnd+1:p.start;
 const applied=edge==='end'?delta:Math.max(1-start,edge==='start'?Math.min(delta,t[duration]-1):delta);
 if(edge!=='end')t[offset]=Math.min(240,Math.max(-720,start+applied-base));
 if(edge){const before=t[duration];t[duration]=Math.max(1,Math.min(240,before+(edge==='end'?applied:-applied)));if(sales)q.units=q.units.map(u=>({...u,tiers:u.tiers.map(tier=>({...tier,window:Math.max(1,Math.round(tier.window*t[duration]/before)),offset:Math.round(tier.offset*t[duration]/before)}))}));}
 return q;
}

/** A manual PBG move explicitly overrides the default land prerequisite. */
export function movePbg(p:Project,delta:number,edge?:'start'|'end',a:Adjustments=neutral):Project {
 const q=structuredClone(p),w=timeline(p,a);
 const shift=edge==='end'?0:Math.max(1-w.pbgStart,edge==='start'?Math.min(delta,w.pbgDuration-1):delta);
 if(edge!=='end'&&shift!==0){q.timeline.pbgAfterLand=false;q.timeline.pbgOffset=w.pbgStart+shift-p.start;}
 if(edge)q.timeline.pbgDuration=Math.max(1,q.timeline.pbgDuration+(edge==='end'?delta:-shift));
 return q;
}
