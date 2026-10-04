import {it,expect} from 'vitest';
import {copyModel} from './copy-model';
import {demoModel} from './demo';
import {modelEnvelope} from './validation/model';
it('creates an independent valid model without changing the source',()=>{const source=demoModel(),copy=copyModel(source);expect(copy.id).not.toBe(source.id);expect(copy.projects).toEqual(source.projects);copy.projects[0].name='Changed';expect(source.projects[0].name).not.toBe('Changed');expect(modelEnvelope.safeParse(copy).success).toBe(true)});
