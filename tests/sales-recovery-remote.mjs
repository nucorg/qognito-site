// Explicit operator-run sandbox acceptance test; requires disposable fixture deployment.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import { chromium } from '@playwright/test';
import { OFFER } from '../server/commerce/offer.mjs';
const dir='.wrangler/sales-recovery/';
const state=JSON.parse(await readFile(dir+'state.json'));
const secrets=JSON.parse(await readFile(dir+'secrets.json'));
assert.equal(state.origin,'https://qognito-recovery-20261014.boris-guarisma.workers.dev');
assert.ok(secrets.STRIPE_SECRET_KEY.startsWith('sk_test_'));
const stripe=new Stripe(secrets.STRIPE_SECRET_KEY,{maxNetworkRetries:1,timeout:20000});
const save=()=>writeFile(dir+'state.json',JSON.stringify(state,null,2),{mode:0o600});
async function call(path,body) {
 const r=await fetch(state.origin+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${secrets.RECOVERY_ADMIN}`,Origin:state.origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 assert.equal(r.status,200,`${path}: HTTP ${r.status}`);return r.json();
}
const sql=async(sql,params=[]) => (await call('/sql',{sql,params})).results;
const row=async()=> (await sql('SELECT * FROM sales_orders WHERE id=?',[state.order]))[0];
const due=()=>sql('UPDATE sales_orders SET next_attempt_at=0 WHERE id=?',[state.order]);
async function jobs(){await due();await call('/jobs',{});}
async function link(){return (await call('/link?id='+state.order)).url;}
async function pdf(url,status=200){const r=await fetch(url);assert.equal(r.status,status);if(status===200)assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),OFFER.sha256);}
const action=process.argv[2];
try {
 if(action==='purchase') {
  assert.ok(!state.order,'A test order already exists; resume instead of buying again');
  const request={request_id:crypto.randomUUID(),edition:OFFER.edition,buyer_kind:'individual',name:'Boris — recette reprise incidents',company:'',terms_version:OFFER.termsVersion,accept_terms:true,immediate_delivery:true,acknowledge_withdrawal:true,country:'FR',postal_code:'75001'};
  state.request=request;await save();
  const session=await call('/checkout',request);
  const orders=await sql('SELECT id,session_id FROM sales_orders WHERE request_id=?',[request.request_id]);
  state.order=orders[0].id;state.session=orders[0].session_id;await save();
  const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome'});
  try {
   const page=await browser.newPage();
   // No confirmation page is visited. All recovery must happen on the server.
   await page.route(state.origin+'/**',route=>route.fulfill({status:200,body:'Retour volontairement neutralisé pour la recette.'}));
   await page.goto(session.url);
   await page.locator('#email').fill('bguarisma@qognito.io');
   await page.locator('#cardNumber').fill('4242424242424242');
   await page.locator('#cardExpiry').fill('1230');await page.locator('#cardCvc').fill('123');
   await page.locator('#billingName').fill('Boris Guarisma — recette');
   await page.locator('#billingCountry').selectOption('FR');
   await page.locator('#billingAddressLine1').fill('1 rue de la Recette');
   await page.locator('#billingPostalCode').fill('75001');await page.locator('#billingLocality').fill('Paris');
   await page.locator('button[type=submit]').click();
   await page.waitForURL(state.origin+'/**',{timeout:60000});
  } finally {await browser.close();}
  const paid=await stripe.checkout.sessions.retrieve(state.session,{expand:['payment_intent']});
  assert.equal(paid.livemode,false);assert.equal(paid.status,'complete');assert.equal(paid.payment_intent.status,'requires_capture');
  assert.equal((await row()).status,'created');
  state.payment_intent=paid.payment_intent.id;state.webhook_outage_verified=true;await save();
  console.log({test:action,order:state.order,stripe:'requires_capture',database:'created',browser_return:false});
 } else if(action==='email-failure') {
  assert.equal(state.webhook_outage_verified,true);
  const denied=await fetch(state.origin+'/api/commerce/webhook',{method:'POST',body:'test'});assert.equal(denied.status,503);
  // Same runJobs code as the scheduled worker; clocks advanced through next_attempt_at only.
  await jobs();await jobs();
  let o=await row();assert.equal(o.status,'paid');assert.equal(o.email_status,'pending');assert.ok(o.job_attempts>=1);assert.ok(o.invoice_id);
  for(let n=o.job_attempts;n<5;n++)await jobs();
  o=await row();assert.equal(o.job_attempts,5);assert.equal(o.last_error,'retry_required');assert.ok(o.next_attempt_at>Math.floor(Date.now()/1000));
  state.original_link=await link();await pdf(state.original_link);
  const invoice=await stripe.invoices.retrieve(o.invoice_id);assert.equal(invoice.status,'paid');assert.equal(invoice.total,4999);assert.equal(invoice.attempt_count,0);
  state.invoice=o.invoice_id;state.failed_attempts=5;await save();
  console.log({test:action,order:state.order,status:o.status,attempts:o.job_attempts,email:o.email_status,backoff:true,pdf:true,invoice:o.invoice_id});
 } else if(action==='alert-failure') {
  await call('/alerts',{outage:true});
  let alerts=await sql('SELECT * FROM sales_alerts WHERE order_id=?',[state.order]);assert.equal(alerts.length,1);assert.equal(alerts[0].failure_email_id,null);
  await call('/alerts',{});alerts=await sql('SELECT * FROM sales_alerts WHERE order_id=?',[state.order]);assert.ok(alerts[0].failure_email_id);
  state.alert_email=alerts[0].failure_email_id;await save();
  await call('/alerts',{});assert.equal((await sql('SELECT * FROM sales_alerts WHERE order_id=?',[state.order]))[0].failure_email_id,state.alert_email);
  console.log({test:action,pending_outbox_recovered:true,email_id:state.alert_email,no_duplicate:true});
 } else if(action==='alert-recovery') {
  await call('/alerts',{});const alerts=await sql('SELECT * FROM sales_alerts WHERE order_id=?',[state.order]);assert.ok(alerts[0].resolved_at);assert.ok(alerts[0].recovery_email_id);
  state.recovery_alert_email=alerts[0].recovery_email_id;await save();console.log({test:action,email_id:state.recovery_alert_email,resolved:true});
 } else if(action==='email-recover') {
  await sql("UPDATE recovery_faults SET enabled=0 WHERE name='email'");await jobs();
  const o=await row();assert.equal(o.email_status,'accepted');assert.equal(o.job_attempts,0);assert.equal(o.last_error,null);assert.ok(o.email_id);
  state.email=o.email_id;await save();
  await jobs();assert.equal((await row()).email_id,state.email);
  console.log({test:action,order:state.order,email_id:state.email,retry_cleared:true,no_second_email:true});
 } else if(action==='webhook-recover') {
  await sql("UPDATE recovery_faults SET enabled=0 WHERE name='webhook'");
  const events=await stripe.events.list({type:'checkout.session.completed',limit:100});
  const event=events.data.find(e=>e.data.object.id===state.session);assert.ok(event);
  const body=JSON.stringify(event);
  for(let i=0;i<2;i++){
   const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:secrets.STRIPE_WEBHOOK_SECRET});
   const r=await fetch(state.origin+'/api/commerce/webhook',{method:'POST',headers:{'stripe-signature':signature},body});assert.equal(r.status,200);
  }
  assert.equal((await sql('SELECT count(*) AS n FROM sales_events WHERE event_id=?',[event.id]))[0].n,1);
  const o=await row();assert.equal(o.status,'paid');assert.equal(o.email_id,state.email);
  const invoices=await stripe.invoices.list({customer:o.stripe_customer_id});assert.equal(invoices.data.filter(i=>i.metadata.qognito_order_id===state.order).length,1);
  state.replayed_event=event.id;await save();console.log({test:action,event:event.id,deduplicated:true,invoices:1});
 } else if(action==='renew') {
  await sql('UPDATE sales_orders SET download_until=? WHERE id=?',[Math.floor(Date.now()/1000)-10,state.order]);
  await pdf(state.original_link,403);
  state.expired_link=await link();await pdf(state.expired_link,403);
  const before=await row();await sql('UPDATE sales_orders SET renew_requested=1,next_attempt_at=0 WHERE id=?',[state.order]);await call('/jobs',{});
  const after=await row();assert.equal(after.download_version,before.download_version+1);assert.equal(after.renew_requested,0);assert.equal(after.email_status,'accepted');assert.notEqual(after.email_id,state.email);
  state.renewed_link=await link();await pdf(state.original_link,403);await pdf(state.renewed_link);state.renewal_email=after.email_id;await save();
  console.log({test:action,old_link:403,new_link:200,version:after.download_version,email_id:after.email_id});
 } else if(action==='partial-refund') {
  const refund=await stripe.refunds.create({payment_intent:state.payment_intent,amount:1000,metadata:{qognito_recovery:'20261014'}},{idempotencyKey:`recovery-partial:${state.order}`});
  assert.equal(refund.status,'succeeded');assert.equal(refund.amount,1000);state.refund=refund.id;await save();
  const credit=await stripe.creditNotes.create({invoice:state.invoice,amount:1000,refunds:[{refund:refund.id,amount_refunded:1000}],reason:'order_change',email_type:'none',memo:'Recette technique remboursement partiel fictif'},{idempotencyKey:`recovery-credit:${state.order}`});
  assert.equal(credit.amount,1000);state.credit_note=credit.id;await save();
  await jobs();let o=await row();
  // The live webhook can own the reconciliation lease when the job starts.
  for(let n=0;n<20 && o.amount_refunded!==1000;n++){await new Promise(r=>setTimeout(r,500));o=await row();}
  assert.equal(o.amount_refunded,1000);assert.equal(o.status,'paid');await pdf(state.renewed_link);
  const refunds=await stripe.refunds.list({payment_intent:state.payment_intent});assert.equal(refunds.data.length,1);
  console.log({test:action,refund:refund.id,credit_note:credit.id,amount_refunded:1000,pdf_http:200,refund_count:1});
 } else throw Error('Unknown action');
} catch(error) {console.error({test:action,error:error.message,type:error.type||error.name});process.exitCode=1;}
