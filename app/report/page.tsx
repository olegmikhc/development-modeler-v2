'use client';
import {useEffect,useState} from 'react';
import {Report} from '@/features/reports/report';
import {FinancialModel} from '@/types/model';
import {useModels} from '@/store/model-store';
export default function ReportPage(){const [model,setModel]=useState<FinancialModel|null>(null);useEffect(()=>{const s=useModels.getState();setModel(s.models.find(m=>m.id===s.activeId)||s.models[0]);(window as any).__renderReport=(m:FinancialModel)=>setModel(m);},[]);return model?<><button className="btn" onClick={()=>window.print()}>Print report</button><Report model={model}/><span id="report-ready" data-model={model.id}/></>:<p>Preparing report…</p>}
