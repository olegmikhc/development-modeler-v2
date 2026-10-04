import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {migrateWorkforce} from './workforce';
import {mergeCloudModels} from './merge-cloud-models';
it('preserves unrelated local models and backs up replaced content',()=>{
 const local=migrateWorkforce(demoModel()),other=migrateWorkforce(demoModel()),remote=structuredClone(local);remote.name='Cloud';
 const result=mergeCloudModels([local,other],[remote]);expect(result.models).toHaveLength(2);expect(result.models).toContainEqual(other);expect(result.backups).toEqual([local]);expect(local.name).not.toBe('Cloud');
});
it('does not remove anything for an empty cloud or back up identical snapshots',()=>{const local=migrateWorkforce(demoModel());expect(mergeCloudModels([local],[])).toEqual({models:[local],backups:[]});expect(mergeCloudModels([local],[local]).backups).toEqual([])});
it('rejects malformed cloud data before touching local state',()=>{const local=migrateWorkforce(demoModel());expect(()=>mergeCloudModels([local],[{id:local.id} as any])).toThrow('Invalid cloud model');expect(local.projects).toHaveLength(3)});
