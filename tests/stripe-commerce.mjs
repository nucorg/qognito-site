import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import Stripe from 'stripe';
import { checkout, webhook, OFFER_ID, checkoutDiagnostic } from '../server/commerce/stripe.mjs';
import { testPage } from '../server/commerce/test-page.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec(await readFile(new URL('../migrations/0001_commerce.sql', import.meta.url), 'utf8'));
sqlite.exec(await readFile(new URL('../migrations/0002_commerce_tax.sql', import.meta.url), 'utf8'));
const db = {
  prepare(sql) {
    return { bind(...args) {
      return { sql, args, first: async () => sqlite.prepare(sql).get(...args) || null };
    } };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try { for (const { sql, args } of statements) sqlite.prepare(sql).run(...args); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }
};
const env = {
  COMMERCE_MODE: 'test', COMMERCE_ORIGIN: 'http://localhost:8788', COMMERCE_DB: db,
  STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture', SAGA_TEST_PRICE_ID: 'price_fixture'
};
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const price = { id: env.SAGA_TEST_PRICE_ID, livemode: false, active: true, type: 'one_time', currency: 'eur', unit_amount: 1234 };
let createCalls = [];
let priceFixture = price;
stripe.prices.retrieve = async () => priceFixture;
stripe.checkout.sessions.create = async (params, options) => {
  // Match the API rejection observed in the sandbox; methods are managed in the Dashboard.
  if (Object.hasOwn(params, 'payment_method_types')) throw Object.assign(new Error('Unsupported Checkout parameter'), {
    type: 'StripeInvalidRequestError', statusCode: 400, param: 'payment_method_types'
  });
  createCalls.push({ params, options });
  return { livemode: false, url: 'https://checkout.stripe.com/c/pay/cs_test_fixture' };
};
const post = (body, headers = {}, method = 'POST') => new Request('http://localhost:8788/api/commerce/checkout', {
  method, headers: { Origin: env.COMMERCE_ORIGIN, 'Content-Type': 'application/json', ...headers },
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
});
const input = { lang: 'fr', request_id: crypto.randomUUID() };
assert.equal((await checkout(post(input), { ...env, COMMERCE_MODE: 'disabled' }, stripe)).status, 503);
assert.equal((await checkout(post(input), { ...env, STRIPE_SECRET_KEY: 'sk_live_fixture' }, stripe)).status, 503);
assert.equal((await checkout(post(input), env, stripe)).status, 200);
assert.equal(createCalls[0].params.line_items[0].price, env.SAGA_TEST_PRICE_ID);
assert.equal(createCalls[0].params.line_items[0].quantity, 1);
assert.equal(createCalls[0].params.locale, 'fr');
assert.equal(createCalls[0].params.automatic_tax.enabled, false);
assert.equal(createCalls[0].params.metadata.qognito_offer_id, OFFER_ID);
assert.ok(createCalls[0].params.success_url.startsWith(env.COMMERCE_ORIGIN));
await checkout(post(input), env, stripe);
assert.equal(createCalls[0].options.idempotencyKey, createCalls[1].options.idempotencyKey);
await checkout(post({ ...input, lang: 'en' }), env, stripe);
assert.equal(createCalls.at(-1).params.locale, 'en');
assert.equal((await checkout(post({ ...input, amount: 1 }), env, stripe)).status, 400);
assert.equal((await checkout(post({ ...input, lang: 'es' }), env, stripe)).status, 400);
assert.equal((await checkout(post(input, { Origin: 'https://attacker.invalid' }), env, stripe)).status, 403);
assert.equal((await checkout(post(input, {}, 'GET'), env, stripe)).status, 405);
assert.equal((await checkout(post({ ...input, request_id: '-'.repeat(36) }), env, stripe)).status, 400);
assert.equal((await checkout(post(input), { ...env, COMMERCE_ORIGIN: 'ftp://localhost' }, stripe)).status, 503);
assert.equal((await checkout(post(input), { ...env, COMMERCE_TAX_MODE: 'unknown' }, stripe)).status, 503);
priceFixture = { ...price, livemode: true };
assert.equal((await checkout(post(input), env, stripe)).status, 503);
priceFixture = { ...price, type: 'recurring' };
assert.equal((await checkout(post(input), env, stripe)).status, 503);
priceFixture = price;

// Diagnostics must remain useful without logging a Stripe error's message, raw body or key.
assert.deepEqual(checkoutDiagnostic({ type: 'StripeAuthenticationError', code: 'invalid_api_key', statusCode: 401,
  message: 'Secret sk_test_sensitive must not be printed', raw: { key: 'sk_test_sensitive' } }, 'retrieve_price'),
{ stage: 'retrieve_price', type: 'StripeAuthenticationError', code: 'invalid_api_key', status: 401, param: null });
const secretDiagnostic = checkoutDiagnostic({ type: 'sk_test_sensitive', code: 'sk_test_sensitive',
  param: 'sk_test_sensitive', statusCode: 'sk_test_sensitive' }, 'retrieve_price');
assert.ok(!JSON.stringify(secretDiagnostic).includes('sk_test_sensitive'));
const warnings = [];
const originalWarn = console.warn;
try {
  console.warn = (...args) => warnings.push(args);
  stripe.prices.retrieve = async () => { throw Object.assign(new Error('sk_test_sensitive'), {
    type: 'StripeInvalidRequestError', code: 'resource_missing', statusCode: 404 }); };
  const response = await checkout(post(input), env, stripe);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'checkout_failed' });
  assert.equal(JSON.parse(warnings[0][1]).stage, 'retrieve_price');
  assert.equal(JSON.parse(warnings[0][1]).code, 'resource_missing');
  assert.ok(!JSON.stringify(warnings).includes('sk_test_sensitive'));
} finally {
  console.warn = originalWarn;
  stripe.prices.retrieve = async () => priceFixture;
}

