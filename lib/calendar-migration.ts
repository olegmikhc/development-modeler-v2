import {FinancialModel} from '@/types/model';
/** One-time correction of the active model's former default; later date edits remain unrestricted. */
export function migrateLegacyCalendar<T extends {models?:FinancialModel[];activeId?:string;versions?:{id:string;name:string;date:string;model:FinancialModel}[]}>(state:T):T {
 const old=state.models?.find(m=>m.id===state.activeId&&m.startDate==='2026-01-01');if(!old)return state;
 return {...state,models:state.models!.map(m=>m.id===old.id?{...m,startDate:'2027-01-01'}:m),versions:[{id:crypto.randomUUID(),name:'Before calendar start correction',date:new Date().toISOString(),model:old},...(state.versions||[])]};
}
