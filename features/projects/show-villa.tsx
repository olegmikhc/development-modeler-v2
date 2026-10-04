'use client';
import {AppSelect} from '@/components/ui/app-select';
import {Project,Adjustments} from '@/types/model';
import {timeline,showVillaBudget} from '@/lib/financial-engine';
import {Field} from '@/components/ui/controls';
import {tr,useLanguage} from '@/lib/i18n';
import {money} from '@/lib/format';
export function ShowVilla({project:p,a,onChange}:{project:Project;a:Adjustments;onChange:(construction:Project['construction'])=>void}){
 useLanguage();const v=p.construction.showVilla,units=p.units.filter(u=>u.quantity>0);
 const update=(patch:Partial<NonNullable<typeof v>>)=>{if(v)onChange({...p.construction,showVilla:{...v,...patch}})};
 return <section className="editor-section"><h3>{tr('Show villa')}</h3><p>{tr('One existing unit, built on a separate schedule. Its budget is included in total construction costs.')}</p>{!v?<button className="btn" disabled={!units.length} onClick={()=>onChange({...p.construction,showVilla:{unitId:units[0].id,start:timeline(p,a).constructionStart,duration:Math.min(6,timeline(p,a).constructionDuration)}})}>{tr('Add show villa')}</button>:<>{!units.some(u=>u.id===v.unitId)&&<p role="alert">{tr('Select unit type')}</p>}<div className="form-grid"><label className="field"><span>{tr('Unit type')}</span><AppSelect value={v.unitId} onChange={e=>update({unitId:e.target.value})}>{!units.some(u=>u.id===v.unitId)&&<option value={v.unitId}>{tr('Select unit type')}</option>}{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</AppSelect></label><Field label={tr('Show villa start · model month')} type="number" min={1} max={240} step={1} value={v.start} onChange={start=>update({start:Math.max(1,Math.min(240,Math.round(start)))})}/><Field label={tr('Show villa duration · months')} type="number" min={1} max={240} step={1} value={v.duration} onChange={duration=>update({duration:Math.max(1,Math.min(240,Math.round(duration)))})}/></div><p className="notice">{tr('Budget within total construction')}: {money(showVillaBudget(p,a),false,p.currency)} · M{v.start}–M{v.start+v.duration-1}. {tr('Independent start. Advanced budget is allocated by unit area.')}</p><button className="btn" onClick={()=>{const {showVilla,...construction}=p.construction;onChange(construction)}}>{tr('Remove show villa')}</button></>}</section>
}
