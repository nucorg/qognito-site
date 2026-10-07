import Stripe from 'stripe';

export const OFFER_ID = 'saga-ia-volume-01-pdf-arbitre-personal';
export const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
});

export function configuration(env) {
  if (env.COMMERCE_MODE !== 'test') throw new Error('commerce_disabled');
  if (!/^sk_test_/.test(env.STRIPE_SECRET_KEY || '')) throw new Error('test_key_required');
  if (!/^price_/.test(env.SAGA_TEST_PRICE_ID || '')) throw new Error('test_price_required');
  if (!/^whsec_/.test(env.STRIPE_WEBHOOK_SECRET || '')) throw new Error('webhook_secret_required');
  if (!env.COMMERCE_DB) throw new Error('database_required');
  const taxMode = env.COMMERCE_TAX_MODE || 'disabled';
  if (!['disabled', 'automatic'].includes(taxMode)) throw new Error('invalid_tax_mode');
  if (taxMode === 'automatic' && !/^txcd_\d+$/.test(env.SAGA_TEST_TAX_CODE || '')) throw new Error('tax_code_required');
  if (!['true', 'false'].includes(env.COMMERCE_COLLECT_TAX_IDS || 'false')) throw new Error('invalid_tax_id_setting');
  const origin = new URL(env.COMMERCE_ORIGIN);
  const local = ['localhost', '127.0.0.1'].includes(origin.hostname);
  if (!['http:', 'https:'].includes(origin.protocol) || (!local && origin.protocol !== 'https:') || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('invalid_origin');
  }
  return { origin: origin.origin, priceId: env.SAGA_TEST_PRICE_ID, taxMode,
    taxCode: env.SAGA_TEST_TAX_CODE, collectTaxIds: env.COMMERCE_COLLECT_TAX_IDS === 'true' };
}

export function client(env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 1, timeout: 10000
  });
}

// Only fixed diagnostic labels are logged. Stripe messages/raw errors can contain credentials.
export function checkoutDiagnostic(error, stage) {
  const types = new Set(['StripeAuthenticationError', 'StripePermissionError', 'StripeInvalidRequestError',
    'StripeAPIError', 'StripeConnectionError', 'StripeRateLimitError', 'StripeIdempotencyError', 'TypeError', 'Error']);
  const codes = new Set(['resource_missing', 'api_key_expired', 'invalid_api_key', 'account_invalid',
    'parameter_unknown', 'parameter_missing', 'parameter_invalid_empty', 'parameter_invalid_integer',
    'parameter_invalid_string_blank', 'idempotency_key_in_use', 'url_invalid', 'rate_limit',
    'secret_key_required', 'permissions_error']);
  const params = new Set(['price', 'expand', 'metadata', 'line_items', 'success_url', 'cancel_url', 'payment_method_types',
    'automatic_tax[enabled]', 'tax_id_collection[enabled]']);
  const type = error?.type || error?.name;
  return { stage, type: types.has(type) ? type : 'unknown',
    code: codes.has(error?.code) ? error.code : 'unspecified',
    status: Number.isInteger(error?.statusCode) && error.statusCode >= 100 && error.statusCode <= 599 ? error.statusCode : null,
    param: params.has(error?.param) ? error.param : null };
}

