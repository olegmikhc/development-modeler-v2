import {it,expect} from 'vitest';
import {groupCosts} from './cost-groups';
it('groups project and portfolio costs without losing or duplicating amounts',()=>{
 const costs={'Construction':100,'Infrastructure · Playground':20,'Marketing':10,'Sales Commission':15,'Sales Office Fit-out':5,'Architecture':3,'PBG / Permits':2,'SLF':1,'Payroll':8,'Office Rent':2,'Taxes':4,'Contingency':6,'My custom cost':7,'Land Payments':50};
 const groups=groupCosts(costs),amount=(id:string)=>groups.find(g=>g.id===id)!.value;
 expect(amount('construction')).toBe(120);expect(amount('sales')).toBe(30);expect(amount('permits')).toBe(6);expect(amount('management')).toBe(10);expect(amount('other')).toBe(7);
 expect(groups.reduce((s,g)=>s+g.value,0)).toBe(Object.values(costs).reduce((s,v)=>s+v,0));
 expect(groups.flatMap(g=>g.items).map(i=>i.name).sort()).toEqual(Object.keys(costs).sort());
});
it('supports Russian names and stable colors independent of amounts',()=>{
 const a=groupCosts({'Инфраструктура · Детская площадка':30,'Комиссия продаж':10,'Проектирование':5,'SLF':2});
 expect(a.find(g=>g.id==='permits')?.value).toBe(7);expect(a.find(g=>g.id==='construction')?.value).toBe(30);
 expect(a.find(g=>g.id==='sales')?.color).toBe(groupCosts({'Marketing':1000})[0].color);
 expect(groupCosts({Zero:0})).toEqual([]);
});
