'use client';
import {tr,useLanguage} from '@/lib/i18n';
import {UnitType} from '@/types/model';
export function PaymentMix({units}:{units:UnitType[]}){useLanguage();return <div className="payment-mix">{(['Full Cash','Installment','Custom'] as const).map(type=>{const count=units.reduce((sum,u)=>sum+u.tiers.filter(t=>t.plan.type===type).reduce((n,t)=>n+t.units,0),0);return <div key={type}><span>{tr(type)}</span><strong>{count}</strong><small>{tr('Units')}</small></div>})}</div>}
