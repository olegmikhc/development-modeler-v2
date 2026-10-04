import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {migrateLegacyCalendar} from './calendar-migration';
it('corrects only active legacy calendar and retains a complete backup',()=>{const m=demoModel(),other=demoModel();m.startDate=other.startDate='2026-01-01';const s={models:[m,other],activeId:m.id,versions:[]};const next=migrateLegacyCalendar(s);expect(next.models[0].startDate).toBe('2027-01-01');expect(next.models[1].startDate).toBe('2026-01-01');expect(next.versions[0]).toMatchObject({model:m});expect(m.startDate).toBe('2026-01-01');expect(migrateLegacyCalendar(next)).toBe(next)});
