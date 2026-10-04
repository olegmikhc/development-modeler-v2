import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3100';
const model=JSON.parse(readFileSync('artifacts/demo-model.json','utf8'));model.name='Single shared model';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const writes=[];
 page.on('request',req=>{if(req.url().includes('/rest/v1/')&&!req.url().includes('read_shared_model'))writes.push(req.url())});
 await page.route('**/rest/v1/rpc/read_shared_model',route=>route.fulfill({json:model}));
 await page.goto(base+'/shared/?token=test-only-token');await page.getByRole('heading',{name:'Your portfolio, in perspective.'}).waitFor();
 assert.equal(await page.locator('.report').count(),0);
 for(const section of ['Projects','Timeline','Sales','Costs','Employees','Cash Flow','P&L','Scenarios','Overview']){
  await page.locator('.sidebar').getByRole('button',{name:section,exact:true}).click();
  assert.equal(await page.locator('input,[role="slider"],textarea').count(),0);
  assert.equal(await page.locator('.model-viewer a').count(),0);
 }
 for(const label of ['Add project','Make an editable copy','Financial models','Settings','Share'])assert.equal(await page.getByRole('button',{name:label,exact:true}).count(),0);
 await page.getByLabel('Scenario',{exact:true}).selectOption(model.scenarios[1].id);
 await page.getByRole('button',{name:'Русский',exact:true}).click();
 await page.screenshot({path:'/tmp/model-viewer.png'});
 assert.deepEqual(writes,[]);
 await page.goto(base+'/shared/test-only-token');await page.getByRole('heading',{name:'Ваш портфель в цифрах.'}).waitFor();
 await page.route('**/rest/v1/rpc/read_shared_model',route=>route.fulfill({json:null}));
 await page.goto(base+'/shared/?token=expired');await page.getByText(/Срок действия ссылки истёк|This link has expired/).waitFor();assert.equal(await page.locator('.model-viewer').count(),0);
 await page.goto(base+'/');await page.locator('.model-viewer').waitFor();assert.equal(await page.getByRole('button',{name:'Изменить название девелопера',exact:true}).count(),0);await page.getByRole('link',{name:/^(Войти|Sign in)$/}).waitFor();
 console.log('Interactive shared sections, scenario browsing, no editing/navigation escape, expired links and anonymous editor gate passed.');
}finally{await browser.close()}
