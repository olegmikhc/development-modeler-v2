'use client';
import {NumberInput} from '@/components/ui/number-input';
import {modelMonthLabel} from '@/lib/model-calendar';
import {tr} from '@/lib/i18n';
import {SalesAllocationStatus} from './sales-allocation-status';

export function ManualSalesTable({name,planned,monthly,startDate,salesStart,salesDuration,handover,onChange}:{name:string;planned:number;monthly:number[];startDate:string;salesStart:number;salesDuration:number;handover:number;onChange:(values:number[])=>void}) {
 const end=salesStart+salesDuration-1;
 const inside=(month:number)=>month>=salesStart&&month<=end;
 const outside=monthly.reduce((sum,n,i)=>sum+(!inside(i+1)?n:0),0);
 const months=Array.from({length:Math.max(1,handover,end,monthly.findLastIndex(n=>n!==0)+1)},(_,i)=>i+1);
 const cellClass=(month:number)=>[(inside(month)?'sales-month-active':monthly[month-1]>0?'sales-month-error':'sales-month-outside'),month===salesStart?'sales-boundary-start':'',month===end?'sales-boundary-end':''].filter(Boolean).join(' ');
 const label=(month:number)=>`M${month} · ${tr(modelMonthLabel(startDate,month))}`;
 return <div className="manual-sales-panel">
  <SalesAllocationStatus planned={planned} monthly={monthly}/>
  <div className="manual-sales-heading"><h4>{tr('Monthly unit sales')}</h4><span>{tr('Scroll horizontally to view all months')}</span></div>
  <div className="sales-window-legend"><strong>{tr('Timeline sales period')}: {label(salesStart)} — {label(end)}</strong><span>{tr('Green: sales period. Grey: outside the timeline period.')}</span></div>
  {outside>0&&<div className="warning sales-window-warning" role="alert">{tr('Units outside the timeline sales period')}: <strong>{outside}</strong>. {tr('Move these sales or adjust the Sales stage in the timeline.')}</div>}
  <div className="table-scroll" tabIndex={0} role="region" aria-label={`${name} monthly sales`}><table className="data-table manual-sales-table"><thead><tr>{months.map(month=><th key={month} className={cellClass(month)}>{month===salesStart&&<span className="sales-boundary-label">{tr('Sales start')}</span>}{month===end&&<span className="sales-boundary-label">{tr('Sales end')}</span>}{tr('M')}{month}<br/>{tr(modelMonthLabel(startDate,month))}<small className="sales-month-status">{tr(inside(month)?'Sales period':'Outside period')}</small></th>)}</tr></thead><tbody><tr>{months.map(month=><td key={month} className={cellClass(month)}><NumberInput aria-label={`${name} month ${month}`} aria-invalid={!inside(month)&&monthly[month-1]>0} title={tr(inside(month)?'Sales period':'Outside period')} type="number" min={0} value={monthly[month-1]||0} onChange={e=>{const values=months.map((_,i)=>monthly[i]||0);values[month-1]=Math.max(0,Math.round(+e.target.value));onChange(values)}}/></td>)}</tr></tbody></table></div>
 </div>;
}
