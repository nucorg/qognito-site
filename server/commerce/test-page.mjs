export const testCopy = {
  fr: {
    title: 'Test de paiement SAGA-IA',
    description: 'Environnement de test Stripe. Aucun achat réel.',
    notice: 'Utilisez uniquement les données de carte de test Stripe. Le montant configuré est fictif et ne fixe pas le prix commercial.',
    delivery: 'Ce test enregistre une commande de test. Aucun PDF ni accès à SAGA Arbitre n’est délivré.',
    button: 'Ouvrir le paiement de test',
    error: 'Le paiement de test est indisponible. Vérifiez la configuration côté serveur.',
    returned: 'Retour de Stripe reçu. La commande est enregistrée séparément après vérification de la notification de paiement.',
    cancelled: 'Vous êtes revenu du paiement de test. Ce retour ne prouve pas l’état du règlement.',
    backlink: 'Retour aux formations'
  },
  en: {
    title: 'SAGA-IA payment test',
    description: 'Stripe test environment. No real purchase.',
    notice: 'Use Stripe test card details only. The configured amount is fictitious and does not set the commercial price.',
    delivery: 'This test records a test order. No PDF or access to SAGA Arbitre is delivered.',
    button: 'Open test checkout',
    error: 'Test checkout is unavailable. Check the server configuration.',
    returned: 'Return from Stripe received. The order is recorded separately after verification of the payment notification.',
    cancelled: 'You have returned from test checkout. This return does not confirm the payment status.',
    backlink: 'Back to courses'
  }
};

export function testPage(request, env) {
  if (env.COMMERCE_MODE !== 'test') return new Response('Not found', { status: 404 });
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'fr';
  const copy = testCopy[lang];
  const nonce = crypto.randomUUID();
  const result = url.searchParams.get('result');
  const message = result === 'return' ? copy.returned : result === 'cancel' ? copy.cancelled : '';
  return new Response(`<!doctype html><html lang="${lang}"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow"><title>${copy.title} | Qognito</title>
    <style nonce="${nonce}">body{margin:0;background:#050B14;color:#E2E8F0;font:1rem/1.6 system-ui,sans-serif}
    main{max-width:42rem;margin:4rem auto;padding:1.5rem;background:#0F2035;border-radius:12px}
    h1{color:#fff;font-size:clamp(1.5rem,5vw,2rem)}a{color:#D4850F}button{padding:1rem;border:0;border-radius:6px;background:#D4850F;color:#050B14;font:inherit;cursor:pointer}
    button:disabled{opacity:.6}#message{min-height:2rem}nav{display:flex;gap:1rem} @media(max-width:48rem){main{margin:1rem}}</style>
    </head><body><main><nav><a href="/commerce-test?lang=fr" lang="fr">FR</a><a href="/commerce-test?lang=en" lang="en">EN</a></nav>
    <h1>${copy.title}</h1><p>${copy.description}</p><p>${copy.notice}</p><p>${copy.delivery}</p>
    <p>${message}</p><button id="checkout" type="button">${copy.button}</button><p id="message" role="status" aria-live="polite"></p>
    <a href="${lang === 'en' ? '/en' : ''}/formations/">${copy.backlink}</a></main>
    <script nonce="${nonce}">const button=document.getElementById('checkout');const status=document.getElementById('message');const requestId=crypto.randomUUID();
    button.addEventListener('click',async()=>{button.disabled=true;status.textContent='';try{
      const response=await fetch('/api/commerce/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang:'${lang}',request_id:requestId})});
      const data=await response.json();if(!response.ok)throw new Error();const target=new URL(data.url);
      if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw new Error();window.location.assign(target.href);
    }catch{status.textContent=${JSON.stringify(copy.error)};button.disabled=false;}});</script></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
      'Referrer-Policy': 'no-referrer' }
  });
}