export async function checkout(request, env, stripe = null) {
  let config;
  try { config = configuration(env); } catch { return json({ error: 'checkout_unavailable' }, 503); }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.headers.get('Origin') !== config.origin || new URL(request.url).origin !== config.origin) {
    return json({ error: 'invalid_origin' }, 403);
  }
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'invalid_content_type' }, 415);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'request_too_large' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'invalid_request' }, 400); }
  if (!body || typeof body !== 'object' || Object.keys(body).some(key => !['lang', 'request_id'].includes(key))
    || !['fr', 'en'].includes(body.lang) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id || '')) {
    return json({ error: 'invalid_request' }, 400);
  }
  let stage = 'initialize_client';
  try {
    stripe ||= client(env);
    stage = 'retrieve_price';
    const price = await stripe.prices.retrieve(config.priceId, { expand: ['product'] });
    if (price.livemode !== false || price.active !== true || price.type !== 'one_time' || price.currency !== 'eur'
      || !Number.isSafeInteger(price.unit_amount) || price.unit_amount <= 0) {
      return json({ error: 'invalid_test_price' }, 503);
    }
    const automaticTax = config.taxMode === 'automatic';
    if (automaticTax) {
      const product = price.product;
      const taxCode = typeof product?.tax_code === 'string' ? product.tax_code : product?.tax_code?.id;
      if (!['inclusive', 'exclusive'].includes(price.tax_behavior) || product?.deleted || product?.active !== true
        || product?.livemode !== false || taxCode !== config.taxCode) return json({ error: 'invalid_tax_configuration' }, 503);
      stage = 'retrieve_tax_setup';
      const [settings, registrations] = await Promise.all([
        stripe.tax.settings.retrieve(), stripe.tax.registrations.list({ status: 'active', limit: 1 })
      ]);
      if (settings.livemode !== false || settings.status !== 'active' || !registrations.data?.some(reg => reg.livemode === false && reg.status === 'active')) {
        return json({ error: 'tax_setup_required' }, 503);
      }
    }
    stage = 'create_checkout';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', locale: body.lang,
      line_items: [{ price: config.priceId, quantity: 1 }],
      billing_address_collection: 'required',
      allow_promotion_codes: false, automatic_tax: { enabled: automaticTax },
      tax_id_collection: { enabled: config.collectTaxIds },
      metadata: { qognito_offer_id: OFFER_ID, qognito_environment: 'test', qognito_lang: body.lang,
        qognito_tax_mode: config.taxMode, ...(automaticTax ? { qognito_tax_code: config.taxCode, qognito_tax_behavior: price.tax_behavior } : {}) },
      success_url: `${config.origin}/commerce-test?lang=${body.lang}&result=return`,
      cancel_url: `${config.origin}/commerce-test?lang=${body.lang}&result=cancel`
    }, { idempotencyKey: `saga-test:${config.priceId}:${config.taxMode}:${config.taxCode || ''}:${config.collectTaxIds}:${body.lang}:${body.request_id}` });
    stage = 'validate_checkout_url';
    const target = new URL(session.url);
    if (session.livemode !== false || target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') {
      return json({ error: 'invalid_checkout_response' }, 502);
    }
    return json({ url: target.href });
  } catch (error) {
    console.warn('commerce_checkout_failed', JSON.stringify(checkoutDiagnostic(error, stage)));
    return json({ error: 'checkout_failed' }, 502);
  }
}

