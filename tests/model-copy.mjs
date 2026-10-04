import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:3100/');
 await page.getByRole('button',{name:'Financial models',exact:true}).click();
 const original=await page.locator('.model-open').innerText();
 await page.getByRole('button',{name:'Create copy: Bali Development Portfolio',exact:true}).click();
 await page.getByRole('button',{name:'Edit developer name',exact:true}).click();
 await page.getByRole('textbox',{name:'Developer name',exact:true}).fill('Independent copy');
 await page.getByRole('textbox',{name:'Developer name',exact:true}).press('Enter');
 await page.reload();
 await page.getByRole('button',{name:'Financial models',exact:true}).click();
 assert.equal(await page.locator('.model-open').count(),2);
 assert.equal(await page.locator('.model-open').filter({hasText:'Bali Development Portfolio'}).innerText(),original);
 assert.match(await page.locator('.model-open').filter({hasText:'Independent copy'}).innerText(),/3 projects/);
 console.log('Copy can be renamed and persists after reload; original card remains unchanged.');
} finally {await browser.close()}
