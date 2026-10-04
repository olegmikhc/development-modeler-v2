import {Adjustments,FinancialModel,neutral} from '@/types/model';
import {anchorMonth,calculateLandPayments,departmentWindow,infrastructureWindow,stageStart,timeline} from '@/lib/financial-engine';

/** Fit overflowing bars once. Subsequent dragging remains unconstrained. */
export function fitTimeline(input:FinancialModel,months:number,a:Adjustments=neutral):FinancialModel {
 const m=structuredClone(input);m.horizon=months;
 const fit=(start:number,duration:number)=>{const length=Math.min(duration,months);return {start:Math.max(1,Math.min(start,months-length+1)),duration:length}};
 m.projects=m.projects.map((p,index)=>{
  const old=input.projects[index],before=timeline(old,a),t=p.timeline;
  const permit=fit(before.pbgStart,before.pbgDuration);
  p.start=Math.min(p.start,months);
  if(p.timeline.pbgAfterLand!==false){
  p.start=Math.min(p.start,permit.start);
  p.land.control=Math.min(p.land.control,permit.start-p.start+1);
  // If full land payment is the permit prerequisite, keep that prerequisite intact.
  if(!p.land.permitAfterInitial&&Math.max(...calculateLandPayments(p,a).map(x=>x.month))>permit.start){
   p.land.custom=calculateLandPayments(p).map(x=>({month:Math.max(1,Math.min(x.month,permit.start)-p.start+1),amount:x.amount}));p.land.type='Custom Schedule';
  }
  }
  t.pbgOffset=permit.start-p.start;t.pbgDuration=Math.max(1,permit.duration-a.pbgDelay);
  const permitEnd=timeline(p,a).pbgEnd;
  const construction=fit(before.constructionStart,before.constructionDuration);
  t.constructionOffset=construction.start-(t.constructionAfterPbg?permitEnd+1:p.start);
  t.constructionDuration=Math.max(1,construction.duration-a.constructionDuration);
  if(p.construction.showVilla){const v=p.construction.showVilla;p.construction.showVilla={...v,...fit(v.start,v.duration)};}
  const sales=fit(before.salesStart,before.salesDuration),speed=1+a.speed/100;
  t.salesOffset=sales.start-(t.salesAfterPbg?permitEnd+1:p.start);
  t.salesDuration=Math.max(1,Math.round(sales.duration*speed));
  t.handoverOffset=Math.max(0,Math.min(before.handover,months)-timeline(p,a).completion);
  t.stages=t.stages.map((s,i)=>{
   const w=fit(stageStart(old,old.timeline.stages[i],a),s.duration);
   if(stageStart(p,s,a)===w.start&&s.duration===w.duration)return s;
   return {...s,duration:w.duration,...(s.anchor?{offset:w.start-anchorMonth(p,s.anchor,a)}:{anchor:'Project Start' as const,offset:w.start-p.start})};
  });
  p.infrastructure=(p.infrastructure||[]).map((item,i)=>{
   const w=fit(infrastructureWindow(old,old.infrastructure![i],a).start,item.duration);
   return {...item,offset:w.start-timeline(p,a).constructionStart,duration:w.duration};
  });
  // Keep unit totals when a manual schedule must move or compress.
  p.units.forEach(u=>u.tiers.forEach(tier=>{
   const w=fit(before.salesStart+Math.round(tier.offset/speed),Math.max(1,Math.round(tier.window/speed)));
   const tierStart=Math.max(sales.start,w.start),tierDuration=Math.min(w.duration,months-tierStart+1);
   tier.offset=Math.max(0,Math.round((tierStart-sales.start)*speed));tier.window=Math.max(1,Math.round(tierDuration*speed));
   if((tier.schedule?.mode||p.salesMode)==='MANUAL'){
    const last=tier.manual.findLastIndex(n=>n>0)+1;
    if(last>months){const shift=last-months,manual=Array(months).fill(0);tier.manual.forEach((n,i)=>{if(n>0)manual[Math.max(0,i-shift)]+=n});tier.manual=manual;}
   }
  }));
  return p;
 });
 if(m.workforce)m.workforce.departments=m.workforce.departments.map((d,i)=>{
  const old=departmentWindow(input,input.workforce!.departments[i],a),w=fit(old.start,old.duration);
  const base=d.anchor==='Fixed Month'||!m.projects.length?1:Math.min(...m.projects.map(p=>anchorMonth(p,d.anchor,a)));
  return {...d,offset:w.start-base,duration:w.duration};
 });
 return m;
}
