import {Department,FinancialModel,Workforce} from '@/types/model';
// Conservative recognition: operating expenses such as office, CRM, permits and commissions stay costs.
export function isStaffCost(name:string){return /^(CEO|CFO|COO|CTO|CMO|Head of .+|Chief .+|Marketing Team|Sales Team|Finance Team|Legal Team|Construction Management|Sales Management|Marketing Manager|Accountant|Admin Staff|Payroll|Salaries|Salary|Зарплата|ЗП|Генеральный директор)$/i.test(name.trim());}
function departmentName(role:string){return /^(CEO|CFO|COO|CTO|CMO|Генеральный директор)$/i.test(role)?'Management':/marketing/i.test(role)?'Marketing':/sales/i.test(role)?'Sales':/construction|engineer/i.test(role)?'Construction':/legal/i.test(role)?'Legal':/finance|accountant/i.test(role)?'Finance':'Administration';}
/** Pure, idempotent migration. Source IDs, salaries and durations are retained; timing follows portfolio milestones. */
export function migrateWorkforce(model:FinancialModel):FinancialModel {
 const legacy=model.projects.some(p=>p.payroll.length)||model.corporate.some(c=>c.type==='Monthly'&&isStaffCost(c.name))||model.resources.some(r=>isStaffCost(r.name));
 if(model.workforce&&!legacy)return companyWorkforce(model);
 const workforce:Workforce={version:1,departments:[...(model.workforce?.departments||[])],employees:[...(model.workforce?.employees||[])]};
 const add=(sourceId:string,role:string,salary:number,d:Omit<Department,'id'>)=>{const same=workforce.departments.find(x=>x.name===d.name&&x.projectId===d.projectId&&x.anchor===d.anchor&&x.offset===d.offset&&x.duration===d.duration&&x.allocation===d.allocation&&JSON.stringify(x.allocations)===JSON.stringify(d.allocations));const dep=same||{id:sourceId,...d};if(!same)workforce.departments.push(dep);if(!workforce.employees.some(e=>e.id===sourceId))workforce.employees.push({id:sourceId,name:'',role,salary,departmentId:dep.id});};
 const projects=model.projects.map(p=>{p.payroll.forEach(e=>add(e.id,e.role,e.salary,{name:e.category==='Corporate'?'Management':e.category,projectId:p.id,anchor:e.anchor,offset:e.offset,duration:e.duration,allocation:'Equal',allocations:{}}));return p.payroll.length?{...p,payroll:[]}:p});
 const corporate=model.corporate.filter(c=>{if(c.type!=='Monthly'||!isStaffCost(c.name))return true;add(c.id,c.name,c.amount,{name:departmentName(c.name),projectId:null,anchor:c.anchor,offset:c.anchor==='Fixed Month'?c.start-1:c.offset,duration:c.duration,allocation:'Corporate',allocations:{}});return false});
 const resources=model.resources.filter(r=>{if(!isStaffCost(r.name))return true;add(r.id,r.name,r.monthly,{name:departmentName(r.name),projectId:null,anchor:r.anchor||'Fixed Month',offset:!r.anchor||r.anchor==='Fixed Month'?r.start-1:r.offset||0,duration:r.duration,allocation:r.method,allocations:{...r.allocations}});return false});
 return companyWorkforce({...model,projects,corporate,resources,workforce});
}
/** Salaries belong to the company. Keep all employee records and working periods. */
function companyWorkforce(model:FinancialModel):FinancialModel {
 const wf=model.workforce!;
 if(wf.departments.every(d=>!d.projectId&&d.allocation==='Corporate'&&Object.keys(d.allocations).length===0))return model;
 const departments:Department[]=[],mapping=new Map<string,string>();
 for(const d of wf.departments){const next={...d,projectId:null,allocation:'Corporate' as const,allocations:{}};const same=departments.find(x=>x.name===next.name&&x.anchor===next.anchor&&x.offset===next.offset&&x.duration===next.duration);mapping.set(d.id,same?.id||d.id);if(!same)departments.push(next);}
 return {...model,workforce:{...wf,departments,employees:wf.employees.map(e=>({...e,departmentId:mapping.get(e.departmentId)||e.departmentId}))}};
}
/** Project operations never duplicate or delete company employees. */
export function copyProjectStaff(model:FinancialModel,_sourceId:string,_targetId:string,_newId:()=>string):FinancialModel {return migrateWorkforce(model);}
export function removeProjectStaff(model:FinancialModel,_projectId:string):FinancialModel {return migrateWorkforce(model);}
