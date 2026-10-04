import {Month} from '@/types/model';
/** First month with at least 70% contracted units and positive cumulative cash flow. */
export function salesMilestone(months:Pick<Month,'month'|'label'|'units'|'cumulative'>[],inventory:number){
 if(inventory<=0)return null;
 const target=Math.ceil(inventory*70/100);
 let sold=0;
 for(const month of [...months].sort((a,b)=>a.month-b.month)){
  sold+=month.units;
  if(sold>=target&&month.cumulative>0)return {...month,sold,target,share:sold/inventory};
 }
 return null;
}
