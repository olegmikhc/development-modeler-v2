'use client';
import {Cost,Project,Adjustments} from '@/types/model';
import {calculateProjectRevenue,calculateConstructionSpend,calculateInfrastructureSpend,costAmount} from '@/lib/financial-engine';
import {money,number} from '@/lib/format';
import {tr,useLanguage} from '@/lib/i18n';
export function CostCalculation({cost,project,adjustments}:{cost:Cost;project:Project;adjustments:Adjustments}){
 useLanguage();
 const fmt=(value:number)=>money(value,false,project.currency);
 const adjustment=cost.name==='Marketing'?adjustments.marketing:cost.name==='Sales Commission'?adjustments.commission:cost.name==='Contingency'?adjustments.contingency:0;
 let formula:string,hint:string;
 switch(cost.driver){
  case '% Revenue':
   formula=`${tr('Contracted revenue')} ${fmt(calculateProjectRevenue(project,adjustments))} × ${number(cost.amount)}%`;
   hint=tr('Uses the same sales plan as P&L. Portfolio percentages combine the amounts and revenues of all projects.');break;
  case '% Construction':{
   const construction=[...calculateConstructionSpend(project,adjustments),...calculateInfrastructureSpend(project,adjustments)].reduce((sum,row)=>sum+row.amount,0);
   formula=`Строительство и инфраструктура ${fmt(construction)} × ${number(cost.amount)}%`;
   hint='База включает бюджет строительства и инфраструктурных объектов с учётом выбранного сценария.';break;
  }
  case '$ / unit':{
   const units=project.units.reduce((sum,unit)=>sum+unit.quantity,0);
   formula=`Количество юнитов ${number(units)} × ${fmt(cost.amount)} / юнит`;
   hint='Учитываются все юниты проекта из раздела «Юниты и продажи», независимо от графика продаж.';break;
  }
  case '$ / m²':{
   const area=project.units.reduce((sum,unit)=>sum+unit.quantity*unit.area,0);
   formula=`Площадь юнитов ${number(area)} м² × ${fmt(cost.amount)} / м²`;
   hint='Площадь = количество × площадь каждого типа юнитов. Земля и инфраструктура в эту базу не входят.';break;
  }
  default:
   formula=`Фиксированная сумма ${fmt(cost.amount)}`;
   hint='Это общая сумма статьи за весь проект. Период оплаты распределяет её по месяцам, а не умножает на число месяцев.';
 }
 return <div className="notice"><strong>{tr('Calculation for this project')} · {project.name}</strong><p>{formula}{adjustment!==0&&<> × {number(1+adjustment/100)} ({tr('Scenario adjustment')}: {number(adjustment)}%)</>} = <strong className="amount-negative">{fmt(costAmount(cost,project,adjustments))}</strong></p><small>{hint}</small></div>;
}
