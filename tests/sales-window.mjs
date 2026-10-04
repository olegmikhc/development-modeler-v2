import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto('http://127.0.0.1:3100');
 await page.getByRole('button',{name:'Sales',exact:true}).click();await page.getByRole('button',{name:'Haven Pandawa ↗',exact:true}).click();
 await page.getByLabel('Sales plan mode').selectOption('MANUAL');
 const panel=page.locator('.manual-sales-panel').first();
 const text=await panel.locator('.sales-window-legend').innerText();
 const bounds=[...text.matchAll(/M(\d+)/g)].map(m=>Number(m[1]));
 assert.equal(bounds.length,2);
 const [start,end]=bounds;
 assert.equal(await panel.getByText('Sales start',{exact:true}).count(),1);
 assert.equal(await panel.getByText('Sales end',{exact:true}).count(),1);
 const cells=panel.locator('tbody td');
 for(const month of [start,end])assert.match(await cells.nth(month-1).getAttribute('class'),/sales-month-active/);
 for(const month of [start-1,end+1]){
  const input=cells.nth(month-1).locator('input');
  await input.fill('2');await input.press('Tab');
  assert.equal(await input.getAttribute('aria-invalid'),'true');
  assert.match(await panel.getByRole('alert').innerText(),/Units outside the timeline sales period/);
  await input.fill('0');await input.press('Tab');
 }
 assert.equal(await panel.getByRole('alert').count(),0);
 await cells.nth(start-1).locator('input').fill('4');
 assert.equal(await panel.getByRole('alert').count(),0);
 await page.getByRole('button',{name:'Русский',exact:true}).click();
 assert.match(await panel.locator('.sales-window-legend').innerText(),/Период продаж в таймлайне/);
 await page.screenshot({path:'/tmp/sales-window.png'});
 console.log('Timeline boundaries, outside-period warnings, correction and RU labels passed.');
} finally {await browser.close()}
