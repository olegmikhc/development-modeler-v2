import {Project} from '@/types/model';
export function landAreaAre(land:Project['land']){return land.area*(land.unit==='m²'?.01:land.unit==='hectare'?100:1)}
export function leaseholdQuote(land:Project['land']){const l=land.leasehold;if(!l||l.years<=0||l.idrPerUsd<=0)return null;const idr=landAreaAre(land)*l.years*l.pricePerAreYearIdr;return {idr,usd:Math.round((idr/l.idrPerUsd+Number.EPSILON)*100)/100}}
export function landPrice(p:Project){return p.land.pricingMode==='Leasehold'&&p.currency==='USD'?(leaseholdQuote(p.land)?.usd??p.land.cost):p.land.cost}
