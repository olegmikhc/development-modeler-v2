import {Month} from '@/types/model';
import {modelMonthDate} from '@/lib/model-calendar';

/** Static SVG keeps labels and bars sharp in both PDF export paths. */
export function ReportSalesChart({year,months,startDate,maximum}:{year:number;months:Month[];startDate:string;maximum:number}) {
 const values=Array.from({length:12},(_,i)=>months.filter(m=>modelMonthDate(startDate,m.month).getUTCMonth()===i).reduce((sum,m)=>sum+m.units,0));
 const step=Math.max(1,Math.ceil(maximum/5)),top=step*5;
 const height=270,base=310,left=58,width=864;
 return <svg className="report-sales-chart" viewBox="0 0 960 365" role="img" aria-label={`Monthly units sold in ${year}`}>
  <title>Monthly units sold in {year}</title>
  {Array.from({length:6},(_,i)=>{const y=base-i*height/5;return <g key={i}><line x1={left} x2={left+width} y1={y} y2={y} stroke="#dfe6df"/><text x={left-12} y={y+4} textAnchor="end" fontSize="13" fill="#60705b">{i*step}</text></g>})}
  {values.map((value,i)=>{const x=left+i*width/12+12,h=value/top*height;return <g key={i}><rect x={x} y={base-h} width="48" height={h} rx="4" fill="#799785"/><text x={x+24} y={base-h-9} textAnchor="middle" fontSize="14" fill="#163c34">{value}</text><text x={x+24} y={base+26} textAnchor="middle" fontSize="13" fill="#60705b">{new Date(Date.UTC(year,i,1)).toLocaleDateString('en-US',{month:'short',timeZone:'UTC'})}</text></g>})}
 </svg>;
}
