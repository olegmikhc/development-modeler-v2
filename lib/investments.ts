import {calculatePortfolioCashFlow, calculatePeakFunding, round} from '@/lib/financial-engine';
import {Adjustments, FinancialModel, Investment, neutral} from '@/types/model';
import {modelMonthLabel} from '@/lib/model-calendar';

export interface InvestmentMonth {
 month:number; contribution:number; principalPaid:number; incomePaid:number;
 incomeAccrued:number; principalBalance:number; incomeBalance:number;
}
export interface InvestorCash {date:number;amount:number}
export interface InvestmentResult {
 investment:Investment; months:InvestmentMonth[]; contributed:number; principalPaid:number;
 incomePaid:number; incomeAccrued:number; principalBalance:number; incomeBalance:number;
 annualReturn:number|null; returnStatus:string; cash:InvestorCash[]; warnings:string[];
}
const sum=(xs:number[])=>round(xs.reduce((a,b)=>a+b,0));
const amount=(n:number)=>Number.isFinite(n)?Math.max(0,round(n)):0;
const month=(n:number)=>Math.max(1,Math.min(720,Math.round(Number.isFinite(n)?n:1)));
export function createInvestment(projectId:string|null=null):Investment {
 return {id:crypto.randomUUID(),name:'Новый инвестор',projectId,enabled:true,type:'annual',rate:12,
 compounding:'simple',incomePayment:'maturity',maturityMonth:24,autoSettle:true,
 tranches:[{id:crypto.randomUUID(),month:1,amount:100000}],repayments:[]};
}
function dateAt(start:string,m:number,end=false){
 const [year,mon]=start.split('-').map(Number);
 return Date.UTC(year,mon-1+m-1+(end?1:0),1);
}
/** ACT/365 XIRR. Non-conventional flows are deliberately not assigned an arbitrary root. */
export function annualizedReturn(input:InvestorCash[]):{value:number|null;status:string}{
 const byDate=new Map<number,number>();
 input.forEach(c=>byDate.set(c.date,(byDate.get(c.date)||0)+c.amount));
 const cash=[...byDate].sort((a,b)=>a[0]-b[0]).filter(([,v])=>Math.abs(v)>.001);
 if(!cash.some(([,v])=>v<0)||!cash.some(([,v])=>v>0))return {value:null,status:'Нужны взносы и выплаты'};
 let changes=0;for(let i=1;i<cash.length;i++)if(Math.sign(cash[i][1])!==Math.sign(cash[i-1][1]))changes++;
 if(changes!==1||cash[0][1]>=0)return {value:null,status:'Повторные вложения после выплат: XIRR может иметь несколько решений'};
 const start=cash[0][0],years=cash.map(([d])=>(d-start)/(365*86400000));
 const npv=(logRate:number)=>cash.reduce((v,[,c],i)=>v+c*Math.exp(-logRate*years[i]),0);
 let lo=-30,hi=30;
 if(!(npv(lo)>0&&npv(hi)<0))return {value:null,status:'Годовая доходность вне диапазона расчёта'};
 for(let i=0;i<120;i++){const mid=(lo+hi)/2;if(npv(mid)>0)lo=mid;else hi=mid;}
 const value=Math.expm1((lo+hi)/2)*100;
 return {value,status:'Эффективная годовая доходность XIRR · ACT/365'};
}

