import {FinancialModel} from '@/types/model';
import {stableJSON} from './stable-json';
import {migrateInfrastructure} from './infrastructure-migration';
import {migrateWorkforce} from './workforce';
import {modelEnvelope} from './validation/model';

/** Validate the entire batch before changing anything; preserve unsynced local models. */
export function mergeCloudModels(local:FinancialModel[],incoming:FinancialModel[]){
 const cloud=incoming.map(raw=>{
  const parsed=modelEnvelope.safeParse(raw);
  if(!parsed.success)throw Error('Invalid cloud model. Local models were not changed.');
  return migrateInfrastructure(migrateWorkforce(parsed.data as FinancialModel));
 });
 const backups=local.filter(m=>{const replacement=cloud.find(c=>c.id===m.id);return replacement&&stableJSON(replacement)!==stableJSON(m)}).map(m=>structuredClone(m));
 return {models:[...local.filter(m=>!cloud.some(c=>c.id===m.id)),...cloud],backups};
}
