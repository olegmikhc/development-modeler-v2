import {it,expect} from 'vitest';
import {demoModel} from '@/lib/demo';
import {createWorkbook} from './excel';
import {modelEnvelope} from '@/lib/validation/model';
import {writeFileSync,mkdirSync} from 'node:fs';
it('exports fourteen populated worksheets with live roll-forward formulas',async()=>{const m=demoModel();const w=await createWorkbook(m);expect(w.worksheets.length).toBe(14);const cash=w.getWorksheet('Cash Flow')!;expect(cash.getCell(`B${cash.rowCount}`).formula).toContain('B');expect(w.getWorksheet('Dashboard')!.getCell('B8').formula).toContain('MAX(0,-MIN');expect(modelEnvelope.safeParse(m).success).toBe(true);mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/demo-model.json',JSON.stringify(m));await w.xlsx.writeFile('artifacts/demo-financial-model.xlsx');});
it('rejects dangerous or incomplete PDF payloads',()=>{const m=demoModel();expect(modelEnvelope.safeParse({...m,projects:[{id:m.projects[0].id,name:'incomplete'}]}).success).toBe(false);m.projects[0].timeline.constructionDuration=1e9;expect(modelEnvelope.safeParse(m).success).toBe(false)});

it('exports all centralized salaries once, including CEO',async()=>{const w=await createWorkbook(demoModel());const payroll=w.getWorksheet('Payroll')!;let total=0,ceo=false;payroll.eachRow((row,i)=>{if(i>1){total+=Number(row.getCell(5).value)||0;ceo ||= String(row.getCell(3).value).includes('CEO')}});expect(total).toBeCloseTo(372000,2);expect(ceo).toBe(true)});

it('accepts negative activity offsets in saved and PDF models',()=>{const m=demoModel();m.projects[0].timeline.salesOffset=-2;m.projects[0].timeline.constructionOffset=-2;expect(modelEnvelope.safeParse(m).success).toBe(true)});
