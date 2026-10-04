export type Curve = 'Even' | 'Front Loaded' | 'Back Loaded' | 'S-Curve' | 'Custom';
export type Anchor = 'Fixed Month' | 'Project Start' | 'PBG Start' | 'PBG End' | 'Sales Start' | 'Construction Start' | 'Handover';
export type Driver = 'Fixed $' | '$ / unit' | '$ / m²' | '% Revenue' | '% Construction';
export interface PaymentPlan { type: 'Full Cash' | 'Installment' | 'Custom'; down: number; maxTerm: number; finish: 'Construction Completion' | 'Handover' | 'Fixed Date' | 'No Restriction'; fixedMonth: number; custom: {offset:number;percent:number}[] }
export interface Tier { schedule?:{mode:'AUTO'|'MANUAL';curve:Curve;custom:number[]}; id:string; name:string; price:number; units:number; offset:number; window:number; plan:PaymentPlan; manual:number[] }
export interface UnitType { id:string; name:string; area:number; quantity:number; tiers:Tier[] }
export interface Employee {id:string; role:string; salary:number; anchor:Anchor; offset:number; duration:number; category:string}
export interface Cost {id:string; name:string; amount:number; driver:Driver; timing:'Month 1'|'During PBG'|'Before Sales'|'During Sales'|'During Construction'|'At Handover'|'Custom'|'Timeline Stage'; start:number; duration:number;stage?:string}
export interface MarketPlan {priceFactor?:number; lockedThrough:number; demand:number[]; prices:number[]; holdingMonthly:number; targetMargin:number }
export interface Infrastructure {id:string;name:string;area:number;costPerM2:number;offset:number;duration:number;curve:Exclude<Curve,'Custom'>}
export interface Project {infrastructure?:Infrastructure[];market?:MarketPlan;id:string; name:string; location:string; country:string; currency:string; type:string; status:string; color:string; start:number; land:{pricingMode?:'Manual'|'Leasehold';leasehold?:{years:number;pricePerAreYearIdr:number;idrPerUsd:number};area:number;unit:'m²'|'are'|'hectare';cost:number;type:'Full Payment'|'Installments'|'Custom Schedule';down:number;count:number;frequency:number;first:number;control:number;permitAfterInitial:boolean;custom:{month:number;amount:number}[]}; timeline:{pbgAfterLand?:boolean;pbgOffset:number;pbgDuration:number;salesOffset:number;salesDuration:number;constructionOffset:number;constructionDuration:number;handoverOffset:number;salesAfterPbg:boolean;constructionAfterPbg:boolean;stages:{name:string;start:number;duration:number;anchor?:Anchor;offset?:number}[]}; units:UnitType[]; salesMode:'AUTO'|'MANUAL';salesCurve:Curve;salesCustom:number[];construction:{showVilla?:{unitId:string;start:number;duration:number};costPerM2:number;mode:'Simple'|'Advanced';items:{name:string;amount:number}[];curve:Curve;custom:number[]};costs:Cost[];payroll:Employee[]}
export interface CorporateCost {id:string;name:string;amount:number;type:'Monthly'|'One-Time'|'% Revenue'|'Custom';start:number;duration:number;anchor:Anchor;offset:number;custom:number[]}
export interface SharedResource {id:string;name:string;monthly:number;start:number;duration:number;anchor?:Anchor;offset?:number;method:'Equal'|'By Revenue'|'By Units'|'By GLA'|'Manual %'|'Corporate';allocations:Record<string,number>}
export interface Adjustments {projectId?:string;price:number;construction:number;speed:number;pbgDelay:number;land:number;marketing:number;commission:number;contingency:number;constructionDuration:number;paymentTerm:number}
export interface Scenario {id:string;name:string;adjustments:Adjustments}
export interface FinancialModel {investments?:Investment[];analysis?:{targetMargin:number;discount:number;targetBasis?:'operating'|'developer'};workforce?:Workforce;id:string;name:string;created:string;startDate:string;currency:string;horizon:number;projects:Project[];corporate:CorporateCost[];resources:SharedResource[];scenarios:Scenario[];activeScenario:string}
export interface Month {month:number;label:string;inflow:number;outflow:number;net:number;cumulative:number;contracts:number;units:number;categories:Record<string,number>;collections:Record<string,number>}
export interface Result {months:Month[];revenue:number;cost:number;profit:number;margin:number;units:number;gla:number;peak:number;peakMonth:number;duration:number;warnings:string[];costs:Record<string,number>}
export const neutral:Adjustments={price:0,construction:0,speed:0,pbgDelay:0,land:0,marketing:0,commission:0,contingency:0,constructionDuration:0,paymentTerm:0};
export type AllocationMethod = 'Corporate' | 'Equal' | 'By Revenue' | 'By Units' | 'By GLA' | 'Manual %';
export interface Department {id:string;name:string;projectId:string|null;anchor:Anchor;offset:number;duration:number;allocation:AllocationMethod;allocations:Record<string,number>}
export interface StaffMember {id:string;name:string;role:string;salary:number;departmentId:string}
export interface Workforce {version:1;departments:Department[];employees:StaffMember[]}

export interface Investment {
 id:string;
 name:string;
 projectId:string|null;
 enabled:boolean;
 type:'annual'|'fixed'|'profit-share';
 rate:number;
 compounding:'simple'|'monthly';
 incomePayment:'maturity'|'monthly';
 maturityMonth:number;
 autoSettle:boolean;
 tranches:{id:string;month:number;amount:number}[];
 repayments:{id:string;month:number;principal:number;income:number}[];
}
