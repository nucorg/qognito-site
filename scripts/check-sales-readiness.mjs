import { OFFER } from '../server/commerce/offer.mjs';
const e=process.env;
const checks={live_credentials:e.STRIPE_SECRET_KEY?.startsWith('sk_live_')===true,webhook_secret:e.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')===true,https_origin:/^https:\/\/[^/]+\/?$/.test(e.COMMERCE_ORIGIN||''),mail_from:!!e.COMMERCE_FROM,live_mode:e.COMMERCE_MODE==='live',checkout_open:e.COMMERCE_CHECKOUT_ENABLED==='true',
 price_id:/^price_/.test(e.SAGA_PRICE_ID||''),tax_id:/^txr_/.test(e.SAGA_TAX_RATE_ID||''),
 card_configuration:/^pmc_/.test(e.STRIPE_PAYMENT_METHOD_CONFIGURATION||''),
 signing_secret:(e.COMMERCE_TOKEN_SECRET||'').length>=32,mail_key:!!e.RESEND_API_KEY,
 mediator:!!e.COMMERCE_MEDIATOR&&!/REPLACE|renseigner/.test(e.COMMERCE_MEDIATOR),
 phone:!!e.COMMERCE_PHONE,terms_approved:e.COMMERCE_LIVE_APPROVED===OFFER.termsVersion,pdf_approved:e.COMMERCE_PDF_APPROVED_SHA256===OFFER.sha256};
console.log(JSON.stringify(checks,null,2));
console.log('Les bindings D1/R2, DNS, facturation, réception email et recette distante sont vérifiés séparément.');
if(Object.values(checks).some(x=>!x))process.exitCode=1;
