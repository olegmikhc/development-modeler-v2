import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {trashModel} from './model-trash';
it('keeps the working model and makes an independent backup of the removed one',()=>{const a=demoModel(),b=demoModel();const r=trashModel([a,b],a.id,b.id)!;expect(r.models).toEqual([a]);expect(r.activeId).toBe(a.id);r.removed.name='changed';expect(b.name).not.toBe('changed')});
it('switches away from a removed active model and retains the last model',()=>{const a=demoModel(),b=demoModel();expect(trashModel([a,b],a.id,a.id)!.activeId).toBe(b.id);expect(trashModel([a],a.id,a.id)).toBeNull()});
