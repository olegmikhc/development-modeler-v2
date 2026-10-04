'use client';
import {tr,useLanguage} from '@/lib/i18n';
import {salesAllocation} from '@/lib/sales-allocation';
export function SalesAllocationStatus({planned,monthly}:{planned:number;monthly:number[]}){useLanguage();const s=salesAllocation(planned,monthly);return <div className={`sales-allocation-status ${s.valid?'balanced':'unbalanced'}`} role="status" aria-live="polite" aria-atomic="true"><strong>{tr('Allocated units')}: {s.allocated} / {s.planned}</strong><span>{s.valid?tr('Matches the plan'):s.difference<0?`${tr('Still to allocate')}: ${-s.difference}`:`${tr('Over plan')}: ${s.difference}`}</span></div>}
