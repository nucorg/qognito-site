// Explicit live catalogue setup. No Checkout session, payment, customer or invoice
// is created. No deployment, purchase opening or legal approval is performed here.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { randomBytes, createHash } from 'node:crypto';
import Stripe from 'stripe';
import { OFFER, MEDIATOR_CONTACT } from '../server/commerce/offer.mjs';

if (!process.argv.includes('--provision-live')) {
 console.log('Prépare le catalogue Stripe live, sans paiement ni ouverture. Exécution explicite : --provision-live.');
 process.exit(0);
}
const root=resolve(import.meta.dirname,'..');
const dir=resolve(root,'.wrangler/sales-production');
const origin='https://qognito.io';
// Stripe cannot solve the zone's browser challenge. Use this project's stable
// production hostname for signed notifications; customer links keep qognito.io.
const webhookUrl='https://qognito-site.pages.dev/api/commerce/webhook';
const db={binding:'COMMERCE_DB',database_name:'qognito-commerce-production',database_id:'73e36ed0-aea8-48a7-9606-aadbbe7496d5',migrations_dir:'migrations'};
const bucket={binding:'COMMERCE_PDF',bucket_name:'qognito-commerce-production'};
const account='10434902b076f59013c4ec2189997cdd';
const save=(name,data)=>writeFile(resolve(dir,name),JSON.stringify(data,null,2)+'\n',{mode:0o600});
async function previous(name) {try{return JSON.parse(await readFile(resolve(dir,name),'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}}
let operation='read_live_key';
try {
 const source=parseEnv(await readFile(resolve(root,'.env.stripe-live'),'utf8'));
 assert.match(source.STRIPE_SECRET_KEY||'',/^(sk|rk)_live_[A-Za-z0-9]+$/,'Une clé serveur live est requise');
 const resend=parseEnv(await readFile(resolve(root,'.env.resend'),'utf8'));
 assert.ok(resend.RESEND_API_KEY?.startsWith('re_'));
 const bytes=await readFile(resolve(root,OFFER.sourcePath));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),OFFER.sha256);
 await mkdir(dir,{recursive:true,mode:0o700});
 const state=await previous('stripe-state.json');
 let secrets=await previous('secrets.json');
 const stripe=new Stripe(source.STRIPE_SECRET_KEY,{timeout:20000,maxNetworkRetries:1});
 operation='verify_account';
 const seller=await stripe.accounts.retrieve();
 if(state.account)assert.equal(seller.id,state.account,'Le compte Stripe doit rester identique');
 state.account=seller.id;
 await save('account-review.json',{id:seller.id,country:seller.country,charges_enabled:seller.charges_enabled,payouts_enabled:seller.payouts_enabled,details_submitted:seller.details_submitted,business_profile:seller.business_profile,company:seller.company?{name:seller.company.name,address:seller.company.address}:null});
 await save('stripe-state.json',state);
 operation='product';
 let product=state.product?await stripe.products.retrieve(state.product):null;
 if(!product)for await(const p of stripe.products.list({active:true,limit:100}))if(p.metadata?.qognito_edition===OFFER.edition && p.metadata?.qognito_offer===OFFER.id){product=p;break;}
 product ||= await stripe.products.create({name:OFFER.title,description:`PDF français, édition ${OFFER.version}, 93 pages, licence pour un lecteur.`,metadata:{qognito_edition:OFFER.edition,qognito_offer:OFFER.id,qognito_environment:'live'}},{idempotencyKey:`qognito-live-product:${OFFER.edition}`});
 assert.equal(product.livemode,true);assert.equal(product.active,true);assert.equal(product.metadata.qognito_edition,OFFER.edition);
 state.product=product.id;await save('stripe-state.json',state);
 operation='price';
 let price=state.price?await stripe.prices.retrieve(state.price):null;
 if(!price)for await(const p of stripe.prices.list({product:product.id,active:true,limit:100}))if(p.unit_amount===4999 && p.currency==='eur' && p.tax_behavior==='inclusive' && p.type==='one_time'){price=p;break;}
 price ||= await stripe.prices.create({product:product.id,currency:'eur',unit_amount:4999,tax_behavior:'inclusive'},{idempotencyKey:`qognito-live-price:${OFFER.edition}:4999`});
 assert.equal(price.livemode,true);assert.equal(price.active,true);assert.equal(price.unit_amount,4999);assert.equal(price.currency,'eur');assert.equal(price.tax_behavior,'inclusive');assert.equal(price.product,product.id);assert.equal(price.type,'one_time');
 state.price=price.id;await save('stripe-state.json',state);
 operation='tax';
 let tax=state.tax?await stripe.taxRates.retrieve(state.tax):null;
 if(!tax)for await(const t of stripe.taxRates.list({active:true,limit:100}))if(t.metadata?.qognito_offer===OFFER.id && t.percentage===5.5 && t.inclusive && t.country==='FR'){tax=t;break;}
 tax ||= await stripe.taxRates.create({display_name:'TVA',description:'PDF — France métropolitaine, taux confirmé par le vendeur',percentage:5.5,inclusive:true,country:'FR',jurisdiction:'France métropolitaine',metadata:{qognito_offer:OFFER.id}},{idempotencyKey:'qognito-live-volume1-tax55'});
 assert.equal(tax.livemode,true);assert.equal(tax.active,true);assert.equal(tax.percentage,5.5);assert.equal(tax.inclusive,true);assert.equal(tax.country,'FR');
 state.tax=tax.id;await save('stripe-state.json',state);
 operation='payment_methods';
 const configurations=(await stripe.paymentMethodConfigurations.list({limit:100})).data;
 const methodName='Qognito PDF FR — cartes uniquement (production)';
 let methods=state.methods?await stripe.paymentMethodConfigurations.retrieve(state.methods):configurations.find(m=>m.name===methodName);
 if(!methods){
  const base=configurations.find(m=>m.is_default)||configurations[0];assert.ok(base,'Configuration de moyens de paiement absente');
  const preferences=Object.fromEntries(Object.entries(base).filter(([,v])=>v && typeof v==='object' && v.display_preference).map(([k])=>[k,{display_preference:{preference:k==='card'?'on':'off'}}]));
  methods=await stripe.paymentMethodConfigurations.create({name:methodName,...preferences},{idempotencyKey:'qognito-live-volume1-card-methods'});
 }
 assert.equal(methods.livemode,true);assert.equal(methods.active,true);
 const enabled=Object.entries(methods).filter(([,v])=>v && typeof v==='object' && v.display_preference?.value==='on').map(([k])=>k);
 assert.ok(enabled.includes('card'));assert.ok(enabled.every(k=>['card','apple_pay','google_pay'].includes(k)));
 state.methods=methods.id;await save('stripe-state.json',state);
 operation='webhook';
 secrets={...secrets,STRIPE_SECRET_KEY:source.STRIPE_SECRET_KEY,COMMERCE_TOKEN_SECRET:secrets.COMMERCE_TOKEN_SECRET||randomBytes(32).toString('hex'),RESEND_API_KEY:resend.RESEND_API_KEY};
 const events=['checkout.session.completed','checkout.session.expired','payment_intent.succeeded','payment_intent.amount_capturable_updated','payment_intent.canceled','charge.refunded','charge.dispute.created','charge.dispute.closed','refund.updated','refund.failed','invoice.paid'];
 let endpoint;
 if(state.webhook){
  endpoint=await stripe.webhookEndpoints.retrieve(state.webhook);
  assert.ok(secrets.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'),'Secret du webhook existant manquant ; le récupérer avant de continuer');
 }else{
  for await(const e of stripe.webhookEndpoints.list({limit:100}))assert.ok(![webhookUrl,origin+'/api/commerce/webhook'].includes(e.url),'Un webhook existe déjà : reprendre son ID et son secret, sans en créer un second');
  endpoint=await stripe.webhookEndpoints.create({url:webhookUrl,enabled_events:events,api_version:'2026-09-30.endive',description:'Qognito — volume 1 FR — production'},{idempotencyKey:'qognito-live-volume1-webhook'});
  secrets.STRIPE_WEBHOOK_SECRET=endpoint.secret;state.webhook=endpoint.id;
  await save('secrets.json',secrets);await save('stripe-state.json',state);
  endpoint=await stripe.webhookEndpoints.update(endpoint.id,{disabled:true});
 }
 assert.equal(endpoint.livemode,true);assert.equal(endpoint.url,webhookUrl);
 state.webhook_status=endpoint.status;state.webhook_url=endpoint.url;await save('secrets.json',secrets);await save('stripe-state.json',state);
 operation='prepare_files';
 for(const name of ['dist','functions','server','commerce','workers','migrations'])await cp(resolve(root,name),resolve(dir,name),{recursive:true});
 await writeFile(resolve(dir,'package.json'),JSON.stringify({name:'qognito-production-preparation',private:true,type:'module'}));
 try{await symlink(resolve(root,'node_modules'),resolve(dir,'node_modules'),'dir');}catch(e){if(e.code!=='EEXIST')throw e;}
 const base=JSON.parse(await readFile(resolve(root,'wrangler.jsonc'),'utf8'));
 const vars={...base.vars,
  COMMERCE_MODE:'live',COMMERCE_CHECKOUT_ENABLED:'false',COMMERCE_ORIGIN:origin,
  SAGA_PRICE_ID:price.id,SAGA_TAX_RATE_ID:tax.id,STRIPE_PAYMENT_METHOD_CONFIGURATION:methods.id,
  COMMERCE_FROM:'Qognito <commandes@transaction.qognito.io>',COMMERCE_ALERT_TO:'bguarisma@qognito.io',
  COMMERCE_PHONE:'+33 7 62 64 05 06',COMMERCE_MEDIATOR:MEDIATOR_CONTACT};
 delete vars.COMMERCE_LIVE_APPROVED;delete vars.COMMERCE_PDF_APPROVED_SHA256;
 // Pages preview deployments must not inherit the production resources.
 await save('wrangler.json',{name:'qognito-site',pages_build_output_dir:'dist',compatibility_date:'2026-10-06',compatibility_flags:['nodejs_compat'],vars:{...base.vars,COMMERCE_MODE:'disabled',COMMERCE_CHECKOUT_ENABLED:'false'},env:{production:{vars,d1_databases:[db],r2_buckets:[bucket]}}});
 await save('wrangler.jobs.json',{name:'qognito-commerce-jobs-production',account_id:account,main:'workers/commerce-jobs.mjs',compatibility_date:'2026-10-06',compatibility_flags:['nodejs_compat'],vars,d1_databases:[db],r2_buckets:[bucket],workers_dev:false,preview_urls:false,observability:{enabled:true},triggers:{crons:['*/5 * * * *']}});
 console.log({mode:'live',...state,checkout_enabled:false,approval_markers:false,charges_enabled:seller.charges_enabled,objects_verified:true});
}catch(e){
 console.error({operation,error:String(e.message).replace(/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/g,'[clé masquée]'),type:e.type||e.name});process.exitCode=1;
}