// Deliberately synthetic tax code for mocked API tests, never a product classification.
const taxEnv = { ...env, COMMERCE_TAX_MODE: 'automatic', SAGA_TEST_TAX_CODE: 'txcd_00000000', COMMERCE_COLLECT_TAX_IDS: 'true' };
let taxSettings = { livemode: false, status: 'active' };
let taxRegistrations = { data: [{ livemode: false, status: 'active' }] };
stripe.tax.settings.retrieve = async () => taxSettings;
stripe.tax.registrations.list = async params => {
  assert.equal(params.status, 'active');
  return taxRegistrations;
};
assert.equal((await checkout(post(input), { ...taxEnv, SAGA_TEST_TAX_CODE: '' }, stripe)).status, 503);
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503, 'Tax requires explicit product classification and price behavior.');
priceFixture = { ...price, tax_behavior: 'exclusive', product: { active: true, livemode: false, tax_code: taxEnv.SAGA_TEST_TAX_CODE } };
taxSettings.status = 'pending';
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
taxSettings.status = 'active';
taxSettings.livemode = true;
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
taxSettings.livemode = false;
taxRegistrations = { data: [] };
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
taxRegistrations = { data: [{ livemode: true, status: 'active' }] };
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
taxRegistrations.data[0].livemode = false;
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 200);
assert.equal(createCalls.at(-1).params.automatic_tax.enabled, true);
assert.equal(createCalls.at(-1).params.tax_id_collection.enabled, true);
assert.equal(createCalls.at(-1).params.metadata.qognito_tax_code, taxEnv.SAGA_TEST_TAX_CODE);
assert.notEqual(createCalls[0].options.idempotencyKey, createCalls.at(-1).options.idempotencyKey);
priceFixture = { ...priceFixture, tax_behavior: 'inclusive' };
assert.equal((await checkout(post({ ...input, lang: 'en' }), taxEnv, stripe)).status, 200);
priceFixture = { ...priceFixture, tax_behavior: 'unspecified' };
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
priceFixture = { ...priceFixture, tax_behavior: 'exclusive', product: { active: true, livemode: false, tax_code: null } };
assert.equal((await checkout(post(input), taxEnv, stripe)).status, 503);
priceFixture = price;

let session = {
  id: 'cs_test_fixture', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
  metadata: { qognito_offer_id: OFFER_ID, qognito_environment: 'test', qognito_lang: 'fr' },
  line_items: { has_more: false, data: [{ quantity: 1, price, amount_total: 1234, amount_subtotal: 1234, amount_tax: 0 }] },
  amount_total: 1234, amount_subtotal: 1234, automatic_tax: { enabled: false, status: null },
  currency: 'eur', total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
  payment_intent: 'pi_fixture', customer_details: { email: 'buyer@example.invalid' }
};
stripe.checkout.sessions.retrieve = async () => session;
const event = (id, overrides = {}) => ({ id, type: 'checkout.session.completed', livemode: false,
  data: { object: { id: session.id } }, ...overrides });
const notification = async (eventData, { invalid = false, timestamp } = {}) => {
  const payload = JSON.stringify(eventData);
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: env.STRIPE_WEBHOOK_SECRET,
    ...(timestamp ? { timestamp } : {}), cryptoProvider: Stripe.createSubtleCryptoProvider() });
  return new Request('http://localhost:8788/api/commerce/webhook', {
    method: 'POST', headers: { 'Stripe-Signature': invalid ? 'invalid' : signature }, body: payload
  });
};
assert.equal((await webhook(await notification(event('evt_bad'), { invalid: true }), env, stripe)).status, 400);
assert.equal((await webhook(await notification(event('evt_old'), { timestamp: Math.floor(Date.now() / 1000) - 600 }), env, stripe)).status, 400);
assert.equal((await webhook(await notification(event('evt_live', { livemode: true })), env, stripe)).status, 400);
session.payment_status = 'unpaid';
assert.equal((await webhook(await notification(event('evt_unpaid')), env, stripe)).status, 200);
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM commerce_orders').get().n, 0);
session.payment_status = 'paid';
session.line_items.data[0].quantity = 2;
assert.equal((await webhook(await notification(event('evt_quantity')), env, stripe)).status, 400);
session.line_items.data[0].quantity = 1;
session.amount_total = 1;
assert.equal((await webhook(await notification(event('evt_amount')), env, stripe)).status, 400);
session.amount_total = 1234;
assert.equal((await webhook(await notification(event('evt_paid')), env, stripe)).status, 200);
assert.equal((await (await webhook(await notification(event('evt_paid')), env, stripe)).json()).duplicate, true);
const requests = await Promise.all(['evt_concurrent_a', 'evt_concurrent_b'].map(id => notification(event(id))));
const concurrent = await Promise.all(requests.map(request => webhook(request, env, stripe)));
assert.ok(concurrent.every(response => response.status === 200));
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM commerce_orders').get().n, 1);
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM commerce_fulfillment').get().n, 2);
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM commerce_events').get().n, 3);
assert.equal(sqlite.prepare('SELECT status FROM commerce_orders').get().status, 'paid_awaiting_setup');
const failingEnv = { ...env, COMMERCE_DB: { prepare: db.prepare, batch: async () => { throw new Error('database unavailable'); } } };
assert.equal((await webhook(await notification(event('evt_failure')), failingEnv, stripe)).status, 500);
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM commerce_events WHERE event_id='evt_failure'").get().n, 0);
assert.equal((await webhook(await notification(event('evt_failure')), env, stripe)).status, 200);

