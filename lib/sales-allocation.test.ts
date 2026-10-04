import {it,expect} from 'vitest';
import {salesAllocation} from './sales-allocation';
import {demoModel} from './demo';
import {validateProject} from './financial-engine';
it('requires exactly the planned quantity, including late months',()=>{expect(salesAllocation(4,[2,2,1])).toMatchObject({valid:false,allocated:5,difference:1});expect(salesAllocation(4,[2,1])).toMatchObject({valid:false,difference:-1});expect(salesAllocation(4,[2,2])).toMatchObject({valid:true,difference:0});expect(salesAllocation(0,[]).valid).toBe(true);expect(salesAllocation(4,[2,2,...Array(40).fill(0),1]).valid).toBe(false)});
it('flags every mismatched tier even when over and under allocations cancel out',()=>{const p=demoModel().projects[0];p.salesMode='MANUAL';p.units.forEach(u=>u.tiers.forEach(t=>t.manual=[t.units]));const [a,b]=p.units[0].tiers;a.manual=[a.units+1];b.manual=[b.units-1];const w=validateProject(p).filter(w=>w.includes('manual sales allocation mismatch'));expect(w.length).toBe(2);expect(w.some(x=>x.includes('over plan 1'))).toBe(true);expect(w.some(x=>x.includes('still to allocate 1'))).toBe(true)});
