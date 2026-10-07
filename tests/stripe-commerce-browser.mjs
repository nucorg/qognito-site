import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

// Lancer d'abord Wrangler avec COMMERCE_MODE=test, sans clé Stripe configurée.
const origin = process.env.LOCAL_COMMERCE_ORIGIN || 'http://localhost:8788';
const browser = await chromium.launch(existsSync('/opt/google/chrome/chrome') ? { executablePath: '/opt/google/chrome/chrome' } : {});
try {
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const lang of ['fr', 'en']) {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(`${origin}/commerce-test?lang=${lang}`);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.ok(response.headers()['x-robots-tag'].includes('noindex'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const checkoutResponse = page.waitForResponse(r => r.url().endsWith('/api/commerce/checkout'));
    await page.getByRole('button').click();
    assert.equal((await checkoutResponse).status(), 503, 'Cette recette suppose une configuration Stripe absente.');
    await page.locator('#message').waitFor({ state: 'visible' });
    assert.ok((await page.locator('#message').textContent()).length > 10);
    assert.equal(await page.getByRole('button').isEnabled(), true);
    await page.screenshot({ path: `/tmp/qognito-stripe-${lang}-mobile.png`, fullPage: true });
    await page.getByRole('link', { name: lang === 'fr' ? 'EN' : 'FR', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), lang === 'fr' ? 'en' : 'fr');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${origin}/commerce-test?lang=${lang}&result=return`);
    assert.ok((await page.locator('main').textContent()).includes(lang === 'fr' ? 'vérification de la notification' : 'verification of the payment notification'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `/tmp/qognito-stripe-${lang}-desktop.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('OK : page Stripe de test FR/EN, mobile/desktop, navigation, erreur de configuration récupérable, aucune erreur JS.');
} finally { await browser.close(); }
