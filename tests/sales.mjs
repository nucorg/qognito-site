import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import Stripe from 'stripe';
import { OFFER } from '../server/commerce/offer.mjs';
import { monitorSales } from '../server/commerce/alerts.mjs';
import { INVOICE_FOOTER } from '../server/commerce/invoice.mjs';
import { checkout, webhook, reconcile, runJobs, orderStatus, download, digest, metropolitan, config, ensureInvoice } from '../server/commerce/sales.mjs';
const sql = new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
for (const name of ['0001_commerce.sql','0002_commerce_tax.sql','0003_sales.sql','0004_sales_invoice.sql','0005_sales_alerts.sql']) sql.exec(await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
const db = { prepare(statement) { return { bind(...args) { return {
 first: async () => sql.prepare(statement).get(...args) || null,
 run: async () => ({ meta: { changes: Number(sql.prepare(statement).run(...args).changes) } }),
 all: async () => ({ results: sql.prepare(statement).all(...args) })
 }; } }; } };
const bytes = await readFile(new URL('../' + OFFER.sourcePath, import.meta.url));
assert.equal(await digest(bytes), OFFER.sha256, 'catalogue and private PDF must agree');
const env = { COMMERCE_MODE:'test', COMMERCE_ORIGIN:'http://localhost:8788', COMMERCE_CHECKOUT_ENABLED:'true',
 COMMERCE_TOKEN_SECRET:'fixture-secret-at-least-thirty-two-characters', COMMERCE_DB:db,
 COMMERCE_PDF: { head: async () => ({ customMetadata:{sha256:OFFER.sha256} }), get: async () => ({ customMetadata:{sha256:OFFER.sha256}, arrayBuffer: async () => bytes }) },
 STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',SAGA_PRICE_ID:'price_sale',SAGA_TAX_RATE_ID:'txr_fr',
 STRIPE_PAYMENT_METHOD_CONFIGURATION:'pmc_cards', RESEND_API_KEY:'fake-resend',COMMERCE_FROM:'Qognito <commandes@transaction.qognito.io>' };
const stripe = new Stripe(env.STRIPE_SECRET_KEY); let captureCount=0,cancelCount=0;
assert.equal(config({...env,STRIPE_SECRET_KEY:'rk_test_fixture'}).live,false);
assert.throws(()=>config({...env,STRIPE_SECRET_KEY:'rk_live_fixture'}),/credentials/);
assert.equal(config({...env,COMMERCE_MODE:'live',COMMERCE_ORIGIN:'https://qognito.io',STRIPE_SECRET_KEY:'rk_live_fixture'}).live,true);
assert.throws(()=>config({...env,COMMERCE_MODE:'live',COMMERCE_ORIGIN:'https://qognito.io',STRIPE_SECRET_KEY:'rk_live_fixture'},true),/not_approved/);
const sessions = new Map();
stripe.prices.retrieve = async id => ({ id,active:true,livemode:false,type:'one_time',currency:'eur',unit_amount:4999,tax_behavior:'inclusive',product:{active:true,metadata:{qognito_edition:OFFER.edition}} });
stripe.taxRates.retrieve = async id => ({id,active:true,livemode:false,percentage:5.5,inclusive:true,country:'FR'});
stripe.paymentMethodConfigurations.retrieve=async()=>({active:true,livemode:false,card:{display_preference:{value:'on'}}});
stripe.checkout.sessions.create = async p => {
 assert.equal(p.line_items[0].price,'price_sale');assert.equal(p.line_items[0].tax_rates[0],'txr_fr');
 assert.equal(p.payment_intent_data.capture_method,'manual');assert.equal(p.automatic_tax.enabled,false);
 assert.ok(!Object.hasOwn(p,'payment_method_types'));
 const id=`cs_${p.client_reference_id}`;
 const s={id,object:'checkout.session',livemode:false,status:'open',url:'https://checkout.stripe.com/c/pay/'+id,
 metadata:p.metadata,mode:'payment',currency:'eur',amount_total:4999,total_details:{amount_tax:261,amount_discount:0,amount_shipping:0},
 customer_details:{email:'buyer@example.test',address:{country:'FR',postal_code:'75001',city:'Paris',line1:'1 rue fictive'}},
 line_items:{data:[{quantity:1,price:await stripe.prices.retrieve('price_sale')}],has_more:false},
 payment_intent:{id:`pi_${p.client_reference_id}`,livemode:false,currency:'eur',amount:4999,amount_received:0,capture_method:'manual',metadata:p.payment_intent_data.metadata,status:'requires_payment_method',payment_method_types:['card'],latest_charge:{amount_refunded:0,disputed:false}},
 invoice:{hosted_invoice_url:'https://invoice.stripe.com/i/fixture'}};
 sessions.set(id,s);return structuredClone(s);
};
stripe.checkout.sessions.retrieve=async id=>structuredClone(sessions.get(id));
stripe.paymentIntents.capture=async id=>{captureCount++;for(const s of sessions.values())if(s.payment_intent.id===id){s.payment_intent.status='succeeded';s.payment_intent.amount_received=4999;s.payment_status='paid';}return {status:'succeeded'};};
stripe.paymentIntents.cancel=async id=>{cancelCount++;for(const s of sessions.values())if(s.payment_intent.id===id)s.payment_intent.status='canceled';return {status:'canceled'};};
const input=()=>({request_id:crypto.randomUUID(),edition:OFFER.edition,buyer_kind:'individual',name:'Lecteur test',company:'',terms_version:OFFER.termsVersion,accept_terms:true,immediate_delivery:true,acknowledge_withdrawal:true,country:'FR',postal_code:'75001'});
const post=(body,origin=env.COMMERCE_ORIGIN)=>new Request(env.COMMERCE_ORIGIN+'/api/commerce/checkout',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':crypto.randomUUID()},body:JSON.stringify(body)});
const row=id=>sql.prepare('SELECT * FROM sales_orders WHERE id=?').get(id);
async function create() { const body=input();const response=await checkout(post(body),env,stripe);assert.equal(response.status,200,await response.clone().text());return {body,cookie:response.headers.get('Set-Cookie').split(';')[0],order:sql.prepare('SELECT * FROM sales_orders WHERE request_id=?').get(body.request_id)}; }
async function event(type,object,id=crypto.randomUUID(),environment=false) {
 const payload=JSON.stringify({id,object:'event',type,livemode:environment,data:{object}});
 const signature=await stripe.webhooks.generateTestHeaderStringAsync({payload,secret:env.STRIPE_WEBHOOK_SECRET});
 return webhook(new Request(env.COMMERCE_ORIGIN+'/api/commerce/webhook',{method:'POST',headers:{'Stripe-Signature':signature},body:payload}),env,stripe);
}
assert.equal((await checkout(post(input()),{...env,COMMERCE_CHECKOUT_ENABLED:'false'},stripe)).status,503);
assert.equal((await checkout(post(input()),env,stripe)).status,200);
assert.equal((await checkout(post({...input(),amount:1}),env,stripe)).status,400);
assert.equal((await checkout(post({...input(),edition:'saga-ia-volume-01-en-v1.0'}),env,stripe)).status,400);
for(const flag of ['accept_terms','immediate_delivery','acknowledge_withdrawal'])assert.equal((await checkout(post({...input(),[flag]:false}),env,stripe)).status,400);
assert.equal((await checkout(post(input(),'https://evil.test'),env,stripe)).status,403);
assert.equal((await checkout(post({...input(),postal_code:'97100'}),env,stripe)).status,400);
assert.equal((await checkout(post({...input(),country:'BE'}),env,stripe)).status,400);
assert.ok(metropolitan({country:'FR',postal_code:'20000',city:'Ajaccio',line1:'test'}));
assert.throws(()=>config({...env,COMMERCE_MODE:'live'},true));
assert.equal((await checkout(post(input()),{...env,COMMERCE_PDF:{get:async()=>null}},stripe)).status,503);
const a=await create();
assert.equal((await checkout(post(a.body),env,stripe)).status,200,'retry returns existing session');
assert.equal((await checkout(post({...a.body,name:'Changed'}),env,stripe)).status,409);
let s=sessions.get(a.order.session_id);s.status='complete';s.payment_intent.status='requires_capture';s.payment_status='unpaid';
const eid=crypto.randomUUID();
assert.equal((await event('checkout.session.completed',s,eid)).status,200);
assert.equal(row(a.order.id).status,'authorized');assert.equal(captureCount,1);
const req=()=>new Request(env.COMMERCE_ORIGIN+'/api/commerce/order',{headers:{Cookie:a.cookie}});
assert.equal((await (await orderStatus(req(),env)).json()).download_url,null,'authorization grants nothing');
assert.equal((await event('checkout.session.completed',s,eid)).status,200);assert.equal(captureCount,1);
assert.equal((await event('payment_intent.succeeded',s.payment_intent)).status,200);
assert.equal(row(a.order.id).status,'paid');
let status=await (await orderStatus(req(),env)).json();assert.ok(status.download_url);
assert.equal((await download(new Request(status.download_url),env)).status,200);
assert.equal(row(a.order.id).downloads,1);
assert.equal((await download(new Request(status.download_url+'broken'),env)).status,403);
assert.equal((await orderStatus(new Request(env.COMMERCE_ORIGIN+'/api/commerce/order'),env)).status,401);
const badR2={...env,COMMERCE_PDF:{get:async()=>({customMetadata:{sha256:OFFER.sha256},arrayBuffer:async()=>new Uint8Array([1,2,3])})}};
assert.equal((await download(new Request(status.download_url),badR2)).status,503);
let mailCount=0;
const send=async(url,p)=>{mailCount++;const b=JSON.parse(p.body);assert.equal(b.to[0],'buyer@example.test');assert.match(b.text,/49,99/);assert.match(b.text,/Conditions de vente/);assert.match(b.text,/reconnu la perte/);return Response.json({id:'email_fixture'});};
await runJobs(env,stripe,send);assert.equal(mailCount,1);assert.equal(row(a.order.id).email_status,'accepted');
await runJobs(env,stripe,send);assert.equal(mailCount,1);
// Refund state always comes from current charge, even if the event is old.
s.payment_intent.latest_charge.amount_refunded=1000;
await event('charge.refunded',{payment_intent:s.payment_intent.id});
assert.equal(row(a.order.id).amount_refunded,1000);assert.equal(row(a.order.id).status,'paid');
s.payment_intent.latest_charge.amount_refunded=4999;
await event('charge.refunded',{payment_intent:s.payment_intent.id});
assert.equal(row(a.order.id).status,'refunded');assert.equal((await download(new Request(status.download_url),env)).status,403);
await event('payment_intent.succeeded',s.payment_intent);assert.equal(row(a.order.id).status,'refunded');
// Out of market after Checkout edits: cancel authorization, never capture or deliver.
const b=await create();const foreign=sessions.get(b.order.session_id);foreign.status='complete';foreign.payment_intent.status='requires_capture';foreign.customer_details.address.country='BE';
await event('checkout.session.completed',foreign);assert.equal(row(b.order.id).status,'market_rejected');assert.equal(cancelCount,1);assert.equal(captureCount,1);
// Lost browser / missing event: scheduler reconciles payment and retries email.
const c=await create();const cs=sessions.get(c.order.session_id);cs.status='complete';cs.payment_intent.status='requires_capture';
await reconcile(env,c.order.id,stripe);await reconcile(env,c.order.id,stripe);
await runJobs(env,stripe,async()=>new Response('',{status:503}));assert.equal(row(c.order.id).email_status,'pending');assert.equal(row(c.order.id).job_attempts,1);
sql.prepare('UPDATE sales_orders SET next_attempt_at=0 WHERE id=?').run(c.order.id);
await runJobs(env,stripe,send);assert.equal(row(c.order.id).email_status,'accepted');
const oldLink=(await (await orderStatus(new Request(env.COMMERCE_ORIGIN+'/api/commerce/order',{headers:{Cookie:c.cookie}}),env)).json()).download_url;
sql.prepare('UPDATE sales_orders SET renew_requested=1,next_attempt_at=0 WHERE id=?').run(c.order.id);
await runJobs(env,stripe,send);assert.equal(row(c.order.id).download_version,2);assert.equal((await download(new Request(oldLink),env)).status,403);
// Concurrent handlers cause a retry instead of two captures; replay then succeeds.
const d=await create();const ds=sessions.get(d.order.session_id);ds.status='complete';ds.payment_intent.status='requires_capture';
const concurrent=await Promise.allSettled([reconcile(env,d.order.id,stripe),reconcile(env,d.order.id,stripe)]);
assert.equal(concurrent.filter(r=>r.status==='rejected').length,1);await reconcile(env,d.order.id,stripe);assert.equal(row(d.order.id).status,'paid');
assert.equal((await event('payment_intent.succeeded',ds.payment_intent,crypto.randomUUID(),true)).status,400);
assert.equal((await webhook(new Request(env.COMMERCE_ORIGIN+'/api/commerce/webhook',{method:'POST',body:'bad'}),env,stripe)).status,400);
// A signed event from another sandbox origin is unrelated; a missing local
// order must still raise an error, so restoration incidents remain visible.
const unknownId=crypto.randomUUID();
const foreignSession={id:'cs_other_site',object:'checkout.session',metadata:{qognito_order_id:unknownId},success_url:'https://other-staging.example/achat/confirmation/'};
assert.equal((await event('checkout.session.completed',foreignSession)).status,200);
assert.equal((await event('checkout.session.completed',{...foreignSession,success_url:env.COMMERCE_ORIGIN+'/achat/confirmation/'})).status,503);
stripe.checkout.sessions.list=async p=>{assert.equal(p.payment_intent,'pi_other_site');return {data:[foreignSession]};};
assert.equal((await event('payment_intent.succeeded',{id:'pi_other_site',object:'payment_intent',metadata:{qognito_order_id:unknownId}})).status,200);
assert.equal(sql.prepare('SELECT count(*) AS n FROM sales_orders WHERE id=?').get(unknownId).n,0);
// Snapshot uses the purchased price after the active price is changed.
await reconcile({...env,SAGA_PRICE_ID:'price_next'},d.order.id,stripe);assert.equal(row(d.order.id).price_id,'price_sale');
// Closing a won dispute restores access even though charge.disputed stays true.
ds.payment_intent.latest_charge.id='ch_disputed';ds.payment_intent.latest_charge.disputed=true;
let disputeStatus='under_review';stripe.disputes.list=async p=>{assert.equal(p.charge,'ch_disputed');return {data:[{status:disputeStatus}],has_more:false};};
await reconcile(env,d.order.id,stripe);assert.equal(row(d.order.id).status,'disputed');
disputeStatus='won';await reconcile(env,d.order.id,stripe);assert.equal(row(d.order.id).status,'paid');
disputeStatus='lost';await reconcile(env,d.order.id,stripe);assert.equal(row(d.order.id).status,'disputed');
disputeStatus='won';await reconcile(env,d.order.id,stripe);
// Expiration, forged scopes and cancelled sessions never grant access.
const expired=await create();sessions.get(expired.order.session_id).status='expired';
await reconcile(env,expired.order.id,stripe);assert.equal(row(expired.order.id).status,'expired');
assert.equal((await download(new Request(env.COMMERCE_ORIGIN+'/api/commerce/download'),env)).status,403);
assert.equal((await download(new Request(env.COMMERCE_ORIGIN+'/api/commerce/download',{method:'POST'}),env)).status,405);
sql.prepare('UPDATE sales_orders SET download_until=0 WHERE id=?').run(d.order.id);
const expiredStatus=await (await orderStatus(new Request(env.COMMERCE_ORIGIN+'/api/commerce/order',{headers:{Cookie:d.cookie}}),env)).json();assert.equal(expiredStatus.download_url,null);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM commerce_orders').get().n,0,'legacy ledger unchanged');
// Invoice uses the captured payment; retries recover the same invoice without collection.
let createdInvoices=0, invoiceLines=0, attached=0, namedCompany=null;
stripe.customers.update=async(id,p)=>{assert.deepEqual(p.preferred_locales,['fr']);namedCompany=p.name;};
const invoice={id:'in_fixture',status:'draft',total:4999,currency:'eur',livemode:false,metadata:{qognito_order_id:d.order.id}};
stripe.invoices.list=()=>({async *[Symbol.asyncIterator](){if(createdInvoices)yield structuredClone(invoice);}});
stripe.invoices.create=async p=>{assert.equal(p.auto_advance,false);assert.equal(p.collection_method,'send_invoice');assert.equal(p.pending_invoice_items_behavior,'exclude');assert.equal(p.footer,INVOICE_FOOTER);assert.equal(p.rendering.amount_tax_display,'exclude_tax');assert.equal(p.custom_fields[0].value,d.order.id);assert.match(p.description,/Paiement encaissé le/);createdInvoices++;return structuredClone(invoice);};
stripe.invoices.retrieve=async()=>structuredClone(invoice);
stripe.invoices.listLineItems=async()=>({data:invoiceLines?[{id:'il_fixture'}]:[]});
stripe.invoiceItems.create=async p=>{assert.equal(p.pricing.price,'price_sale');assert.deepEqual(p.tax_rates,['txr_fr']);invoiceLines++;};
stripe.invoices.finalizeInvoice=async(id,p)=>{assert.equal(p.auto_advance,false);invoice.status='open';return structuredClone(invoice);};
stripe.invoices.attachPayment=async(id,p)=>{assert.equal(p.payment_intent,ds.payment_intent.id);attached++;invoice.status='paid';invoice.hosted_invoice_url='https://invoice.stripe.com/i/settled';return structuredClone(invoice);};
const invoiced={...row(d.order.id),stripe_customer_id:'cus_fixture',invoice_id:null};
await ensureInvoice(env,invoiced,stripe);
await ensureInvoice(env,invoiced,stripe); // Lost persistence is recovered through metadata lookup.
assert.equal(createdInvoices,1);assert.equal(invoiceLines,1);assert.equal(attached,1);
assert.equal(row(d.order.id).invoice_url,'https://invoice.stripe.com/i/settled');
await ensureInvoice(env,{...invoiced,buyer_kind:'business',company_name:'Société test'},stripe);assert.equal(namedCompany,'Société test');
invoice.total=5000;await assert.rejects(ensureInvoice(env,invoiced,stripe),/invoice_total/);
// Incident outbox survives provider outage, deduplicates parallel passes and
// distinguishes a later incident from the resolved first occurrence.
const monitored={...env,COMMERCE_ALERT_TO:'owner@example.test'};
sql.prepare("UPDATE sales_orders SET job_attempts=5,last_error='retry_required' WHERE id=?").run(d.order.id);
let alertsSent=0;const alertKeys=new Set();
const alertSend=async(url,options)=>{const body=JSON.parse(options.body);assert.deepEqual(body.to,['owner@example.test']);assert.ok(!body.text.includes('token='));alertKeys.add(options.headers['Idempotency-Key']);alertsSent++;return Response.json({id:'alert_'+alertsSent});};
await monitorSales(monitored,async()=>new Response('',{status:503}));
assert.equal(sql.prepare('SELECT failure_email_id FROM sales_alerts').get().failure_email_id,null);
await Promise.all([monitorSales(monitored,alertSend),monitorSales(monitored,alertSend)]);
assert.equal(alertsSent,1);await monitorSales(monitored,alertSend);assert.equal(alertsSent,1);
sql.prepare('UPDATE sales_orders SET job_attempts=0,last_error=NULL WHERE id=?').run(d.order.id);
await monitorSales(monitored,alertSend);assert.equal(alertsSent,2);
await monitorSales(monitored,alertSend);assert.equal(alertsSent,2);
sql.prepare("UPDATE sales_orders SET job_attempts=5,last_error='retry_required' WHERE id=?").run(d.order.id);
await monitorSales(monitored,alertSend);assert.equal(alertsSent,3);assert.equal(alertKeys.size,3);
assert.equal(sql.prepare('SELECT count(*) AS n FROM sales_alerts').get().n,2);
await monitorSales({...monitored,COMMERCE_MODE:'live'},alertSend);assert.equal(alertsSent,3,'no cross-environment alert');
// A lost provider response followed by incident resolution must keep an identical
// failure payload for the same idempotency key (Resend rejects changed payloads).
sql.prepare('UPDATE sales_alerts SET failure_email_id=NULL WHERE resolved_at IS NULL').run();
let acceptedBody,acceptedKey;
await monitorSales(monitored,async(url,options)=>{acceptedBody=options.body;acceptedKey=options.headers['Idempotency-Key'];throw Error('response lost');});
sql.prepare('UPDATE sales_orders SET job_attempts=0,last_error=NULL WHERE id=?').run(d.order.id);
await monitorSales(monitored,async(url,options)=>{assert.equal(options.body,acceptedBody);assert.equal(options.headers['Idempotency-Key'],acceptedKey);return Response.json({id:'recovered-accepted-response'});});
assert.equal(sql.prepare('SELECT failure_email_id FROM sales_alerts ORDER BY id DESC').get().failure_email_id,'recovered-accepted-response');
console.log('OK ventes : 49,99 TTC, consentements, FR métropolitaine, autorisation/capture, signatures, concurrence, prix figé, reprise, PDF privé, intégrité, emails, renouvellement, remboursements.');
