import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
const origin='http://127.0.0.1:8788';
const browser=await chromium.launch(existsSync('/opt/google/chrome/chrome')?{executablePath:'/opt/google/chrome/chrome'}:{});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/commerce/availability',r=>r.fulfill({json:{enabled:true,test:true}}));
 await page.route('**/api/commerce/checkout',r=>r.fulfill({status:503,json:{error:'checkout_unavailable'}}));
 for(const [lang,path,text] of [['fr','/formations/saga-ia/volume-1/','49,99'],['en','/en/formations/saga-ia/volume-1/','Available soon'],['es','/es/formations/saga-ia/volume-1/','Pronto disponible']]) {
  for(const width of [390,1280]) {
   await page.setViewportSize({width,height:900});await page.goto(origin+path);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.ok((await page.locator('main').textContent()).includes(text));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://qognito.io${path}`);
   assert.equal(await page.locator('a[href="https://github.com/nucorg/app_saga_arbitre"]').count(),1);
   if(lang!=='fr')assert.equal(await page.locator('#purchase-form').count(),0);
   await page.screenshot({path:`/tmp/qognito-volume-${lang}-${width}.png`,fullPage:true});
  }
 }
 await page.goto(origin+'/formations/saga-ia/volume-1/');await page.locator('#purchase-form').waitFor({state:'visible'});
 await page.locator('[name=name]').fill('Lecteur test');await page.locator('[name=postal_code]').fill('75001');
 for(const name of ['accept_terms','immediate_delivery','acknowledge_withdrawal'])await page.locator(`[name=${name}]`).check();
 await page.locator('button[type=submit]').click();await page.locator('#purchase-error').filter({hasText:'indisponible'}).waitFor();
 assert.equal(await page.locator('button[type=submit]').isEnabled(),true);assert.deepEqual(errors,[]);
 // An unavailable API must not remove the form or allow checkout.
 let checkoutRequests=0;
 await page.route('**/api/commerce/checkout',r=>{checkoutRequests++;return r.fulfill({status:503,json:{error:'checkout_unavailable'}});});
 for(const mode of ['closed','network','html','http-error','pending']) {
  await page.unroute('**/api/commerce/availability');
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/commerce/availability',async r=>{
   if(mode==='pending'){await pending;return r.fulfill({json:{enabled:true}});}
   if(mode==='network')return r.abort();
   if(mode==='html')return r.fulfill({status:404,contentType:'text/html',body:'<h1>Not found</h1>'});
   if(mode==='http-error')return r.fulfill({status:503,json:{enabled:true}});
   return r.fulfill({json:{enabled:false}});
  });
  await page.goto(origin+'/formations/saga-ia/volume-1/');
  if(['network','html','http-error'].includes(mode))await page.locator('#sale-state').filter({hasText:'indisponible'}).waitFor();
  if(mode==='closed')await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('#purchase-form').isVisible(),true);
  assert.equal(await page.locator('#purchase-form button').isDisabled(),true);
  // Even a synthetic submit must not bypass the availability guard.
  await page.locator('#purchase-form').dispatchEvent('submit');
  assert.equal(checkoutRequests,0);
  if(mode==='pending') {
   release();
   await page.locator('#sale-state').filter({hasText:'Paiement sécurisé'}).waitFor();
   assert.equal(await page.locator('#purchase-form button').isEnabled(),true);
  }
 }
 assert.deepEqual(errors,[]);
 console.log('OK navigateur : FR/EN/ES, 390/1280, prix, attente sans achat, formulaire visible ; paiement bloqué pendant attente, fermeture, erreurs réseau/HTTP/HTML ; reprise et erreur de commande récupérable.');
}finally{await browser.close();}
