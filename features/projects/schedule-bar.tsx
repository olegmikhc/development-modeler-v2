'use client';
import {useRef,useState} from 'react';
import {shiftedWindow} from '@/lib/project-editor';
import {modelMonthLabel} from '@/lib/model-calendar';
import {tr} from '@/lib/i18n';
type Edge='move'|'start'|'end';
export function ScheduleBar({label,start,duration,horizon,startDate,color='#007aff',milestone=false,onChange}:{label:string;start:number;duration:number;horizon:number;startDate:string;color?:string;milestone?:boolean;onChange:(start:number,duration:number,edge:Edge)=>void}){
 const track=useRef<HTMLDivElement>(null),drag=useRef<{x:number;width:number;edge:Edge;delta:number}|null>(null);
 const [preview,setPreview]=useState<{start:number;duration:number}|null>(null),w=preview||{start,duration};
 const date=(m:number)=>tr(modelMonthLabel(startDate,m));
 function begin(e:React.PointerEvent,edge:Edge){e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,width:track.current!.getBoundingClientRect().width,edge,delta:0};}
 function move(e:React.PointerEvent){const d=drag.current;if(!d)return;d.delta=Math.round((e.clientX-d.x)/d.width*horizon);setPreview(shiftedWindow(start,duration,d.delta,d.edge,horizon));}
 function end(){const d=drag.current;if(!d)return;const next=shiftedWindow(start,duration,d.delta,d.edge,horizon);drag.current=null;setPreview(null);if(next.start!==start||next.duration!==duration)onChange(next.start,next.duration,d.edge);}
 const keys=(e:React.KeyboardEvent,edge:Edge)=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const next=shiftedWindow(start,duration,(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?3:1),edge,horizon);onChange(next.start,next.duration,edge);};
 return <div className="pe-schedule-row"><div className="pe-stage-title"><strong>{label}</strong><small>{date(w.start)}{!milestone&&` — ${date(w.start+w.duration-1)}`}</small></div><div className="pe-track" ref={track} style={{backgroundSize:`${100/horizon}% 100%`}}><div className="pe-period" style={{left:`${(w.start-1)/horizon*100}%`,width:`${w.duration/horizon*100}%`,background:color}}>
  {!milestone&&<button type="button" className="pe-handle" aria-label={`${label}: начало`} onPointerDown={e=>begin(e,'start')} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;setPreview(null)}} onKeyDown={e=>keys(e,'start')}/>}
  <div className="pe-period-body" role="slider" tabIndex={0} aria-label={`${label}: переместить`} aria-valuemin={1} aria-valuemax={horizon-duration+1} aria-valuenow={w.start} aria-valuetext={`${date(w.start)}, ${w.duration} мес.`} onPointerDown={e=>begin(e,'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;setPreview(null)}} onKeyDown={e=>keys(e,'move')}>{w.duration>=3?`${w.duration} мес.`:''}</div>
  {!milestone&&<button type="button" className="pe-handle" aria-label={`${label}: окончание`} onPointerDown={e=>begin(e,'end')} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;setPreview(null)}} onKeyDown={e=>keys(e,'end')}/>}
 </div></div><span className="pe-duration">{milestone?'●':`${w.duration} мес.`}</span></div>;
}
export function ScheduleAxis({horizon,startDate}:{horizon:number;startDate:string}){return <div className="pe-schedule-row pe-axis"><span>Этап / календарь</span><div style={{display:'grid',gridTemplateColumns:`repeat(${horizon},1fr)`}}>{Array.from({length:horizon},(_,i)=><span key={i}>{i%3===0?tr(modelMonthLabel(startDate,i+1)):''}</span>)}</div><span>Срок</span></div>}