export async function webhook(request, env, stripe = null) {
  let config;
  try { config = configuration(env); } catch { return json({ error: 'webhook_unavailable' }, 503); }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  stripe ||= client(env);
  let event;
  try {
    const payload = await request.text();
    if (payload.length > 262144) return json({ error: 'request_too_large' }, 413);
    event = await stripe.webhooks.constructEventAsync(payload, request.headers.get('Stripe-Signature'),
      env.STRIPE_WEBHOOK_SECRET, 300, Stripe.createSubtleCryptoProvider());
  } catch { return json({ error: 'invalid_signature' }, 400); }
  if (event.livemode !== false) return json({ error: 'live_event_rejected' }, 400);
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return json({ received: true, ignored: true });
  }
  try {
    const already = await env.COMMERCE_DB.prepare('SELECT event_id FROM commerce_events WHERE event_id = ?').bind(event.id).first();
    if (already) return json({ received: true, duplicate: true });
    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items'] });
    if (session.payment_status !== 'paid') return json({ received: true, awaiting_payment: true });
    const items = session.line_items?.data;
    const item = items?.[0];
    const orderTaxMode = session.metadata?.qognito_tax_mode || 'disabled';
    const automaticTax = orderTaxMode === 'automatic';
    const amountTax = session.total_details?.amount_tax;
    const taxBehavior = automaticTax ? session.metadata?.qognito_tax_behavior : null;
    const taxCode = automaticTax ? session.metadata?.qognito_tax_code : null;
    // Use the session's recorded tax mode so in-flight test sessions survive a mode change.
    const validTax = ['disabled', 'automatic'].includes(orderTaxMode)
      && session.automatic_tax?.enabled === automaticTax
      && Number.isSafeInteger(amountTax) && amountTax >= 0
      && item?.amount_tax === amountTax
      && Number.isSafeInteger(session.amount_subtotal) && session.amount_subtotal >= 0
      && item?.amount_subtotal === session.amount_subtotal
      && (automaticTax ? session.automatic_tax.status === 'complete'
        && ['inclusive', 'exclusive'].includes(taxBehavior) && item?.price?.tax_behavior === taxBehavior
        && /^txcd_\d+$/.test(taxCode || '') : amountTax === 0);
    if (session.livemode !== false || session.mode !== 'payment' || session.status !== 'complete'
      || session.metadata?.qognito_offer_id !== OFFER_ID || session.metadata?.qognito_environment !== 'test'
      || !['fr', 'en'].includes(session.metadata?.qognito_lang)
      || session.line_items?.has_more || items?.length !== 1 || items[0].quantity !== 1
      || items[0].price?.id !== config.priceId || items[0].price?.livemode !== false
      || items[0].price?.type !== 'one_time' || items[0].price?.currency !== 'eur'
      || !Number.isSafeInteger(items[0].price?.unit_amount) || items[0].price.unit_amount <= 0
      || !validTax || session.amount_total !== items[0].price.unit_amount + (automaticTax && taxBehavior === 'exclusive' ? amountTax : 0)
      || session.currency !== 'eur' || !Number.isSafeInteger(session.amount_total) || session.amount_total <= 0
      || items[0].amount_total !== session.amount_total
      || session.total_details?.amount_discount !== 0 || session.total_details?.amount_shipping !== 0
      || typeof session.customer_details?.email !== 'string' || session.customer_details.email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.customer_details.email)) {
      return json({ error: 'order_mismatch' }, 400);
    }
    const now = new Date().toISOString();
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntent) return json({ error: 'order_mismatch' }, 400);
    await env.COMMERCE_DB.batch([
      env.COMMERCE_DB.prepare(`INSERT INTO commerce_orders
        (session_id, payment_intent_id, offer_id, price_id, page_language, buyer_email, amount_total, currency, environment, status, created_at,
          amount_subtotal, amount_tax, automatic_tax_enabled, automatic_tax_status, tax_behavior, tax_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'test', 'paid_awaiting_setup', ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO NOTHING`).bind(session.id, paymentIntent, OFFER_ID, config.priceId,
        session.metadata.qognito_lang, session.customer_details.email, session.amount_total, session.currency, now,
        session.amount_subtotal, amountTax, Number(automaticTax), session.automatic_tax.status, taxBehavior, taxCode),
      ...['pdf', 'arbitre'].map(right => env.COMMERCE_DB.prepare(`INSERT INTO commerce_fulfillment
        (session_id, kind, status, created_at) VALUES (?, ?, 'awaiting_setup', ?)
        ON CONFLICT(session_id, kind) DO NOTHING`).bind(session.id, right, now)),
      env.COMMERCE_DB.prepare(`INSERT INTO commerce_events (event_id, session_id, received_at)
        VALUES (?, ?, ?) ON CONFLICT(event_id) DO NOTHING`).bind(event.id, session.id, now)
    ]);
    return json({ received: true });
  } catch { return json({ error: 'order_recording_failed' }, 500); }
}