export function calculateInvestment(inv:Investment,start:string,profitEntitlement=0):InvestmentResult {
 const warnings:string[]=[];
 const maturity=month(inv.maturityMonth);
 const end=Math.max(maturity,...inv.tranches.map(t=>month(t.month)),...inv.repayments.map(t=>month(t.month)));
 const effectiveEnd=inv.autoSettle?end:maturity;
 if(end>maturity)warnings.push('Есть операции после срока договора. Автозакрытие перенесено на последнюю операцию; проверьте срок.');
 if(inv.rate<0||!Number.isFinite(inv.rate))warnings.push('Ставка должна быть неотрицательной.');
 if([...inv.tranches,...inv.repayments].some(t=>t.month<1||t.month>720||!Number.isInteger(t.month)))warnings.push('Месяцы операций должны быть целыми от 1 до 720.');
 if(inv.tranches.some(t=>t.amount<0)||inv.repayments.some(t=>t.principal<0||t.income<0))warnings.push('Отрицательные суммы операций не учитываются.');
 const rate=amount(inv.rate)/100,months:InvestmentMonth[]=[],cash:InvestorCash[]=[];
 let principal=0,income=0,shareAccrued=false;
 for(let m=1;m<=end;m++){
  const contribution=sum(inv.tranches.filter(t=>month(t.month)===m).map(t=>amount(t.amount)));
  principal=round(principal+contribution);
  let accrued=0;
  if(inv.type==='annual'&&m<=effectiveEnd){
   accrued=round((principal+(inv.compounding==='monthly'?income:0))*rate/12);
  }else if(inv.type==='fixed')accrued=round(contribution*rate);
  else if(inv.type==='profit-share'&&!shareAccrued&&principal>0){accrued=amount(profitEntitlement);shareAccrued=true;}
  income=round(income+accrued);
  const requests=inv.repayments.filter(t=>month(t.month)===m);
  const requestedPrincipal=sum(requests.map(t=>amount(t.principal))),requestedIncome=sum(requests.map(t=>amount(t.income)));
  let principalPaid=Math.min(principal,requestedPrincipal),incomePaid=Math.min(income,requestedIncome);
  if(requestedPrincipal>principal+.005)warnings.push(`М${m}: возврат тела выше доступного остатка; рассчитан только остаток.`);
  if(requestedIncome>income+.005)warnings.push(`М${m}: выплата дохода выше начисленного; рассчитан только начисленный доход.`);
  if(inv.type==='annual'&&inv.incomePayment==='monthly')incomePaid=income;
  if(inv.autoSettle&&m===end){principalPaid=principal;incomePaid=income;}
  principal=round(principal-principalPaid);income=round(income-incomePaid);
  months.push({month:m,contribution,principalPaid,incomePaid,incomeAccrued:accrued,principalBalance:principal,incomeBalance:income});
  if(contribution)cash.push({date:dateAt(start,m),amount:-contribution});
  if(principalPaid+incomePaid)cash.push({date:dateAt(start,m,true),amount:round(principalPaid+incomePaid)});
 }
 const contributed=sum(months.map(m=>m.contribution));
 if(!contributed)warnings.push('Нет взносов: доходность не рассчитывается.');
 if(principal+income>.005)warnings.push('Остаются невыплаченные обязательства. Проценты после срока не начисляются; задайте новый срок или возвраты.');
 const xirr=principal+income>.005?{value:null,status:'Не задан полный возврат капитала и дохода'}:annualizedReturn(cash);
 return {investment:inv,months,contributed,principalPaid:sum(months.map(m=>m.principalPaid)),incomePaid:sum(months.map(m=>m.incomePaid)),incomeAccrued:sum(months.map(m=>m.incomeAccrued)),principalBalance:principal,incomeBalance:income,annualReturn:xirr.value,returnStatus:xirr.status,cash,warnings};
}

