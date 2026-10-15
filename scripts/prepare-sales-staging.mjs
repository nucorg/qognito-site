// Prepare an isolated staging deployment. No remote writes and no live mode.
// node scripts/prepare-sales-staging.mjs --account-id ID --database-id ID --origin https://PROJECT.pages.dev [--enable-checkout]
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp, symlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import { OFFER, MEDIATOR_CONTACT } from '../server/commerce/offer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, '.wrangler/sales-staging');
const { values: args } = parseArgs({ options: {
  'account-id': { type: 'string' }, 'database-id': { type: 'string' },
  origin: { type: 'string' }, 'enable-checkout': { type: 'boolean', default: false },
} });
assert.match(args['account-id'] || '', /^[a-f0-9]{32}$/);
assert.match(args['database-id'] || '', /^[a-f0-9-]{36}$/);
const origin = new URL(args.origin);
assert.equal(origin.protocol, 'https:');
assert.match(origin.hostname, /^qognito-commerce-staging(?:-[a-z0-9]+)?\.pages\.dev$/);
assert.equal(origin.href, origin.origin + '/');
const local = parseEnv(await readFile(resolve(root, '.dev.vars.sales'), 'utf8'));
const resend = parseEnv(await readFile(resolve(root, '.env.resend'), 'utf8'));
assert.equal(local.COMMERCE_MODE, 'test');
assert.ok(local.STRIPE_SECRET_KEY?.startsWith('sk_test_'), 'Sandbox Stripe key required');
assert.ok(resend.RESEND_API_KEY?.startsWith('re_'), 'Resend key required');
const pdf = await readFile(resolve(root, OFFER.sourcePath));
assert.equal(createHash('sha256').update(pdf).digest('hex'), OFFER.sha256, 'PDF integrity');
await mkdir(dir, { recursive: true, mode: 0o700 });
let secrets = {};
try { secrets = JSON.parse(await readFile(resolve(dir, 'secrets.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
// Preserve the remote webhook and signing key on every subsequent deployment.
secrets = {
  STRIPE_SECRET_KEY: local.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: secrets.STRIPE_WEBHOOK_SECRET || 'whsec_pending_remote_endpoint',
  COMMERCE_TOKEN_SECRET: secrets.COMMERCE_TOKEN_SECRET || randomBytes(32).toString('hex'),
  RESEND_API_KEY: resend.RESEND_API_KEY,
};
if (args['enable-checkout']) assert.notEqual(secrets.STRIPE_WEBHOOK_SECRET, 'whsec_pending_remote_endpoint');
await writeFile(resolve(dir, 'secrets.json'), JSON.stringify(secrets), { mode: 0o600 });
await writeFile(resolve(dir, 'package.json'), JSON.stringify({ name: 'qognito-commerce-staging', private: true, type: 'module' }));
for (const name of ['dist', 'functions', 'server', 'commerce', 'workers', 'migrations']) {
  await cp(resolve(root, name), resolve(dir, name), { recursive: true });
}
try { await symlink(resolve(root, 'node_modules'), resolve(dir, 'node_modules'), 'dir'); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
// The disposable staging copy must not be indexed by search engines.
await writeFile(resolve(dir, 'dist/robots.txt'), 'User-agent: *\nDisallow: /\n');
const headers = await readFile(resolve(root, 'dist/_headers'), 'utf8');
await writeFile(resolve(dir, 'dist/_headers'), headers + '\n/*\n  X-Robots-Tag: noindex, noarchive\n');
const pages = JSON.parse(await readFile(resolve(root, 'wrangler.sales.example.jsonc'), 'utf8'));
// Pages takes the account from CLOUDFLARE_ACCOUNT_ID, not its configuration file.
pages.vars.COMMERCE_ORIGIN = origin.origin;
pages.vars.COMMERCE_CHECKOUT_ENABLED = String(args['enable-checkout']);
pages.vars.COMMERCE_MEDIATOR = MEDIATOR_CONTACT;
for (const key of ['SAGA_PRICE_ID', 'SAGA_TAX_RATE_ID', 'STRIPE_PAYMENT_METHOD_CONFIGURATION']) {
  assert.ok(local[key], `${key} required`);
  pages.vars[key] = local[key];
}
pages.d1_databases[0].database_id = args['database-id'];
await writeFile(resolve(dir, 'wrangler.json'), JSON.stringify(pages, null, 2) + '\n');
const jobs = JSON.parse(await readFile(resolve(root, 'wrangler.jobs.example.jsonc'), 'utf8'));
jobs.account_id = args['account-id'];
jobs.vars.COMMERCE_ORIGIN = origin.origin;
jobs.vars.COMMERCE_MEDIATOR = MEDIATOR_CONTACT;
jobs.d1_databases[0].database_id = args['database-id'];
jobs.workers_dev = false;
jobs.preview_urls = false;
await writeFile(resolve(dir, 'wrangler.jobs.json'), JSON.stringify(jobs, null, 2) + '\n');
console.log(JSON.stringify({ environment: 'test', directory: dir, origin: origin.origin, checkout_enabled: args['enable-checkout'], pdf_sha256: OFFER.sha256 }));
