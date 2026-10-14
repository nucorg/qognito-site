// Run: node --env-file=.dev.vars scripts/prepare-sales-test.mjs --provision-test
// Creates only sandbox objects. Never prints secrets. No live-mode support.
import Stripe from 'stripe';
import { randomBytes } from 'node:crypto';
import { writeFile, access } from 'node:fs/promises';
import { OFFER } from '../server/commerce/offer.mjs';
const target = '.dev.vars.sales';
if (!process.argv.includes('--provision-test')) { console.log('Prépare un produit, prix, taux et moyens de paiement en sandbox ; utiliser --provision-test.'); process.exit(0); }
try { await access(target); console.error('Le fichier privé existe déjà ; aucune écriture ni nouvel objet.'); process.exit(1); } catch (e) { if(e.code !== 'ENOENT') throw e; }
if(!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Clé Stripe de test requise.');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const product = await stripe.products.create({ name: 'TEST — SAGA-IA volume 1 FR', metadata: { qognito_edition: OFFER.edition, qognito_offer: OFFER.id } }, { idempotencyKey: `qognito-product:${OFFER.edition}` });
const price = await stripe.prices.create({ product: product.id, currency:'eur',unit_amount:4999,tax_behavior:'inclusive' }, {idempotencyKey:`qognito-price:${OFFER.edition}:4999`});
const tax = await stripe.taxRates.create({ display_name:'TVA',description:'PDF France métropolitaine — scénario validé par Boris',percentage:5.5,inclusive:true,country:'FR',jurisdiction:'France métropolitaine' },{idempotencyKey:'qognito-volume1-fr-tax55-v2'});
const methods=(await stripe.paymentMethodConfigurations.list({limit:100})).data;
let method=methods.find(x=>x.name==='Qognito PDF — cartes uniquement');
if(!method){
 const base=methods.find(x=>x.is_default)||methods[0];
 const preferences=Object.fromEntries(Object.entries(base||{}).filter(([,v])=>v && typeof v==='object' && v.display_preference).map(([k])=>[k,{display_preference:{preference:k==='card'?'on':'off'}}]));
 method=await stripe.paymentMethodConfigurations.create({name:'Qognito PDF — cartes uniquement',...preferences},{idempotencyKey:'qognito-volume1-fr-methods-v2'});
}
if([product,price,tax,method].some(x=>x.livemode))throw new Error('Objet réel refusé.');
const env={COMMERCE_MODE:'test',COMMERCE_CHECKOUT_ENABLED:'true',COMMERCE_ORIGIN:'http://localhost:8788',STRIPE_SECRET_KEY:process.env.STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET:'whsec_replace_with_local_listener',SAGA_PRICE_ID:price.id,SAGA_TAX_RATE_ID:tax.id,STRIPE_PAYMENT_METHOD_CONFIGURATION:method.id,
COMMERCE_TOKEN_SECRET:randomBytes(32).toString('hex'),COMMERCE_PHONE:'+33 7 62 64 05 06',COMMERCE_FROM:'Qognito <commandes@transaction.qognito.io>'};
await writeFile(target,Object.entries(env).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{mode:0o600,flag:'wx'});
console.log(JSON.stringify({environment:'test',product:product.id,price:price.id,tax:tax.id,methods:method.id,privateFile:target},null,2));
