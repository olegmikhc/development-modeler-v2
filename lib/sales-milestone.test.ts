import {expect,it} from 'vitest';
import {salesMilestone} from './sales-milestone';
const m=(month:number,units:number,cumulative=100)=>({month,units,label:`M${month}`,cumulative});
it('marks first month with 70% sold and positive cash',()=>{expect(salesMilestone([m(1,2),m(2,4),m(3,2),m(4,2)],10)).toMatchObject({month:3,sold:8,target:7});});
it('waits for positive cash after sales threshold, excluding zero',()=>{expect(salesMilestone([m(1,7,-100),m(2,1,0),m(3,0,20)],10)).toMatchObject({month:3,sold:8,cumulative:20});});
it('rounds up indivisible units',()=>{expect(salesMilestone([m(1,2),m(2,1)],3)).toMatchObject({month:2,target:3});});
it('returns no milestone if either condition is unmet',()=>{expect(salesMilestone([m(1,6)],10)).toBeNull();expect(salesMilestone([m(1,10,-1)],10)).toBeNull();expect(salesMilestone([m(1,1)],0)).toBeNull();});