/** Operating cash flows remain untouched. This layer adds financing and a two-level profit waterfall. */
export function calculateFinancing(model:FinancialModel,a:Adjustments=neutral){
 const operating=calculatePortfolioCashFlow(model,a),warnings:string[]=[];
 const active=(model.investments||[]).filter(i=>i.enabled);
 const valid=active.filter(i=>{
  if(i.projectId&&!model.projects.some(p=>p.id===i.projectId)){warnings.push(`${i.name}: проект удалён. Инвестиция не включена; выберите проект или портфель.`);return false;}
  return true;
 });
 const debt=valid.filter(i=>i.type!=='profit-share').map(i=>calculateInvestment(i,model.startDate));
 const debtCost=sum(debt.map(i=>i.incomeAccrued));
 const projectProfit=new Map(model.projects.map((p,idx)=>[p.id,operating.projects[idx].profit-sum(debt.filter(d=>d.investment.projectId===p.id).map(d=>d.incomeAccrued))]));
 const shares=valid.filter(i=>i.type==='profit-share');
 const groups=new Map<string,number>();
 shares.forEach(i=>{const key=i.projectId||'portfolio';groups.set(key,(groups.get(key)||0)+amount(i.rate))});
 groups.forEach((total,key)=>{if(total>100+.001)warnings.push(`${key==='portfolio'?'Портфель':model.projects.find(p=>p.id===key)?.name}: сумма долей прибыли ${total.toFixed(1)}% превышает 100%. Расчёт показывает превышение без нормализации.`)});
 const projectShares=shares.filter(i=>i.projectId).map(i=>calculateInvestment(i,model.startDate,Math.max(0,projectProfit.get(i.projectId!)||0)*amount(i.rate)/100));
 const projectDistributions=sum(projectShares.map(i=>i.incomeAccrued));
 const portfolioShareBase=Math.max(0,operating.profit-debtCost-projectDistributions);
 const portfolioShares=shares.filter(i=>!i.projectId).map(i=>calculateInvestment(i,model.startDate,portfolioShareBase*amount(i.rate)/100));
 const investors=valid.map(i=>[...debt,...projectShares,...portfolioShares].find(r=>r.investment.id===i.id)!);
 const distributions=sum([...projectShares,...portfolioShares].map(i=>i.incomeAccrued));
 const incomeAccrued=round(debtCost+distributions),developerProfit=round(operating.profit-incomeAccrued);
 investors.forEach(i=>{
  warnings.push(...i.warnings.map(w=>`${i.investment.name}: ${w}`));
  if(i.investment.type==='profit-share'&&i.months.some(m=>m.incomePaid>0&&m.month<operating.duration))warnings.push(`${i.investment.name}: доля прибыли выплачивается до конца модели по прогнозу итоговой прибыли.`);
 });
 const end=Math.max(operating.months.length,...investors.map(i=>i.months.length));
 let cumulative=0;
 const months=Array.from({length:end},(_,idx)=>{
  const month=idx+1,op=operating.months[idx];
  const rows=investors.map(i=>i.months[idx]).filter(Boolean);
  const contribution=sum(rows.map(r=>r.contribution)),principalPaid=sum(rows.map(r=>r.principalPaid)),incomePaid=sum(rows.map(r=>r.incomePaid));
  const operatingNet=op?.net||0,net=round(operatingNet+contribution-principalPaid-incomePaid);
  cumulative=round(cumulative+net);
  return {month,label:modelMonthLabel(model.startDate,month),operatingNet,contribution,principalPaid,incomePaid,net,cumulative,
   principalBalance:sum(investors.map(i=>i.months[idx]?.principalBalance??i.principalBalance)),
   incomeBalance:sum(investors.map(i=>i.months[idx]?.incomeBalance??i.incomeBalance))};
 });
 const funding=calculatePeakFunding(months);
 if(funding.peak>0&&investors.length)warnings.push(`После инвестиций требуется дополнительный капитал ${funding.peak.toLocaleString('ru-RU')} ${model.currency}, пик — М${funding.peakMonth}. Выплаты не ограничиваются доступным остатком.`);
 return {operating,investors,months,duration:Math.max(operating.duration,...investors.map(i=>i.months.length)),warnings,debtCost,distributions,incomeAccrued,developerProfit,
  developerMargin:operating.revenue?developerProfit/operating.revenue:0,
  contributed:sum(investors.map(i=>i.contributed)),principalPaid:sum(investors.map(i=>i.principalPaid)),
  incomePaid:sum(investors.map(i=>i.incomePaid)),principalBalance:sum(investors.map(i=>i.principalBalance)),
  incomeBalance:sum(investors.map(i=>i.incomeBalance)),...funding};
}
