import {Month} from '@/types/model';
export const DEFAULT_MODEL_START='2027-01-01';
export function modelMonthDate(start:string,month:number){const [year,m]=start.split('-').map(Number);return new Date(Date.UTC(year,m-1+month-1,1))}
export function modelMonthLabel(start:string,month:number){return modelMonthDate(start,month).toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'})}
export function annualSales(months:Month[],start:string){const years=new Map<number,{year:number;units:number;months:Month[]}>();for(const month of months){const year=modelMonthDate(start,month.month).getUTCFullYear();if(!years.has(year))years.set(year,{year,units:0,months:[]});const entry=years.get(year)!;entry.units+=month.units;entry.months.push(month)}return [...years.values()]}
