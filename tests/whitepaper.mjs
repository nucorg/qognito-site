import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const sandbox = await mkdtemp(join(tmpdir(), 'qognito-whitepaper-test-'));
const fixture = join(sandbox, 'site');
const frenchPath = '/livres-blancs/la-facture-fantome-ia/';
const editions = {
  fr: { pdfPath: '/livres-blancs/la-facture-fantome-ia-v2.pdf', version: '2.0' },
  en: { pdfPath: '/livres-blancs/the-ai-costs-you-dont-see-en-v3.pdf', version: '3.0' },
  es: { pdfPath: '/livres-blancs/la-factura-fantasma-ia-v1.pdf', version: '1.0' },
};
const prefixes = { fr: '', en: '/en', es: '/es' };
const browser = await chromium.launch({
  ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : existsSync('/opt/google/chrome/chrome') ? { executablePath: '/opt/google/chrome/chrome' } : {}),
});
let server;
let checks = 0;
const check = (message) => { checks++; console.log(`OK ${message}`); };
try {
  await cp(root, fixture, { recursive: true, filter: (path) => {
    const first = relative(root, path).split('/')[0];
    return !['node_modules', '.git', '.astro', 'dist'].includes(first) && !first.startsWith('.env');
  }});
  await symlink(join(root, 'node_modules'), join(fixture, 'node_modules'), 'dir');
  const baseEnv = { ...process.env, PUBLIC_WHITEPAPER_ENABLED: 'false', PUBLIC_WEB3FORMS_ACCESS_KEY: '', PUBLIC_MAIL_PROVIDER: '', PUBLIC_MAIL_LOCATION: '', PUBLIC_MAIL_SAFEGUARDS: '' };
  const build = (env, expected = 0) => {
    const result = spawnSync('npm', ['run', 'build'], { cwd: fixture, env, encoding: 'utf8', timeout: 60000 });
    assert.equal(result.status, expected, result.stdout + result.stderr);
  };
  build(baseEnv);
  for (const path of [frenchPath, '/en' + frenchPath, '/es' + frenchPath]) {
    const inactive = await readFile(join(fixture, 'dist', path, 'index.html'), 'utf8');
    assert.ok(!inactive.includes('id="whitepaper-form"'));
    assert.ok(!inactive.includes('name="access_key"'));
  }
  check('Sans configuration : aucun formulaire ni clé dans le HTML.');
  build({ ...baseEnv, PUBLIC_WHITEPAPER_ENABLED: 'true' }, 1);
  check('Activation incomplète : build refusé.');

  const pdfPage = await browser.newPage();
  await mkdir(join(fixture, 'public/livres-blancs'), { recursive: true });
  for (const [lang, edition] of Object.entries(editions)) {
    await pdfPage.setContent(`<h1>PDF de test ${lang} — version ${edition.version}</h1>`);
    await pdfPage.pdf({ path: join(fixture, 'public', edition.pdfPath) });
  }
  await pdfPage.close();
  const activeEnv = { ...baseEnv, PUBLIC_WHITEPAPER_ENABLED: 'true', PUBLIC_WEB3FORMS_ACCESS_KEY: '00000000-0000-4000-8000-000000000000', PUBLIC_MAIL_PROVIDER: 'Messagerie de test', PUBLIC_MAIL_LOCATION: 'UE (test)', PUBLIC_MAIL_SAFEGUARDS: 'Configuration de test' };
  for (const [lang, { pdfPath }] of Object.entries(editions)) {
    const path = join(fixture, 'public', pdfPath);
    const original = await readFile(path);
    await rm(path);
    build(activeEnv, 1);
    await writeFile(path, 'Not a PDF');
    build(activeEnv, 1);
    await writeFile(path, original);
    check(`PDF ${lang} absent ou invalide : activation refusée même si l’autre PDF est disponible.`);
  }
  build(activeEnv);

  const dist = join(fixture, 'dist');
  for (const path of ['/en/', '/en/formations/', '/en' + frenchPath, '/es/', '/es/formations/', '/es' + frenchPath]) {
    const html = await readFile(join(dist, path, 'index.html'), 'utf8');
    if (path.startsWith('/es')) assert.ok(html.includes('La factura fantasma de la IA'), `Titre espagnol absent de ${path}`);
    else {
      assert.ok(!/phantom/i.test(html), `Ancien titre présent dans ${path}`);
      assert.ok(html.includes('The AI Costs You Don’t See'), `Nouveau titre absent de ${path}`);
    }
  }
  assert.ok(!existsSync(join(dist, 'livres-blancs/ais-phantom-bill-en-v1.pdf')));
  assert.ok(!existsSync(join(dist, 'livres-blancs/the-ai-costs-you-dont-see-en-v2.pdf')));
  const redirects = await readFile(join(dist, '_redirects'), 'utf8');
  assert.ok(redirects.includes('/livres-blancs/ais-phantom-bill-en-v1.pdf /livres-blancs/the-ai-costs-you-dont-see-en-v3.pdf 301'));
  assert.ok(redirects.includes('/livres-blancs/the-ai-costs-you-dont-see-en-v2.pdf /livres-blancs/the-ai-costs-you-dont-see-en-v3.pdf 301'));
  check('Titre anglais harmonisé ; ancien PDF retiré du build et règle de redirection présente.');
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let path = resolve(dist, `.${decodeURIComponent(url.pathname)}`);
      if (!path.startsWith(dist + '/') && path !== dist) throw new Error();
      if (!extname(path)) path = join(path, 'index.html');
      const bytes = await readFile(path);
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.pdf': 'application/pdf' };
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
      res.end(bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const spanishRoutes = [
    '/es/', '/es/blog/', '/es/graphe-des-procedes/', '/es/formations/', '/es/parcours/',
    '/es/encodeur/', '/es/livres-blancs/la-facture-fantome-ia/', '/es/mentions-legales/', '/es/confidentialite/',
  ];
  for (const route of spanishRoutes) {
    const response = await page.goto(origin + route);
    assert.equal(response.status(), 200, `Route ES indisponible : ${route}`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'es', `Langue HTML incorrecte : ${route}`);
    const canonicalPath = new URL(await page.locator('link[rel=canonical]').getAttribute('href')).pathname.replace(/\/$/, '') || '/';
    assert.equal(canonicalPath, route.replace(/\/$/, '') || '/');
    assert.ok(await page.locator('.language-switcher a[hreflang="es"][aria-current="page"]').count());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Débordement mobile : ${route}`);
  }
  await page.goto(origin + '/es/confidentialite/');
  assert.ok(await page.locator('.language-switcher a[href="/en/"]').count());
  assert.equal(await page.locator('.footer-legal-links a').nth(0).getAttribute('href'), '/es/mentions-legales');
  await page.setViewportSize({ width: 1280, height: 1000 });
  check('Neuf routes ES, métadonnées, sélecteur trilingue, liens juridiques et rendu mobile contrôlés.');
  let requests = [];
  let mode = 'success';
  await page.route('https://api.web3forms.com/submit', async route => {
    requests.push(route.request().postDataJSON());
    if (mode === 'network') return route.abort();
    if (mode === 'slow') await new Promise(done => setTimeout(done, 300));
    if (mode === 'html') return route.fulfill({ status: 503, contentType: 'text/html', body: 'Unavailable' });
    return route.fulfill({ status: mode === 'http' ? 403 : 200, contentType: 'application/json', body: JSON.stringify({ success: !['http', 'refused'].includes(mode) }) });
  });
  for (const lang of ['fr', 'en', 'es']) {
    requests = [];
    mode = 'success';
    const { pdfPath, version } = editions[lang];
    const pagePath = prefixes[lang] + frenchPath;
    const failureText = lang === 'en' ? 'could not confirm' : lang === 'es' ? 'confirmar el envío' : 'pas pu';
    const load = async (suffix = '') => {
      await page.goto(origin + pagePath + suffix);
      await page.waitForFunction(() => !document.querySelector('#submit-lead').disabled);
    };
    await page.goto(origin + prefixes[lang] + '/');
    await page.locator('.whitepaper-callout a').click();
    assert.equal(new URL(page.url()).pathname, pagePath);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    const nextLang = lang === 'fr' ? 'es' : lang === 'es' ? 'fr' : 'es';
    await page.locator(`.language-switcher a[hreflang="${nextLang}"]`).click();
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ''), (prefixes[nextLang] + frenchPath).replace(/\/$/, ''));
    assert.equal(await page.locator('html').getAttribute('lang'), nextLang);
    await page.goto(origin + prefixes[lang] + '/formations/');
    await page.locator('.saga-whitepaper a').click();
    assert.equal(new URL(page.url()).pathname, pagePath);
    check(`Liens accueil/SAGA et sélecteur de langue : parcours ${lang} conservé.`);
    await load();
    const statement = await page.locator('.checkbox span').innerText();
    const expectedStatement = lang === 'en' ? 'I would like Qognito to contact me to discuss the profitability and governance of my AI project.' : lang === 'es' ? 'Quiero que Qognito se ponga en contacto conmigo para hablar sobre la rentabilidad y la gobernanza de mi proyecto de IA.' : 'Je souhaite être contacté par Qognito pour échanger sur la rentabilité et la gouvernance de mon projet IA.';
    assert.equal(statement, expectedStatement);
    if (lang === 'en') {
      assert.equal(await page.locator('label[for=lead-name]').innerText(), 'Name (optional)');
      assert.ok((await page.locator('.intro').innerText()).includes('PDF in English.'));
    } else if (lang === 'es') {
      assert.equal(await page.locator('label[for=lead-name]').innerText(), 'Nombre (opcional)');
      assert.ok((await page.locator('.intro').innerText()).includes('PDF en español.'));
    }
    assert.equal(await page.locator('input[name=contact_requested]').isChecked(), false);
    await page.fill('#lead-email', 'invalid');
    await page.click('#submit-lead');
    assert.equal(requests.length, 0);
    check('Email invalide bloqué, demande d’échange décochée par défaut.');

    await page.fill('#lead-email', 'lecteur@example.test');
    await page.evaluate(() => document.querySelector('[name=botcheck]').checked = true);
    await page.click('#submit-lead');
    assert.equal(requests.length, 0);
    assert.ok(await page.locator('#download-success').isHidden());
    assert.ok((await page.locator('#form-status').innerText()).includes(lang === 'en' ? 'Your request was not sent' : lang === 'es' ? 'No se ha enviado su solicitud' : 'La demande n’a pas été transmise'));
    check('Honeypot rempli : aucun envoi ni accès présenté au PDF.');

    for (const failure of ['http', 'refused', 'html', 'network']) {
      await load(); mode = failure;
      await page.fill('#lead-email', 'lecteur@example.test');
      await page.fill('#lead-company', 'Entreprise test');
      await page.click('#submit-lead');
      await page.waitForFunction(text => document.querySelector('#form-status').textContent.includes(text), failureText);
      assert.equal(await page.inputValue('#lead-email'), 'lecteur@example.test');
      assert.equal(await page.inputValue('#lead-company'), 'Entreprise test');
      assert.ok(await page.locator('#submit-lead').isEnabled());
      assert.ok(await page.locator('#download-success').isHidden());
      check(`Échec ${failure} : champs conservés, nouvelle tentative possible, PDF masqué.`);
    }
    // Simule un délai dépassé sans attendre 20 secondes.
    await load(); mode = 'slow';
    await page.evaluate(() => AbortSignal.timeout = () => AbortSignal.abort(new DOMException('Timeout', 'TimeoutError')));
    await page.fill('#lead-email', 'lecteur@example.test');
    await page.click('#submit-lead');
    await page.waitForFunction(text => document.querySelector('#form-status').textContent.includes(text), failureText);
    assert.ok(await page.locator('#download-success').isHidden());
    check('Timeout : pas de faux succès.');

    await load('?source=linkedin-j4'); mode = 'slow';
    await page.fill('#lead-email', 'lecteur@example.test');
    const before = requests.length;
    await page.evaluate(() => { const form = document.querySelector('#whitepaper-form'); form.requestSubmit(); form.requestSubmit(); });
    await page.locator('#download-success').waitFor({ state: 'visible' });
    assert.equal(requests.length, before + 1);
    const sent = requests.at(-1);
    assert.equal(sent.contact_requested, 'non');
    assert.equal(sent.form_language, lang);
    assert.equal(sent.livre_blanc_version, version);
    assert.equal(sent.contact_statement, statement);
    assert.ok(!sent.subject.includes('{copy.'));
    if (lang === 'en') assert.equal(sent.subject, 'Qognito — white paper request: The AI Costs You Don’t See');
    if (lang === 'es') assert.equal(sent.subject, 'Qognito — solicitud del libro blanco La factura fantasma de la IA');
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    assert.equal(await page.locator('#download-success h3').innerText(), lang === 'en' ? 'Your request has been submitted.' : lang === 'es' ? 'Su solicitud se ha enviado.' : 'Votre demande a été transmise.');
    assert.equal(sent.source, 'linkedin-j4');
    assert.equal(sent.notice_version, '2026-09-29-v1');
    assert.ok(sent.request_id);
    assert.equal(await page.locator('#pdf-download').getAttribute('href'), pdfPath);
    assert.ok(await page.locator('#whitepaper-form').isHidden());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'download-success');
    const pdfResponse = await context.request.get(origin + pdfPath);
    assert.equal(pdfResponse.status(), 200);
    assert.ok((await pdfResponse.body()).subarray(0, 5).toString() === '%PDF-');
    const expectedPdf = await readFile(join(fixture, 'public', pdfPath));
    assert.deepEqual(await pdfResponse.body(), expectedPdf);
    assert.equal(await page.locator('#pdf-download').getAttribute('hreflang'), lang);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#pdf-download').click(),
    ]);
    assert.equal(download.suggestedFilename(), pdfPath.split('/').at(-1));
    assert.deepEqual(await readFile(await download.path()), expectedPdf);
    check(`Téléchargement ${lang} : fichier distinct et version ${version} exacts, contenu vérifié.`);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    check('Double envoi bloqué ; succès sans opt-in, PDF valide, focus et aucun stockage navigateur.');

    await load('?source=email-prive@example.test'); mode = 'success';
    await page.fill('#lead-email', 'lecteur@example.test');
    await page.check('input[name=contact_requested]');
    await page.click('#submit-lead');
    await page.locator('#download-success').waitFor({ state: 'visible' });
    assert.equal(requests.at(-1).contact_requested, 'oui');
    assert.equal(requests.at(-1).contact_statement, statement);
    assert.equal(requests.at(-1).form_language, lang);
    assert.equal(requests.at(-1).source, 'site');
    check('Demande d’échange explicite et provenance inconnue non transmise.');

    await page.setViewportSize({ width: 390, height: 844 });
    await load();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.ok(await page.locator('#lead-email').isVisible());
    await page.screenshot({ path: `/tmp/qognito-livre-blanc-${lang}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: `/tmp/qognito-livre-blanc-${lang}-desktop.png`, fullPage: true });
    const privacyPath = lang === 'es' ? '/es/confidentialite' : '/confidentialite';
    assert.ok(await page.locator(`a[href="${privacyPath}"]`).count() > 0);
    check('Rendu mobile sans débordement et lien de confidentialité présent.');
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const nojsPage = await nojs.newPage();
    await nojsPage.goto(origin + pagePath);
    assert.ok(await nojsPage.locator('#submit-lead').isDisabled());
    assert.ok(await nojsPage.locator('noscript').isVisible());
    await nojs.close();
    assert.deepEqual(errors, []);
    check('Sans JavaScript : aucune collecte accidentelle, contact email disponible.');
  }
  console.log(`${checks} contrôles réussis ; aucun email réel envoyé. Captures dans /tmp/qognito-livre-blanc-*.png`);
} finally {
  if (server) await new Promise(done => server.close(done));
  await browser.close();
  await rm(sandbox, { recursive: true, force: true });
}
