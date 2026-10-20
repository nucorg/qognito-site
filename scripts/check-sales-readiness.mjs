import { OFFER } from '../server/commerce/offer.mjs';
import { pathToFileURL } from 'node:url';

export function readiness(e, expected='closed') {
 if(!['closed','open'].includes(expected))throw new Error('Expected state must be closed or open');
 const checks={live_credentials:/^(sk|rk)_live_/.test(e.STRIPE_SECRET_KEY||''),webhook_secret:e.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')===true,
  https_origin:/^https:\/\/[^/]+\/?$/.test(e.COMMERCE_ORIGIN||''),mail_from:!!e.COMMERCE_FROM,live_mode:e.COMMERCE_MODE==='live',
  checkout_expected:e.COMMERCE_CHECKOUT_ENABLED===(expected==='open'?'true':'false'),
  price_id:/^price_/.test(e.SAGA_PRICE_ID||''),tax_id:/^txr_/.test(e.SAGA_TAX_RATE_ID||''),
  card_configuration:/^pmc_/.test(e.STRIPE_PAYMENT_METHOD_CONFIGURATION||''),signing_secret:(e.COMMERCE_TOKEN_SECRET||'').length>=32,
  mail_key:e.RESEND_API_KEY?.startsWith('re_')===true,mediator:!!e.COMMERCE_MEDIATOR&&!/REPLACE|renseigner/.test(e.COMMERCE_MEDIATOR),phone:!!e.COMMERCE_PHONE};
 if(expected==='open'){
  checks.terms_approved=e.COMMERCE_LIVE_APPROVED===OFFER.termsVersion;
  checks.pdf_approved=e.COMMERCE_PDF_APPROVED_SHA256===OFFER.sha256;
 }else{
  // Emergency closure may retain approval markers, but never stale ones.
  checks.terms_marker_consistent=!e.COMMERCE_LIVE_APPROVED||e.COMMERCE_LIVE_APPROVED===OFFER.termsVersion;
  checks.pdf_marker_consistent=!e.COMMERCE_PDF_APPROVED_SHA256||e.COMMERCE_PDF_APPROVED_SHA256===OFFER.sha256;
 }
 return {expected,checks,configuration_ok:Object.values(checks).every(Boolean),
  markers_present:!!e.COMMERCE_LIVE_APPROVED||!!e.COMMERCE_PDF_APPROVED_SHA256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const flags=process.argv.slice(2);
 if(flags.some(a=>!['--expect=closed','--expect=open'].includes(a))||flags.length>1)throw new Error('Usage: --expect=closed|open');
 const result=readiness(process.env,flags[0]?.split('=')[1]||'closed');
 console.log(JSON.stringify(result,null,2));
 console.log('Configuration uniquement : accord de Boris, sauvegarde, bindings et contrôles distants à vérifier séparément.');
 if(!result.configuration_ok)process.exitCode=1;
}
