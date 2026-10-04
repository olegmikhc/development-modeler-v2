import {it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {fitTimeline} from './fit-timeline';
import {timeline,stageStart,departmentWindow,moveProjectActivity,calculateProjectRevenue} from './financial-engine';
import {modelEnvelope} from './validation/model';
import {neutral} from '@/types/model';

it('fits all displayed stages and payroll to 24 while preserving short durations',()=>{
 const m=demoModel();const result=fitTimeline(m,24);
 expect(m.horizon).not.toBe(24);
 for(const p of result.projects){const t=timeline(p);expect(Math.max(t.handover,t.pbgEnd,t.completion,t.salesStart+t.salesDuration-1,...p.timeline.stages.map(s=>stageStart(p,s)+s.duration-1))).toBeLessThanOrEqual(24);expect(t.constructionDuration).toBe(timeline(m.projects.find(x=>x.id===p.id)!).constructionDuration)}
 for(const d of result.workforce?.departments||[])expect(departmentWindow(result,d).end).toBeLessThanOrEqual(24);
 expect(modelEnvelope.safeParse(result).success).toBe(true);
 expect(fitTimeline(result,24)).toEqual(result);
 const p=result.projects[0];expect(timeline(moveProjectActivity(p,'Construction',30)).completion).toBeGreaterThan(24);
});
it('compresses long stages and preserves manual units and revenue',()=>{
 const m=demoModel();const p=m.projects[0];p.timeline.constructionDuration=60;p.salesMode='MANUAL';p.units.forEach(u=>u.tiers.forEach(t=>{t.manual=Array(40).fill(1)}));
 const r=fitTimeline(m,18);expect(timeline(r.projects[0]).completion).toBe(18);expect(calculateProjectRevenue(r.projects[0])).toBe(calculateProjectRevenue(p));expect(r.projects[0].units[0].tiers[0].manual.length).toBe(18);
});
it('preserves stages already within the deadline and respects scenario duration',()=>{
 const m=demoModel(),a={...neutral,pbgDelay:2,constructionDuration:3,speed:20};
 const r=fitTimeline(m,24,a);
 r.projects.forEach(p=>{const t=timeline(p,a);expect(t.completion).toBeLessThanOrEqual(24);expect(t.salesStart+t.salesDuration-1).toBeLessThanOrEqual(24)});
 expect(fitTimeline(m,60)).toEqual({...m,horizon:60});
});
