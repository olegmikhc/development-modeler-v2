import {FinancialModel} from '@/types/model';
/** Child IDs are scoped to the independent snapshot; cloud identity is a new model ID. */
export function copyModel(model:FinancialModel):FinancialModel {
 return {...structuredClone(model),id:crypto.randomUUID(),name:`${model.name} · Copy`,created:new Date().toISOString()};
}
