// Focused browser checks. A static preview mocks availability; staging uses its real test API.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import catalogue from '../commerce/saga-volume-01.json' with { type: 'json' };

const origin=process.env.QOGNITO_VOLUME_ORIGIN||'http://127.0.0.1:4399';
assert.ok(['http://127.0.0.1:4399','https://qognito-commerce-staging.pages.dev'].includes(origin));
const local=origin.startsWith('http://127.0.0.1');
const directory=`${process.env.QOGNITO_VOLUME_EVIDENCE_DIR||'.wrangler/isbn-2026-10-20'}/${local?'local':'staging'}-browser`;
await mkdir(directory,{recursive:true});
const sample=catalogue.contents.public_previews[0];
const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome'});
const results=[];
try{
 const context=await browser.newContext();
 if(local)await context.route('**/api/commerce/availability',r=>r.fulfill({json:{enabled:false,test:false,terms_version:'2026-10-14-v2'}}));
 const response=await context.request.get(origin+sample.public_url);
 assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/application\/pdf/);
 assert.equal(createHash('sha256').update(await response.body()).digest('hex'),sample.sha256);
 if(!local){const r=await context.request.get(origin+'/api/commerce/availability');const a=await r.json();assert.equal(a.test,true);assert.equal(a.enabled,true);}
 for(const [lang,prefix,label] of [['fr','','ISBN de l’édition française PDF'],['en','/en','ISBN of the French PDF edition'],['es','/es','ISBN de la edición francesa en PDF']]){
  for(const width of [390,1280]){
   const page=await context.newPage();await page.setViewportSize({width,height:900});
   const errors=[];const pdfRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().endsWith(sample.public_url))pdfRequests.push(r.url());});
   const path=prefix+'/formations/saga-ia/volume-1/';
   const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://qognito.io'+path);
   assert.equal((await page.locator('.isbn').innerText()).trim(),label+(lang==='fr'?' : ':': ')+catalogue.contents.private_pdf_candidate.isbn);
   assert.equal(await page.locator('.isbn span').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length;}),1,'ISBN must stay on one visual line');
   const link=page.locator('.sample a');assert.equal(await link.getAttribute('href'),sample.public_url);
   assert.equal(await link.getAttribute('hreflang'),'fr');assert.equal(await link.getAttribute('target'),'_blank');
   assert.match(await link.innerText(),lang==='es'?/7 páginas/:/7 pages/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(lang==='fr')assert.equal(await page.locator('#purchase-form').isVisible(),!local);
   else assert.equal(await page.locator('#purchase-form').count(),0);
   assert.deepEqual(pdfRequests,[]);
   await page.screenshot({path:`${directory}/${lang}-${width}.png`,fullPage:true});
   const popupPromise=page.waitForEvent('popup');
   const requestPromise=context.waitForEvent('request',{predicate:r=>r.url()===origin+sample.public_url});
   await link.click();const popup=await popupPromise;await requestPromise;await popup.close();
   assert.deepEqual(errors,[]);
   results.push({lang,width,label,pdf_new_tab:true,no_pdf_before_click:true,errors});await page.close();
  }
 }
 await writeFile(`${directory}/checks.json`,JSON.stringify({date:new Date().toISOString(),origin,availability_mocked:local,sha256:sample.sha256,results},null,2)+'\n');
 console.log(`OK navigateur : ${origin}, six parcours FR/EN/ES, ISBN qualifié, extrait, liens, mobile/bureau.`);
}finally{await browser.close();}
