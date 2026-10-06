import {it,expect,vi} from 'vitest';
import {demoModel} from './demo';
const mock=vi.hoisted(()=>({sync:vi.fn(),rpc:vi.fn(),insert:vi.fn(),eq:vi.fn(),read:vi.fn(),auth:vi.fn()}));
vi.mock('./supabase',()=>({syncModel:mock.sync,supabase:()=>({auth:{getUser:mock.auth},rpc:mock.rpc,from:(table:string)=>table==='financial_models'?{select:()=>({eq:(...args:unknown[])=>{mock.eq(...args);return {maybeSingle:mock.read}}})}:table==='model_versions'?{insert:mock.insert}:{select:()=>({in:()=>({limit:async()=>({data:[{organization_id:'org'}]})})})}})}));
import {saveCloudModel} from './save-cloud-model';
it('saves only the supplied model and backs up its prior cloud revision',async()=>{
 vi.stubGlobal('window',{dispatchEvent:vi.fn()});mock.auth.mockResolvedValue({data:{user:{email_confirmed_at:'yes'}}});
 const model=demoModel(),previous={...model,name:'Previous'};
 mock.read.mockResolvedValue({data:{data:previous,revision:7,organization_id:'org'}});mock.insert.mockResolvedValue({});mock.sync.mockResolvedValue(8);
 await saveCloudModel(model);
 expect(mock.eq).toHaveBeenLastCalledWith('id',model.id);
 expect(mock.insert).toHaveBeenLastCalledWith({model_id:model.id,name:'До сохранения в облако',data:previous});
 expect(mock.sync).toHaveBeenLastCalledWith(model,'org',7);vi.unstubAllGlobals();
});
it('does not overwrite when preserving the previous version fails',async()=>{
 mock.sync.mockClear();mock.insert.mockResolvedValue({error:Error('Backup failed')});
 await expect(saveCloudModel(demoModel())).rejects.toThrow('Backup failed');expect(mock.sync).not.toHaveBeenCalled();
});
