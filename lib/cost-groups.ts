const definitions=[
 {id:'land',name:'Земля',color:'#a18557',aliases:['Land Payments','Land','Платежи за землю','Земля']},
 {id:'construction',name:'Строительство и инфраструктура',color:'#007aff',aliases:['Construction','Строительство','Show villa','Шоу-вилла']},
 {id:'sales',name:'Маркетинг и продажи',color:'#7488c4',aliases:['Marketing','Sales Manager','Менеджер по продажам','Sales Commission','Sales Office Fit-out','Project Packaging','Automation / CRM','Sales holding costs','Маркетинг','Комиссия продаж','Офис продаж','Упаковка проекта','Автоматизация / CRM','Содержание до продажи']},
 {id:'permits',name:'Разрешения и проектирование',color:'#56a6ad',aliases:['Architecture','PBG / Permits','PBG','SLF','Проектирование','PBG / Разрешения','Разрешения','Разрешительная документация']},
 {id:'management',name:'Команда и управление',color:'#af83b7',aliases:['Payroll','Office Rent','Фонд оплаты труда','Аренда офиса','Зарплаты']},
 {id:'taxes',name:'Налоги',color:'#e09a45',aliases:['Taxes','Налоги']},
 {id:'reserve',name:'Резерв',color:'#8393ab',aliases:['Contingency','Резерв','Непредвиденные расходы']},
 {id:'other',name:'Прочие расходы',color:'#9a9a9f',aliases:[]},
];
export function groupCosts(costs:Record<string,number>){
 const groups=definitions.map(d=>({...d,value:0,items:[] as {name:string;value:number}[]}));
 for(const [name,value] of Object.entries(costs)){
  if(value===0)continue;
  const normalized=name.trim().toLocaleLowerCase();
  const group=(/^(infrastructure|инфраструктура)(\s|·|:|$)/i.test(normalized)?groups.find(g=>g.id==='construction'):groups.find(g=>g.aliases.some(alias=>alias.toLocaleLowerCase()===normalized)))||groups[groups.length-1];
  group.items.push({name,value});group.value+=value;
 }
 return groups.filter(g=>g.items.length).map(g=>({...g,value:Math.round(g.value*100)/100,items:g.items.sort((a,b)=>b.value-a.value)}));
}
