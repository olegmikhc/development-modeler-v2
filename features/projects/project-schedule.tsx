'use client';
import {Project} from '@/types/model';
import {projectWindow,anchorMonth,infrastructureWindow,moveInfrastructure,movePbg,moveProjectActivity,moveShowVilla,stageStart,timeline} from '@/lib/financial-engine';
import {ScheduleBar,ScheduleAxis} from './schedule-bar';
import {Select,Toggle} from '@/components/ui/controls';
import {tr} from '@/lib/i18n';
export function ProjectSchedule({project:p,startDate,onChange}:{project:Project;startDate:string;onChange:(p:Project)=>void}){
 const t=timeline(p),horizon=projectWindow(p).end+6; // Editing runway only; never used as a financial horizon.
 const bar=(label:string,start:number,duration:number,change:(s:number,d:number,e:'move'|'start'|'end')=>void,color?:string,milestone=false)=><ScheduleBar label={label} start={start} duration={duration} horizon={horizon} startDate={startDate} onChange={change} color={color} milestone={milestone}/>;
 return <><p className="pe-help">Перетаскивайте полосу, чтобы перенести этап. Потяните за край, чтобы изменить длительность. Стрелки на клавиатуре — шаг в один месяц.</p><div className="pe-schedule-scroll"><div className="pe-schedule-canvas"><ScheduleAxis horizon={horizon} startDate={startDate}/>
 {bar('Старт проекта',p.start,1,s=>onChange({...p,start:Math.min(120,s)}),'#8e8e93',true)}
 {bar('Разрешения · PBG',t.pbgStart,t.pbgDuration,(s,d,e)=>onChange(movePbg(p,e==='end'?d-t.pbgDuration:s-t.pbgStart,e==='move'?undefined:e)),'#a18557')}
 {p.timeline.stages.map((stage,i)=><div key={i}>{bar(tr(stage.name),stageStart(p,stage),stage.duration,(start,duration)=>onChange({...p,timeline:{...p.timeline,stages:p.timeline.stages.map((s,j)=>j===i?{...s,duration,anchor:s.anchor||'Project Start',offset:start-anchorMonth(p,s.anchor||'Project Start')}:s)}}),'#8393ab')}</div>)}
 {bar('Строительство',t.constructionStart,t.constructionDuration,(s,d,e)=>onChange(moveProjectActivity(p,'Construction',e==='end'?d-t.constructionDuration:s-t.constructionStart,e==='move'?undefined:e)))}
 {bar('Продажи',t.salesStart,t.salesDuration,(s,d,e)=>onChange(moveProjectActivity(p,'Sales',e==='end'?d-t.salesDuration:s-t.salesStart,e==='move'?undefined:e)),'#34a879')}
 {p.construction.showVilla&&bar('Шоу-вилла',p.construction.showVilla.start,p.construction.showVilla.duration,(s,d,e)=>onChange(moveShowVilla(p,e==='end'?d-p.construction.showVilla!.duration:s-p.construction.showVilla!.start,e==='move'?undefined:e)),'#ac8c5c')}
 {(p.infrastructure||[]).map(item=>{const w=infrastructureWindow(p,item);return <div key={item.id}>{bar(item.name,w.start,w.duration,(s,d,e)=>onChange(moveInfrastructure(p,item.id,e==='end'?d-w.duration:s-w.start,e==='move'?undefined:e)),'#7488c4')}</div>})}
 {bar('Передача объекта',t.handover,1,start=>onChange({...p,timeline:{...p.timeline,handoverOffset:Math.max(0,start-t.completion)}}),'#8e8e93',true)}
 </div></div><p className="pe-help">Здесь редактируется базовый план. Сценарные задержки и сезонность применяются при расчёте. Дата передачи не может быть раньше завершения строительства.</p>
 <details className="pe-details"><summary>Связи между этапами</summary><Toggle label="PBG starts after land control / payment" checked={p.timeline.pbgAfterLand!==false} onChange={pbgAfterLand=>onChange({...p,timeline:{...p.timeline,pbgAfterLand}})}/><Toggle label="Sales timing relative to PBG end" checked={p.timeline.salesAfterPbg} onChange={salesAfterPbg=>onChange({...p,timeline:{...p.timeline,salesAfterPbg}})}/><Toggle label="Construction timing relative to PBG end" checked={p.timeline.constructionAfterPbg} onChange={constructionAfterPbg=>onChange({...p,timeline:{...p.timeline,constructionAfterPbg}})}/>{p.timeline.stages.map((stage,i)=><Select key={i} label={stage.name} value={stage.anchor||'Project Start'} options={['Project Start','PBG Start','PBG End','Sales Start','Construction Start','Handover']} onChange={anchor=>onChange({...p,timeline:{...p.timeline,stages:p.timeline.stages.map((s,j)=>j===i?{...s,anchor,offset:stageStart(p,s)-anchorMonth(p,anchor)}:s)}})}/>)}</details></>;
}
