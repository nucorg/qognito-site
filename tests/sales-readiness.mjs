import assert from 'node:assert/strict';
import { readiness } from '../scripts/check-sales-readiness.mjs';
import { OFFER } from '../server/commerce/offer.mjs';
const e={STRIPE_SECRET_KEY:'sk_live_fake',STRIPE_WEBHOOK_SECRET:'whsec_fake',COMMERCE_ORIGIN:'https://qognito.io',
 COMMERCE_MODE:'live',COMMERCE_CHECKOUT_ENABLED:'false',COMMERCE_FROM:'sender',SAGA_PRICE_ID:'price_fake',SAGA_TAX_RATE_ID:'txr_fake',
 STRIPE_PAYMENT_METHOD_CONFIGURATION:'pmc_fake',COMMERCE_TOKEN_SECRET:'x'.repeat(32),RESEND_API_KEY:'re_fake',COMMERCE_MEDIATOR:'CM2C',COMMERCE_PHONE:'phone'};
assert.equal(readiness(e).configuration_ok,true);
assert.equal(readiness(e,'open').configuration_ok,false);
assert.equal(readiness({...e,COMMERCE_CHECKOUT_ENABLED:'true'},'open').configuration_ok,false);
const approved={...e,COMMERCE_LIVE_APPROVED:OFFER.termsVersion,COMMERCE_PDF_APPROVED_SHA256:OFFER.sha256};
assert.equal(readiness({...approved,COMMERCE_CHECKOUT_ENABLED:'true'},'open').configuration_ok,true);
assert.equal(readiness(approved,'closed').configuration_ok,true);
assert.equal(readiness({...approved,COMMERCE_PDF_APPROVED_SHA256:'stale'},'closed').configuration_ok,false);
assert.equal(readiness({...e,STRIPE_SECRET_KEY:'sk_test_fake'}).configuration_ok,false);
assert.throws(()=>readiness(e,'unknown'));
console.log('OK préparation : fermé par défaut, ouvert seulement avec marqueurs exacts, fermeture de secours, mauvaises clés refusées.');