const untaxedSession = structuredClone(session);
for (const behavior of ['exclusive', 'inclusive']) {
  session = structuredClone(untaxedSession);
  session.id = `cs_test_tax_${behavior}`;
  session.payment_intent = `pi_tax_${behavior}`;
  session.metadata.qognito_tax_mode = 'automatic';
  session.metadata.qognito_tax_code = taxEnv.SAGA_TEST_TAX_CODE;
  session.metadata.qognito_tax_behavior = behavior;
  session.automatic_tax = { enabled: true, status: 'complete' };
  session.line_items.data[0].price.tax_behavior = behavior;
  const tax = 123; // Synthetic amount, not a Qognito tax rate.
  session.amount_total = behavior === 'exclusive' ? price.unit_amount + tax : price.unit_amount;
  session.amount_subtotal = session.amount_total - tax;
  Object.assign(session.line_items.data[0], { amount_total: session.amount_total, amount_subtotal: session.amount_subtotal, amount_tax: tax });
  session.total_details.amount_tax = tax;
  session.automatic_tax.status = 'failed';
  assert.equal((await webhook(await notification(event(`evt_tax_failed_${behavior}`)), env, stripe)).status, 400);
  session.automatic_tax.status = 'requires_location_inputs';
  assert.equal((await webhook(await notification(event(`evt_tax_location_${behavior}`)), env, stripe)).status, 400);
  session.automatic_tax.status = 'complete';
  session.line_items.data[0].amount_tax = tax + 1;
  assert.equal((await webhook(await notification(event(`evt_tax_mismatch_${behavior}`)), env, stripe)).status, 400);
  session.line_items.data[0].amount_tax = tax;
  // Notification remains valid even when the runtime Tax mode is subsequently disabled.
  assert.equal((await webhook(await notification(event(`evt_tax_${behavior}`)), env, stripe)).status, 200);
  const recorded = sqlite.prepare('SELECT * FROM commerce_orders WHERE session_id = ?').get(session.id);
  assert.equal(recorded.amount_tax, tax);
  assert.equal(recorded.amount_subtotal, session.amount_subtotal);
  assert.equal(recorded.automatic_tax_status, 'complete');
  assert.equal(recorded.tax_behavior, behavior);
  assert.equal(recorded.tax_code, taxEnv.SAGA_TEST_TAX_CODE);
}
session = structuredClone(untaxedSession);
session.id = 'cs_test_zero_tax';
session.payment_intent = 'pi_zero_tax';
Object.assign(session.metadata, { qognito_tax_mode: 'automatic', qognito_tax_code: taxEnv.SAGA_TEST_TAX_CODE, qognito_tax_behavior: 'exclusive' });
session.automatic_tax = { enabled: true, status: 'complete' };
session.line_items.data[0].price.tax_behavior = 'exclusive';
assert.equal((await webhook(await notification(event('evt_tax_zero', { type: 'checkout.session.async_payment_succeeded' })), env, stripe)).status, 200, 'A completed Tax calculation may legitimately produce zero tax.');

const pageRequest = new Request('http://localhost:8788/commerce-test?lang=en&result=return');
assert.equal(testPage(pageRequest, { COMMERCE_MODE: 'disabled' }).status, 404);
const page = testPage(pageRequest, env);
assert.ok(page.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
assert.ok(page.headers.get('X-Robots-Tag').includes('noindex'));
const html = await page.text();
assert.ok(html.includes('SAGA-IA payment test'));
assert.ok(html.includes('No PDF or access to SAGA Arbitre is delivered.'));
assert.ok(!html.includes(env.STRIPE_SECRET_KEY));
assert.ok(!html.includes('buyer@example.invalid'));
sqlite.close();
console.log('OK : checkout test FR/EN, prérequis Tax, taxes incluses/exclues/nulles, calcul incomplet refusé, prix serveur, mode réel refusé, signatures SDK, doublons/concurrence SQLite et reprise.');
