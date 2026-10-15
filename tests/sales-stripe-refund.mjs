// Explicit sandbox refund after the successful browser test; local or dedicated staging only.
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {readFile} from 'node:fs/promises';
import {OFFER} from '../server/commerce/offer.mjs';
import {digest} from '../server/commerce/sales.mjs';
assert.ok(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
const origin=process.env.QOGNITO_SALES_TEST_ORIGIN || 'http://localhost:8788';
assert.ok(['http://localhost:8788','https://qognito-commerce-staging.pages.dev'].includes(origin));
const order=JSON.parse(await readFile(origin.startsWith('https:')?'.wrangler/sales-staging/browser-sale-success.json':'/tmp/qognito-sale-success.json','utf8'));
assert.equal(new URL(order.download_url).origin,origin);
const before=await fetch(order.download_url);assert.equal(before.status,200);assert.equal(await digest(await before.arrayBuffer()),OFFER.sha256);
const session=(await stripe.checkout.sessions.list({limit:100})).data.find(s=>s.client_reference_id===order.reference);
assert.ok(session);assert.equal(session.livemode,false);
const pi=await stripe.paymentIntents.retrieve(session.payment_intent);assert.equal(pi.status,'succeeded');assert.equal(pi.amount_received,4999);
const invoices=(await stripe.invoices.list({customer:session.customer,limit:100})).data.filter(i=>i.metadata.qognito_order_id===order.reference);
assert.equal(invoices.length,1);assert.equal(invoices[0].status,'paid');assert.equal(invoices[0].amount_paid,4999);assert.equal(invoices[0].attempt_count,0);
const refund=await stripe.refunds.create({payment_intent:pi.id},{idempotencyKey:'qognito-test-refund:'+order.reference});
assert.equal(refund.amount,4999);assert.equal(refund.status,'succeeded');
let status;
for(let i=0;i<40;i++){const r=await fetch(order.download_url);status=r.status;if(status===403)break;await new Promise(r=>setTimeout(r,500));}
assert.equal(status,403,'full refund revokes the existing download link');
console.log(JSON.stringify({test:true,reference:order.reference,invoice:invoices[0].id,invoice_paid:4999,collection_attempts:0,refund:refund.id,refund_amount:refund.amount,download_after_refund:status}));
