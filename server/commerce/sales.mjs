import Stripe from 'stripe';
import { checkoutDiagnostic } from './stripe.mjs';
import { OFFER, termsText } from './offer.mjs';
const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);
export const securityHeaders = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, noarchive', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { ...securityHeaders, 'Content-Type': 'application/json', ...headers } });
const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
export const digest = async value => hex(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? encoder.encode(value) : value));
const b64 = value => btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const un64 = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
async function key(env) { return crypto.subtle.importKey('raw', encoder.encode(env.COMMERCE_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
export async function sign(env, payload) {
 const text = b64(encoder.encode(JSON.stringify(payload)));
 return `${text}.${b64(await crypto.subtle.sign('HMAC', await key(env), encoder.encode(text)))}`;
}
export async function verify(env, token, scope) {
 try {
  if (typeof token !== 'string' || token.length > 1024) return null;
  const [text, signature, extra] = token.split('.');
  if (extra || !await crypto.subtle.verify('HMAC', await key(env), un64(signature), encoder.encode(text))) return null;
  const data = JSON.parse(new TextDecoder().decode(un64(text)));
  return data.scope === scope && data.exp > now() && /^[a-f0-9-]{36}$/.test(data.id) ? data : null;
 } catch { return null; }
}
export function config(env, purchasing = false) {
 if (!['test', 'live'].includes(env.COMMERCE_MODE) || !env.COMMERCE_DB || !env.COMMERCE_PDF
     || (env.COMMERCE_TOKEN_SECRET || '').length < 32) throw new Error('configuration');
 const live = env.COMMERCE_MODE === 'live';
 if (!env.STRIPE_SECRET_KEY?.startsWith(live ? 'sk_live_' : 'sk_test_') || !env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) throw new Error('credentials');
 const url = new URL(env.COMMERCE_ORIGIN);
 if (url.pathname !== '/' || url.search || url.hash || url.username || url.password || !['https:', 'http:'].includes(url.protocol)
     || (url.protocol !== 'https:' && (live || !['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('origin');
 if (purchasing) {
  if (env.COMMERCE_CHECKOUT_ENABLED !== 'true' || !/^price_/.test(env.SAGA_PRICE_ID || '') || !/^txr_/.test(env.SAGA_TAX_RATE_ID || '')
      || !/^pmc_/.test(env.STRIPE_PAYMENT_METHOD_CONFIGURATION || '')) throw new Error('closed');
  if (live && (env.COMMERCE_LIVE_APPROVED !== OFFER.termsVersion || !env.COMMERCE_PHONE || !env.COMMERCE_MEDIATOR
      || /REPLACE|renseigner/i.test(env.COMMERCE_MEDIATOR) || !env.RESEND_API_KEY?.startsWith('re_') || !env.COMMERCE_FROM || env.COMMERCE_PDF_APPROVED_SHA256 !== OFFER.sha256)) throw new Error('not_approved');
 }
 return { live, origin: url.origin };
}
const client = env => new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 1, timeout: 10000 });
const query = (env, sql, ...args) => env.COMMERCE_DB.prepare(sql).bind(...args);
export const orderById = (env, id) => query(env, 'SELECT * FROM sales_orders WHERE id = ?', id).first();
export function metropolitan(address) {
 return address?.country === 'FR' && /^(?:0[1-9]|[1-8][0-9]|9[0-5])\d{3}$/.test(address?.postal_code || '')
  && typeof address.city === 'string' && address.city.trim().length > 0
  && typeof address.line1 === 'string' && address.line1.trim().length > 0;
}
async function limitedBody(request, max) {
 if (Number(request.headers.get('Content-Length')) > max) throw new Error('body');
 const reader = request.body?.getReader(); if (!reader) throw new Error('body');
 const chunks = []; let size = 0;
 while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new Error('body'); } chunks.push(value); }
 const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
 return new TextDecoder().decode(bytes);
}
async function throttle(request, env) {
 const minute = Math.floor(now() / 60);
 const hash = await digest(`${env.COMMERCE_TOKEN_SECRET}:${request.headers.get('CF-Connecting-IP') || 'local'}:${minute}`);
 const row = await query(env, `INSERT INTO sales_rate_limits(key,count,expires_at) VALUES (?,1,?)
 ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count`, hash, now() + 120).first();
 return row.count <= 10;
}
export async function checkout(request, env, stripe = null) {
 let cfg; try { cfg = config(env, true); } catch { return json({ error: 'checkout_unavailable' }, 503); }
 if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
 if (request.headers.get('Origin') !== cfg.origin || new URL(request.url).origin !== cfg.origin) return json({ error: 'invalid_origin' }, 403);
 if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'invalid_content_type' }, 415);
 let body; try { body = JSON.parse(await limitedBody(request, 4096)); } catch { return json({ error: 'invalid_request' }, 400); }
 const fields = ['request_id', 'edition', 'buyer_kind', 'name', 'company', 'terms_version', 'accept_terms', 'immediate_delivery', 'acknowledge_withdrawal', 'country', 'postal_code'];
 if (!body || typeof body !== 'object' || Object.keys(body).some(k => !fields.includes(k))
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id || '')
    || body.edition !== OFFER.edition || body.terms_version !== OFFER.termsVersion
    || !['individual', 'business'].includes(body.buyer_kind) || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 160
    || typeof body.company !== 'string' || body.company.length > 160 || (body.buyer_kind === 'business' && !body.company.trim())
    || !['accept_terms', 'immediate_delivery', 'acknowledge_withdrawal'].every(k => body[k] === true)) return json({ error: 'invalid_request' }, 400);
 if (!metropolitan({ country: body.country, postal_code: body.postal_code, city: '-', line1: '-' })) return json({ error: 'market_unavailable' }, 400);
 try {
  if (!await throttle(request, env)) return json({ error: 'too_many_requests' }, 429);
  const pdf = await env.COMMERCE_PDF.get(OFFER.pdfKey);
  if (!pdf || await digest(await pdf.arrayBuffer()) !== OFFER.sha256) return json({ error: 'pdf_unavailable' }, 503);
  stripe ||= client(env);
  const [price, tax, methods] = await Promise.all([stripe.prices.retrieve(env.SAGA_PRICE_ID, { expand: ['product'] }), stripe.taxRates.retrieve(env.SAGA_TAX_RATE_ID), stripe.paymentMethodConfigurations.retrieve(env.STRIPE_PAYMENT_METHOD_CONFIGURATION)]);
  if (price.livemode !== cfg.live || !price.active || price.type !== 'one_time' || price.currency !== 'eur' || price.unit_amount !== OFFER.amount
      || price.tax_behavior !== 'inclusive' || price.product?.active !== true || price.product?.metadata?.qognito_edition !== OFFER.edition
      || tax.livemode !== cfg.live || !tax.active || tax.percentage !== 5.5 || !tax.inclusive || tax.country !== 'FR') return json({ error: 'invalid_offer_configuration' }, 503);
  // Configuration is verified at runtime, not merely assumed from its Dashboard name.
  const enabled = Object.entries(methods).filter(([, v]) => v && typeof v === 'object' && v.display_preference?.value === 'on').map(([k]) => k);
  if (!methods.active || methods.livemode !== cfg.live || !enabled.includes('card') || enabled.some(k => !['card', 'apple_pay', 'google_pay'].includes(k))) return json({ error: 'invalid_payment_methods' }, 503);
  const requestHash = await digest(JSON.stringify(body));
  const id = crypto.randomUUID(); const timestamp = now();
  await query(env, `INSERT INTO sales_orders(id,request_id,request_hash,environment,offer_id,edition_id,pdf_key,pdf_sha256,price_id,tax_rate_id,terms_version,terms_text,consent_at,buyer_kind,buyer_name,company_name,created_at,updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING`, id, body.request_id, requestHash, env.COMMERCE_MODE,
   OFFER.id, OFFER.edition, OFFER.pdfKey, OFFER.sha256, price.id, tax.id, OFFER.termsVersion, termsText(env), timestamp,
   body.buyer_kind, body.name.trim(), body.company.trim(), timestamp, timestamp).run();
  let order = await query(env, 'SELECT * FROM sales_orders WHERE request_id = ?', body.request_id).first();
  if (order.request_hash !== requestHash || order.environment !== env.COMMERCE_MODE) return json({ error: 'request_conflict' }, 409);
  if (order.status !== 'created') return json({ error: 'order_already_processed' }, 409);
  // Stripe's idempotency retention is finite: never create a second session after 23 h.
  if (now() - order.created_at > 23 * 3600) return json({ error: 'request_expired' }, 409);
  const session = order.session_id ? await stripe.checkout.sessions.retrieve(order.session_id) : await stripe.checkout.sessions.create({
   mode: 'payment', locale: 'fr', client_reference_id: order.id,
   line_items: [{ price: order.price_id, quantity: 1, tax_rates: [order.tax_rate_id] }],
   payment_method_configuration: env.STRIPE_PAYMENT_METHOD_CONFIGURATION,
   payment_intent_data: { capture_method: 'manual', metadata: { qognito_order_id: order.id } },
   billing_address_collection: 'required', customer_creation: 'always', automatic_tax: { enabled: false },
   allow_promotion_codes: false, adaptive_pricing: { enabled: false },
   metadata: { qognito_order_id: order.id, qognito_edition: order.edition_id, qognito_environment: order.environment },
   success_url: `${cfg.origin}/achat/confirmation/`, cancel_url: `${cfg.origin}/formations/saga-ia/volume-1/?annulation=1`
  }, { idempotencyKey: `qognito-sale:${order.id}` });
  const target = new URL(session.url);
  if (session.livemode !== cfg.live || session.status !== 'open' || target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') return json({ error: 'session_unavailable' }, 409);
  await query(env, 'UPDATE sales_orders SET session_id=?,updated_at=? WHERE id=?', session.id, now(), order.id).run();
  const token = await sign(env, { scope: 'order', id: order.id, exp: now() + 24 * 3600 });
  return json({ url: target.href }, 200, { 'Set-Cookie': `qognito_order=${token}; Path=/api/commerce; HttpOnly; SameSite=Lax; Max-Age=86400${cfg.origin.startsWith('https:') ? '; Secure' : ''}` });
 } catch (error) { console.warn('sale_checkout_failed', JSON.stringify(checkoutDiagnostic(error, 'sale_checkout'))); return json({ error: 'checkout_failed' }, 502); }
}
async function lock(env, id) {
 const r = await query(env, 'UPDATE sales_orders SET lease_until=? WHERE id=? AND lease_until < ? RETURNING id', now() + 120, id, now()).first();
 return !!r;
}
export async function reconcile(env, id, stripe = null) {
 const cfg = config(env); stripe ||= client(env);
 if (!await lock(env, id)) throw new Error('busy');
 try {
  let order = await orderById(env, id);
  if (!order?.session_id || order.environment !== env.COMMERCE_MODE) return;
  const session = await stripe.checkout.sessions.retrieve(order.session_id, { expand: ['line_items.data.price', 'payment_intent.latest_charge', 'invoice'] });
  const item = session.line_items?.data?.[0]; const pi = session.payment_intent;
  if (session.status === 'expired') { await query(env, "UPDATE sales_orders SET status='expired',updated_at=? WHERE id=? AND status='created'", now(), id).run(); return; }
  if (session.status !== 'complete') return;
  if (session.livemode !== cfg.live || session.mode !== 'payment' || session.metadata?.qognito_order_id !== id
      || session.metadata?.qognito_edition !== order.edition_id || session.metadata?.qognito_environment !== order.environment
      || session.line_items?.has_more || session.line_items?.data?.length !== 1 || item.quantity !== 1
      || item.price?.id !== order.price_id || item.price?.unit_amount !== order.amount_total || item.price?.currency !== 'eur'
      || item.price?.livemode !== cfg.live || item.price?.tax_behavior !== 'inclusive'
      || session.amount_total !== order.amount_total || session.currency !== 'eur' || session.total_details?.amount_tax !== order.amount_tax
      || session.total_details?.amount_discount !== 0 || session.total_details?.amount_shipping !== 0
      || !pi || pi.livemode !== cfg.live || pi.amount !== order.amount_total || pi.currency !== 'eur'
      || pi.metadata?.qognito_order_id !== id || pi.capture_method !== 'manual') throw new Error('order_mismatch');
  if (!metropolitan(session.customer_details?.address) || session.customer_details?.tax_exempt === 'exempt'
      || session.customer_details?.tax_exempt === 'reverse' || pi.payment_method_types?.some(type => type !== 'card')) {
   if (pi.status === 'requires_capture') await stripe.paymentIntents.cancel(pi.id, {}, { idempotencyKey: `market-cancel:${id}` });
   await query(env, "UPDATE sales_orders SET status='market_rejected',updated_at=? WHERE id=?", now(), id).run(); return;
  }
  if (pi.status === 'requires_capture') {
   await query(env, "UPDATE sales_orders SET status='authorized',payment_intent_id=?,updated_at=? WHERE id=?", pi.id, now(), id).run();
   await stripe.paymentIntents.capture(pi.id, { amount_to_capture: order.amount_total }, { idempotencyKey: `capture:${id}` });
   return; // Only a subsequent authoritative paid state grants access.
  }
  if (pi.status === 'canceled') { await query(env, "UPDATE sales_orders SET status='canceled',updated_at=? WHERE id=?", now(), id).run(); return; }
  if (pi.status !== 'succeeded' || session.payment_status !== 'paid' || pi.amount_received !== order.amount_total) return;
  const email = session.customer_details?.email;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email');
  const charge = pi.latest_charge;
  if (!charge || typeof charge !== 'object' || !Number.isInteger(charge.amount_refunded)) throw new Error('charge');
  const refunded = charge.amount_refunded;
  // Both partial and full refunds are reconciled from current Stripe state.
  let blockedByDispute = false;
  if (charge.disputed && refunded < order.amount_total) {
   if (!charge.id) throw new Error('charge_id');
   const disputes = await stripe.disputes.list({ charge: charge.id, limit: 100 });
   // Charge.disputed remains true after resolution: inspect current dispute status.
   blockedByDispute = !disputes.data.length || disputes.has_more || disputes.data.some(d => !['won', 'warning_closed', 'prevented'].includes(d.status));
  }
  const status = refunded >= order.amount_total ? 'refunded' : blockedByDispute ? 'disputed' : 'paid';
  const invoiceUrl = typeof session.invoice === 'object' ? session.invoice?.hosted_invoice_url || null : null;
  await query(env, `UPDATE sales_orders SET status=?,payment_intent_id=?,buyer_email=?,stripe_customer_id=?,amount_refunded=?,invoice_url=COALESCE(?,invoice_url),
    paid_at=COALESCE(paid_at,?),download_until=COALESCE(download_until,?),updated_at=? WHERE id=?`, status, pi.id, email, typeof session.customer === 'string' ? session.customer : session.customer?.id || null, refunded, invoiceUrl, now(), now() + 7 * 86400, now(), id).run();
 } finally { await query(env, 'UPDATE sales_orders SET lease_until=0 WHERE id=?', id).run(); }
}
const events = new Set(['checkout.session.completed', 'checkout.session.expired', 'payment_intent.succeeded', 'payment_intent.amount_capturable_updated', 'payment_intent.canceled', 'charge.refunded', 'charge.dispute.created', 'charge.dispute.closed', 'refund.updated', 'refund.failed', 'invoice.paid']);
export async function webhook(request, env, stripe = null) {
 let cfg; try { cfg = config(env); } catch { return json({ error: 'webhook_unavailable' }, 503); }
 if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
 stripe ||= client(env); let event;
 try { event = await stripe.webhooks.constructEventAsync(await limitedBody(request, 262144), request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET, 300, Stripe.createSubtleCryptoProvider()); }
 catch { return json({ error: 'invalid_signature' }, 400); }
 if (event.livemode !== cfg.live) return json({ error: 'environment_mismatch' }, 400);
 if (!events.has(event.type)) return json({ received: true, ignored: true });
 try {
  if (await query(env, 'SELECT event_id FROM sales_events WHERE event_id=?', event.id).first()) return json({ received: true });
  const object = event.data.object;
  let id = object.metadata?.qognito_order_id;
  if (!id && object.payment_intent) id = (await query(env, 'SELECT id FROM sales_orders WHERE payment_intent_id=?', typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent.id).first())?.id;
  if (!id && object.charge) {
   const charge = await stripe.charges.retrieve(typeof object.charge === 'string' ? object.charge : object.charge.id);
   id = (await query(env, 'SELECT id FROM sales_orders WHERE payment_intent_id=?', typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id).first())?.id;
  }
  if (!id) return json({ received: true, unrelated: true });
  const order = await orderById(env, id);
  if (!order) return json({ error: 'order_missing' }, 503);
  // Recover a session whose API response was lost before local persistence.
  if (!order.session_id && object.object === 'checkout.session') await query(env, 'UPDATE sales_orders SET session_id=? WHERE id=?', object.id, id).run();
  await reconcile(env, id, stripe);
  await query(env, 'INSERT INTO sales_events(event_id,order_id,received_at) VALUES (?,?,?) ON CONFLICT(event_id) DO NOTHING', event.id, id, now()).run();
  return json({ received: true });
 } catch { return json({ error: 'processing_failed' }, 500); }
}
export async function downloadLink(env, order) {
 return `${new URL(env.COMMERCE_ORIGIN).origin}/api/commerce/download?token=${await sign(env, { scope: 'download', id: order.id, version: order.download_version, exp: order.download_until })}`;
}
export async function orderStatus(request, env) {
 if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
 try {
  config(env);
  const token = request.headers.get('Cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('qognito_order='))?.slice(14);
  const data = await verify(env, token, 'order'); if (!data) return json({ error: 'order_access_required' }, 401);
  const order = await orderById(env, data.id);
  if (!order || order.environment !== env.COMMERCE_MODE) return json({ error: 'not_found' }, 404);
  const available = order.status === 'paid' && order.download_until > now();
  return json({ reference: order.id, status: order.status, amount: order.amount_total, refunded: order.amount_refunded,
   email_status: order.email_status, download_url: available ? await downloadLink(env, order) : null, invoice_url: order.invoice_url });
 } catch { return json({ error: 'status_unavailable' }, 503); }
}
export async function download(request, env) {
 if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
 try {
  config(env); const data = await verify(env, new URL(request.url).searchParams.get('token'), 'download');
  if (!data) return json({ error: 'link_expired_or_invalid' }, 403);
  const order = await orderById(env, data.id);
  if (!order || order.environment !== env.COMMERCE_MODE || order.status !== 'paid' || order.download_version !== data.version || order.download_until < now()) return json({ error: 'access_unavailable' }, 403);
  const object = await env.COMMERCE_PDF.get(order.pdf_key);
  if (!object) return json({ error: 'file_unavailable' }, 503);
  // The bounded PDF is verified on every delivery, not just via editable R2 metadata.
  const bytes = await object.arrayBuffer(); if (await digest(bytes) !== order.pdf_sha256) return json({ error: 'file_integrity' }, 503);
  if (request.method === 'GET') await query(env, 'UPDATE sales_orders SET downloads=downloads+1,last_download_at=? WHERE id=?', now(), order.id).run();
  return new Response(request.method === 'HEAD' ? null : bytes, { headers: { ...securityHeaders, 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.byteLength), 'Content-Disposition': `attachment; filename="${order.pdf_key.split('/').at(-1)}"` } });
 } catch { return json({ error: 'delivery_unavailable' }, 503); }
}
export async function runJobs(env, stripe = null, send = fetch) {
 config(env); stripe ||= client(env);
 await query(env, 'DELETE FROM sales_rate_limits WHERE expires_at < ?', now()).run();
 const result = await query(env, `SELECT id FROM sales_orders WHERE environment=? AND session_id IS NOT NULL
 AND status IN ('created','authorized','paid','disputed') AND next_attempt_at<=? AND lease_until<? ORDER BY next_attempt_at LIMIT 25`, env.COMMERCE_MODE, now(), now()).all();
 for (const { id } of result.results) {
  try {
   await reconcile(env, id, stripe);
   if (!await lock(env, id)) continue;
   try {
    let order = await orderById(env, id);
    if (order.renew_requested && order.status === 'paid') {
     await query(env, "UPDATE sales_orders SET download_until=?,download_version=download_version+1,email_status='pending',email_id=NULL,job_attempts=0,renew_requested=0 WHERE id=?", now() + 7 * 86400, id).run();
     order = await orderById(env, id);
    }
    if (order.status === 'paid' && !order.invoice_url) {
     await ensureInvoice(env, order, stripe);
     order = await orderById(env, id);
    }
    if (order.status === 'paid' && order.email_status !== 'accepted') {
     if (!env.RESEND_API_KEY || !env.COMMERCE_FROM) throw new Error('email_configuration');
     if (order.download_until <= now()) throw new Error('renewal_required');
     const text = `Bonjour ${order.buyer_name},\n\nVotre commande ${order.id} est confirmée.\n${OFFER.title}\nÉdition : ${order.edition_id}\nMontant : 49,99 € TTC (TVA incluse : 2,61 €).\n\nTélécharger votre PDF (lien valable sept jours à compter de l'activation) :\n${await downloadLink(env, order)}\n\n${order.invoice_url ? `Facture : ${order.invoice_url}\n` : 'Votre justificatif Stripe vous sera adressé séparément.\n'}\nVous avez accepté les conditions, demandé expressément la fourniture immédiate et reconnu la perte du droit de rétractation dès le début de la fourniture, le ${new Date(order.consent_at * 1000).toISOString()}.\n\n${order.terms_text}\n\nAssistance et renouvellement du lien : contact@qognito.io`;
     const response = await send('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `delivery-${order.id}-${order.download_version}` },
      body: JSON.stringify({ from: env.COMMERCE_FROM, to: [order.buyer_email], reply_to: 'contact@qognito.io', subject: `Votre PDF SAGA-IA — commande ${order.id.slice(0, 8)}`, text }) });
     if (!response.ok) throw new Error('email_provider');
     const data = await response.json(); if (!data.id) throw new Error('email_response');
     await query(env, "UPDATE sales_orders SET email_status='accepted',email_id=?,last_error=NULL WHERE id=?", data.id, id).run();
    }
    await query(env, 'UPDATE sales_orders SET next_attempt_at=?,job_attempts=0,last_error=NULL WHERE id=?', now() + (order.status === 'paid' ? 86400 : 300), id).run();
   } finally { await query(env, 'UPDATE sales_orders SET lease_until=0 WHERE id=?', id).run(); }
  } catch {
   const order = await orderById(env, id);
   const attempts = (order?.job_attempts || 0) + 1;
   await query(env, "UPDATE sales_orders SET job_attempts=?,next_attempt_at=?,last_error='retry_required' WHERE id=?", attempts, now() + Math.min(3600, 30 * 2 ** Math.min(attempts, 7)), id).run();
   if (attempts >= 5) console.error('commerce_job_attention', JSON.stringify({ order: id, attempts }));
  }
 }
}
export async function availability(request, env) {
 let enabled = false; try { config(env, true); enabled = true; } catch {}
 return json({ enabled, test: env.COMMERCE_MODE === 'test', terms_version: OFFER.termsVersion });
}
export async function terms(request, env) { return new Response(termsText(env), { headers: { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' } }); }

// Checkout post-payment invoicing is incompatible with manual capture. Create a
// non-collecting invoice after capture, then attach the already settled payment.
export async function ensureInvoice(env, order, stripe) {
 if (!order.stripe_customer_id || !order.payment_intent_id) throw new Error('invoice_customer');
 let invoice;
 if (order.buyer_kind === 'business' && order.company_name) await stripe.customers.update(order.stripe_customer_id, { name: order.company_name });
 if (order.invoice_id) invoice = await stripe.invoices.retrieve(order.invoice_id);
 else {
  // Recover a successful create whose response was lost, including after 24 h.
  for await (const candidate of stripe.invoices.list({ customer: order.stripe_customer_id, limit: 100 })) {
   if (candidate.metadata?.qognito_order_id === order.id) { invoice = candidate; break; }
  }
  invoice ||= await stripe.invoices.create({customer:order.stripe_customer_id,collection_method:'send_invoice',days_until_due:0,
   auto_advance:false,pending_invoice_items_behavior:'exclude',automatic_tax:{enabled:false},
   metadata:{qognito_order_id:order.id},description:OFFER.title}, {idempotencyKey:`invoice:${order.id}`});
  await query(env, 'UPDATE sales_orders SET invoice_id=? WHERE id=?', invoice.id, order.id).run();
 }
 if (invoice.status === 'draft') {
  const lines = await stripe.invoices.listLineItems(invoice.id, {limit:100});
  if (lines.data.length === 0) await stripe.invoiceItems.create({customer:order.stripe_customer_id,invoice:invoice.id,
   pricing:{price:order.price_id},quantity:1,tax_rates:[order.tax_rate_id]}, {idempotencyKey:`invoice-line:${order.id}`});
  invoice = await stripe.invoices.finalizeInvoice(invoice.id,{auto_advance:false},{idempotencyKey:`invoice-final:${order.id}`});
 }
 if (invoice.total !== order.amount_total || invoice.currency !== 'eur' || invoice.livemode !== (order.environment === 'live')) throw new Error('invoice_total');
 if (invoice.status !== 'paid') invoice=await stripe.invoices.attachPayment(invoice.id,{payment_intent:order.payment_intent_id},{idempotencyKey:`invoice-payment:${order.id}`});
 if (invoice.status !== 'paid' || !invoice.hosted_invoice_url) throw new Error('invoice_unpaid');
 await query(env,'UPDATE sales_orders SET invoice_url=? WHERE id=?',invoice.hosted_invoice_url,order.id).run();
}
