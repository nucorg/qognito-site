// Explicit interactive-equivalent sandbox check. Never runs against production.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { existsSync, writeFileSync } from 'node:fs';
const origin='http://localhost:8788';
const scenario=process.argv[2] || 'success';
assert.ok(['success','declined','foreign','3ds'].includes(scenario));
const availability=await (await fetch(origin+'/api/commerce/availability')).json();
assert.equal(availability.test,true);assert.equal(availability.enabled,true);
const browser=await chromium.launch(existsSync('/opt/google/chrome/chrome')?{executablePath:'/opt/google/chrome/chrome'}:{});
async function check(){const page=await browser.newPage();try {
 await page.goto(origin+'/formations/saga-ia/volume-1/');
 await page.locator('#purchase-form').waitFor({state:'visible'});
 await page.locator('[name=name]').fill('Lecteur Recette');await page.locator('[name=postal_code]').fill('75001');
 for(const name of ['accept_terms','immediate_delivery','acknowledge_withdrawal'])await page.locator(`[name=${name}]`).check();
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/commerce/checkout'));
 await page.locator('button[type=submit]').click();const response=await responsePromise;
 if(response.status()!==200)throw new Error(await response.text());
 await page.waitForURL('https://checkout.stripe.com/**');await page.waitForLoadState('domcontentloaded');
 await page.screenshot({path:'/tmp/qognito-stripe-checkout.png',fullPage:true});
 writeFileSync('/tmp/qognito-stripe-fields.json',JSON.stringify(await page.locator('input,select,button').evaluateAll(els=>els.map(e=>({tag:e.tagName,type:e.getAttribute('type'),id:e.id,name:e.getAttribute('name'),placeholder:e.getAttribute('placeholder'),text:e.tagName==='BUTTON'?e.textContent:''}))),null,2));
 console.log('Checkout Stripe réel en sandbox ouvert. Champs décrits dans /tmp/qognito-stripe-fields.json.');
 // Card values are Stripe's documented fictitious test data.
 await page.locator('#email').fill('recette-qognito@example.com');
 await page.locator('#cardNumber').fill(scenario==='declined'?'4000000000000002':scenario==='3ds'?'4000002500003155':'4242424242424242');
 await page.locator('#cardExpiry').fill('1230');
 await page.locator('#cardCvc').fill('123');
 await page.locator('#billingName').fill('Lecteur Recette');
 await page.locator('#billingCountry').selectOption(scenario==='foreign'?'BE':'FR');
 const address=page.locator('#billingAddressLine1');
 if(await address.count())await address.fill('1 rue de la Recette');
 await page.locator('#billingPostalCode').fill(scenario==='foreign'?'1000':'75001');
 await page.locator('#billingLocality').fill(scenario==='foreign'?'Bruxelles':'Paris');
 await page.locator('button[type=submit]').click();
 if(scenario==='declined'){
  await page.getByText(/carte.*(?:refus|déclin)|card.*declin/i).first().waitFor({timeout:30000});
  const status=await page.request.get(origin+'/api/commerce/order');const data=await status.json();
  assert.equal(data.status,'created');assert.equal(data.download_url,null);
  console.log(JSON.stringify({test:true,scenario,reference:data.reference,status:data.status,no_delivery:true}));return;
 }
 if(scenario==='3ds'){
  let authorize;
  for(let i=0;i<30;i++){for(const frame of page.frames()){const b=frame.locator('#test-source-authorize-3ds');if(await b.count())authorize=b;}if(authorize)break;await page.waitForTimeout(500);}
  if(!authorize)throw Error('3DS authorization control missing');
  await page.frame({name:'stripe-challenge-frame'}).waitForLoadState('load');
  await page.waitForTimeout(750);await authorize.click();
 }
 await page.waitForURL(origin+'/achat/confirmation/',{timeout:60000});
 if(scenario==='foreign'){
  await page.waitForFunction(async()=>{const s=await(await fetch('/api/commerce/order')).json();return s.status==='market_rejected';},{},{timeout:60000});
  const data=await page.evaluate(async()=>await(await fetch('/api/commerce/order')).json());assert.equal(data.download_url,null);
  console.log(JSON.stringify({test:true,scenario,reference:data.reference,status:data.status,no_delivery:true}));return;
 }
 await page.locator('#download').waitFor({state:'visible',timeout:60000});
 const status=await page.evaluate(async()=>await (await fetch('/api/commerce/order')).json());
 assert.equal(status.status,'paid');assert.equal(status.amount,4999);
 const pdf=await page.request.get(status.download_url);assert.equal(pdf.status(),200);assert.equal(pdf.headers()['content-type'],'application/pdf');
 writeFileSync('/tmp/qognito-sale-'+scenario+'.json',JSON.stringify(status),{mode:0o600});
 console.log(JSON.stringify({test:true,scenario,reference:status.reference,status:status.status,amount:status.amount,pdf_http:pdf.status()}));
 await page.screenshot({path:'/tmp/qognito-stripe-confirmation.png',fullPage:true});
}catch(error){await page.screenshot({path:'/tmp/qognito-stripe-failure-'+scenario+'.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(-2500));console.log(await Promise.all(page.frames().map(async f=>({name:f.name(),buttons:await f.locator('button').allTextContents().catch(()=>[]),ids:await f.locator('button').evaluateAll(es=>es.map(e=>e.id)).catch(()=>[])}))));throw error;}finally{await browser.close();}}
await check();
