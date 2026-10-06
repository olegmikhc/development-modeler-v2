import {it,expect,vi} from 'vitest';
import {demoModel} from './demo';
import {copyModel} from './copy-model';
import {mergeCloudModels} from './merge-cloud-models';
import {migrateWorkforce} from './workforce';
import {createInvestment} from './investments';
const backend=vi.hoisted(()=>({rows:new Map<string,{data:any;revision:number}>(),rpc:vi.fn()}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:{email_confirmed_at:'2026-01-01'}}})},rpc:backend.rpc})}));
import {syncModel} from './supabase';
it('saves and reloads original and edited copy as independent cloud documents',async()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test');
 backend.rpc.mockImplementation(async(_name:string,args:any)=>{
  const row=backend.rows.get(args.model_uuid);
  if(args.payload.id!==args.model_uuid||((row?.revision||0)!==args.expected_revision))return {error:Error('Conflict')};
  const revision=(row?.revision||0)+1;backend.rows.set(args.model_uuid,{data:structuredClone(args.payload),revision});return {data:revision};
 });
 try{
  const original=migrateWorkforce(demoModel());original.investments=[createInvestment(original.projects[0].id)];
  await syncModel(original,'workspace',0);
  const copy=copyModel(original);const originalJson=JSON.stringify(original);
  copy.projects[0].construction.costPerM2+=321;copy.corporate[0].amount+=123;copy.workforce!.employees[0].salary+=456;copy.investments![0].rate+=2;copy.scenarios[0].adjustments.price=15;
  await syncModel(copy,'workspace',0);
  copy.projects[0].construction.costPerM2+=100;await syncModel(copy,'workspace',1);
  expect(backend.rows.size).toBe(2);expect(backend.rows.get(original.id)?.revision).toBe(1);
  expect(JSON.stringify(backend.rows.get(original.id)?.data)).toBe(originalJson);
  const restored=mergeCloudModels([],Array.from(backend.rows.values(),x=>x.data)).models;
  expect(restored).toHaveLength(2);
  expect(restored.find(m=>m.id===copy.id)?.projects[0].construction.costPerM2).toBe(copy.projects[0].construction.costPerM2);
  expect(restored.find(m=>m.id===original.id)?.projects[0].construction.costPerM2).toBe(original.projects[0].construction.costPerM2);
  expect(JSON.stringify(original)).toBe(originalJson);
 }finally{vi.unstubAllEnvs();backend.rows.clear()}
});
