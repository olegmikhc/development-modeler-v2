import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync('artifacts/demo-model.json','utf8'));source.name='Invited original';
const copy={...structuredClone(source),id:'90000000-0000-4000-8000-000000000001',name:'Invited original · Copy',created:new Date().toISOString()};
const user={id:'90000000-0000-4000-8000-000000000002',email:'friend@test.invalid',email_confirmed_at:new Date().toISOString(),aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
const token=['e30',Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test'].join('.');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();let copies=0;const writes=[];
 await page.route('https://*.supabase.co/**',async route=>{const req=route.request(),url=req.url();
 if(url.includes('/auth/v1/token'))return route.fulfill({json:{access_token:token,refresh_token:'test',expires_in:3600,token_type:'bearer',user}});
 if(url.includes('/auth/v1/user'))return route.fulfill({json:user});
 if(url.includes('list_invited_models'))return route.fulfill({json:[source]});
 if(url.includes('copy_invited_model')){assert.equal(req.postDataJSON().mid,source.id);copies++;return route.fulfill({json:copy});}
 if(req.method()!=='GET'){writes.push(url);return route.fulfill({status:403,json:{message:'Unexpected mutation'}});}
 if(url.includes('financial_models'))return route.fulfill({json:null});
 return route.fulfill({json:[]});});
 await page.goto('http://127.0.0.1:3100/invited/');await page.getByRole('link',{name:'Sign in',exact:true}).click();
 await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Password',{exact:true}).fill('Synthetic-test-only-123');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByText('Signed in as',{exact:false}).waitFor().catch(async e=>{console.log(await page.locator('body').innerText());throw e});await page.getByRole('link',{name:'Models shared with me',exact:true}).click();
 await page.getByRole('heading',{name:source.name,exact:true}).waitFor();await page.getByRole('button',{name:'View model',exact:true}).click();
 assert.equal(await page.locator('.model-viewer input').count(),0);
 await page.getByRole('button',{name:'Create my editable copy',exact:true}).click();
 await page.waitForURL('http://127.0.0.1:3100/');await page.getByRole('button',{name:'Share',exact:true}).waitFor();
 assert.ok((await page.locator('.model-bar').innerText()).includes(copy.name));assert.equal(copies,1);assert.deepEqual(writes,[]);
 console.log('Invited sign-in, read-only original, independent editable cloud copy UI passed.');
}finally{await browser.close()}
