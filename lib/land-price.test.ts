import {it,expect} from 'vitest';
import {demoModel} from './demo';
import {landAreaAre,landPrice} from './land-price';
import {calculateLandPayments,calculatePortfolioCashFlow} from './financial-engine';
import {modelEnvelope} from './validation/model';
it('calculates USD leasehold and applies it once to installments and portfolio',()=>{const m=demoModel(),p=m.projects[0],before=calculatePortfolioCashFlow(m).cost,original=p.land.cost;p.land.pricingMode='Leasehold';p.land.area=25;p.land.unit='are';p.land.leasehold={years:30,pricePerAreYearIdr:10000000,idrPerUsd:15000};expect(landPrice(p)).toBe(500000);expect(calculateLandPayments(p).reduce((s,x)=>s+x.amount,0)).toBeCloseTo(500000,2);expect(calculatePortfolioCashFlow(m).cost-before).toBeCloseTo(500000-original,2);expect(modelEnvelope.safeParse(JSON.parse(JSON.stringify(m))).success).toBe(true);p.land.leasehold.idrPerUsd=30000;expect(landPrice(p)).toBe(250000);p.land.pricingMode='Manual';expect(landPrice(p)).toBe(original)});
it('converts area units and guards missing or zero exchange rates',()=>{const p=demoModel().projects[0];p.land.area=2500;p.land.unit='m²';expect(landAreaAre(p.land)).toBe(25);p.land.area=.25;p.land.unit='hectare';expect(landAreaAre(p.land)).toBe(25);p.land.pricingMode='Leasehold';p.land.leasehold={years:30,pricePerAreYearIdr:10000000,idrPerUsd:0};expect(landPrice(p)).toBe(p.land.cost)});
