import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1100}});await page.goto('http://127.0.0.1:3100');await page.getByRole('button',{name:'Timeline',exact:true}).click();
for(const name of ['Sales','Construction']){const bar=page.locator('.gantt-project').first().locator('.gantt-bar').filter({has:page.locator(`button[aria-label="Resize ${name} end"]`)});const track=await bar.locator('..').boundingBox();const box=await bar.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+12);await page.mouse.down();await page.mouse.move(box.x+box.width/2-2*track.width/36,box.y+12,{steps:10});await page.mouse.up();assert.match(await bar.getAttribute('aria-label'),/starts month 3,/);}
await page.reload();await page.getByRole('button',{name:'Timeline',exact:true}).click();for(const name of ['Sales','Construction'])assert.match(await page.locator('.gantt-project').first().locator('.gantt-bar').filter({has:page.locator(`button[aria-label="Resize ${name} end"]`)}).getAttribute('aria-label'),/starts month 3,/);
console.log('Sales and construction drag before PBG and persist after reload');}finally{await browser.close()}
