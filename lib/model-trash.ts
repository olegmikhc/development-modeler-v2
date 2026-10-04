import {FinancialModel} from '@/types/model';
export function trashModel(models:FinancialModel[],activeId:string,modelId:string){
 const removed=models.find(m=>m.id===modelId);
 if(!removed||models.length<=1)return null;
 const remaining=models.filter(m=>m.id!==modelId);
 return {models:remaining,activeId:activeId===modelId?remaining[0].id:activeId,removed:structuredClone(removed)};
}
