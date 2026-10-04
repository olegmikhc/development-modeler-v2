import {it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {movePbg,timeline,stageStart} from './index';
import {projectSchema} from '@/lib/validation/model';
it('moves PBG before land payment without changing land or other projects',()=>{
 const m=demoModel(),p=m.projects[1];p.land.permitAfterInitial=false;
 const before=timeline(p),others=structuredClone(m.projects.filter(x=>x.id!==p.id));
 const q=movePbg(p,1-before.pbgStart);
 expect(timeline(q).pbgStart).toBe(1);expect(q.land).toEqual(p.land);
 expect(timeline(q).pbgDuration).toBe(before.pbgDuration);
 expect(stageStart(q,q.timeline.stages[0])).toBe(1);
 expect(m.projects.filter(x=>x.id!==p.id)).toEqual(others);
 expect(projectSchema.safeParse(q).success).toBe(true);
 expect(timeline({...q,timeline:{...q.timeline,pbgAfterLand:true}}).pbgStart).toBe(before.pbgStart);
});
it('allows PBG before project start and clamps at model month one',()=>{
 const p=demoModel().projects[0];p.start=10;
 const q=movePbg(p,-100);expect(timeline(q).pbgStart).toBe(1);expect(q.start).toBe(10);expect(projectSchema.safeParse(q).success).toBe(true);
});
