import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.goto('http://127.0.0.1:3100/report',{waitUntil:'networkidle'});
 await page.locator('#report-ready').waitFor({state:'attached'});
 await page.emulateMedia({media:'print'});
 const layout=await page.locator('.report-page').evaluateAll(pages=>pages.map((s,i)=>{const f=s.querySelector('footer').getBoundingClientRect();return {page:i+1,width:s.getBoundingClientRect().width,height:s.getBoundingClientRect().height,overflow:Array.from(s.children).filter(c=>c.tagName!=='FOOTER').filter(c=>c.getBoundingClientRect().bottom>f.top-8).map(c=>c.tagName+': '+c.textContent.slice(0,70))}}));
 console.log(JSON.stringify(layout));
 assert.ok(layout.length>10);assert.ok(layout.every(p=>p.width>p.height));assert.deepEqual(layout.filter(p=>p.overflow.length),[]);
 await page.pdf({path:'artifacts/report-landscape.pdf',format:'A4',landscape:true,printBackground:true,preferCSSPageSize:true});
 await page.locator('.report-page').nth(10).screenshot({path:'artifacts/report-landscape-page.png'});
} finally {await browser.close()}
