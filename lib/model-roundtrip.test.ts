import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {modelEnvelope} from './validation/model';
import {copyModel} from './copy-model';
import {defaultMarket} from './sensitivity';
it('preserves V2 data when importing or opening a shared model',()=>{
 const model=demoModel();model.projects[0].market={...defaultMarket(),priceFactor:1.2,demand:[50,100]};model.analysis={targetMargin:30,discount:15,targetBasis:'developer'};model.scenarios[0].adjustments.projectId=model.projects[0].id;
 model.investments=[{id:crypto.randomUUID(),name:'Test',projectId:model.projects[0].id,enabled:true,type:'annual',rate:12,compounding:'monthly',incomePayment:'maturity',maturityMonth:36,autoSettle:true,tranches:[{id:crypto.randomUUID(),month:1,amount:1000}],repayments:[]}];
 const parsed=modelEnvelope.parse(JSON.parse(JSON.stringify(model)));expect(parsed.projects[0].market).toEqual(model.projects[0].market);expect(parsed.investments).toEqual(model.investments);expect(parsed.analysis).toEqual(model.analysis);expect(parsed.scenarios[0].adjustments.projectId).toBe(model.projects[0].id);
 const copy=copyModel(parsed);expect(copy.id).not.toBe(model.id);copy.projects[0].name='Changed';expect(model.projects[0].name).not.toBe('Changed');
});
