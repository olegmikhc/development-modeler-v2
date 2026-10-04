import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const model=JSON.parse(readFileSync('artifacts/demo-model.json','utf8'));
model.name='Avision Development Portfolio';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.route('**/rest/v1/rpc/read_shared_model',route=>route.fulfill({json:model}));
 await page.goto('http://127.0.0.1:3100/shared/?token=mobile-test');
 await page.locator('.model-viewer').waitFor();
 for(const width of [320,390,430,768]){
  await page.setViewportSize({width,height:844});
  for(const language of ['English','Русский']){
   await page.getByRole('button',{name:language,exact:true}).click();
   for(const view of ['Overview','Projects','Timeline','Sales','Costs','Employees','Cash Flow','P&L','Scenarios']){
    if(width<=700)await page.locator('#viewer-section').selectOption(view);
    else await page.locator('.sidebar nav button').nth(['Overview','Projects','Timeline','Sales','Costs','Employees','Cash Flow','P&L','Scenarios'].indexOf(view)).click();
    await page.waitForTimeout(80);
    const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(size.scroll<=size.width+1,`${width} ${language} ${view}: ${JSON.stringify(size)}`);
    assert.equal(await page.locator('input,textarea,[role="slider"]').count(),0);
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#viewer-section').selectOption('Overview');
 await page.screenshot({path:'/tmp/mobile-viewer.png',fullPage:true});
 console.log('Mobile viewer: all 9 sections, RU/EN, 320/390/430/768px, no page overflow or editing controls.');
}finally{await browser.close()}
