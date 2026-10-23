# Essai des badges de prix — 23 octobre 2026

Axe II · Cible I. Intégré et vérifié localement. Publication autorisée par Boris le 23 octobre 2026, réalisée et vérifiée en production.

## Aperçus

| Page | Ordinateur | Mobile |
|---|---|---|
| Accueil FR | [1280 px](accueil-fr-1280.png) | [390 px](accueil-fr-390.png) |
| Vente FR | [1280 px](vente-fr-1280.png) | [390 px](vente-fr-390.png) |
| Accueil EN | [1280 px](accueil-en-1280.png) | [390 px](accueil-en-390.png) |
| Accueil ES | [1280 px](accueil-es-1280.png) | [390 px](accueil-es-390.png) |

Les captures `*-full.png` conservent les pages complètes. Le formulaire visible sur les captures françaises utilise une réponse de disponibilité simulée : aucun paiement réel.

## Changements

Deux cartes avec bandeaux de 130 px (réduits depuis 180 px après retour de Boris), orange #D4850F et texte #050B14 ; grille à deux colonnes dès 768 px ; empilement en dessous. Badge pleine largeur sur la vente française, 32 px avant le bloc de commande. EN/ES conservent leur attente. Montant des badges et du bouton de commande issu du catalogue. Présentation du programme Formations conservée.

## Validation exécutée

- `npm run build` : réussi, 30 pages et Worker compilés.
- `npm run test:sales` et `node tests/commerce-pricing.mjs` : réussis.
- `npm run test:sales:browser` : réussi, FR/EN/ES à 390 et 1280 px ; formulaire et erreur récupérable simulée.
- Contrôle Playwright ponctuel : 30 combinaisons page/langue/largeur, résultats dans [checks.json](checks.json). Aucun débordement ; badges et actions alignés sur ordinateur, empilement mobile, couleurs exactes, liens localisés, formulaire absent en EN/ES, prix visible même si vente fermée ou requête de disponibilité en erreur.
- Focus clavier contrôlé sur les deux liens d’accueil dans les trois langues.
- Reflow équivalent à 200 % vérifié via émulation 640 CSS px / DPR 2 ; zoom natif non actionné.
- Inspection visuelle des captures FR ordinateur/mobile ; contraste calculé 6,73:1.
- `git diff --check` : réussi.

Fiche éditoriale : [relecture FR/EN/ES](../../../../qognito-content/localisations/site/2026-10-23-badges-prix/relecture-bilingue.md).

## Correction après retour de Boris

Cause confirmée : `npm run dev` démarre Astro sans exécuter les fonctions Cloudflare `/api/commerce/*`. L’ancien formulaire restait masqué après l’échec de la vérification de disponibilité.

Le formulaire français est désormais toujours visible. Seul le paiement reste désactivé tant que l’API n’a pas confirmé `enabled: true`. Un échec réseau, une réponse HTTP en erreur ou une fermeture de la vente ne permettent pas de lancer une commande. Une soumission déclenchée par script est également bloquée. Aucun texte ni tarif modifié.

Validation : build réussi ; test navigateur existant étendu aux états fermé, réseau indisponible, réponse HTML 404, HTTP 503 (même si le corps annonce enabled), requête en attente puis ouverte, et tentative de soumission forcée. Tous passent. Trente combinaisons page/langue/largeur revérifiées ; les deux bandeaux mesurent 130 px à toutes les largeurs contrôlées. Le grand badge est conservé.

Vérification supplémentaire sans interception réseau sur `npm run dev` à http://127.0.0.1:4321 : formulaire visible et bouton désactivé, conformément à l’absence d’API locale. [Capture réelle Astro dev](vente-fr-astro-dev.png).

## Publication vérifiée

Version applicative `94e4d6da5e1056798e1371671bcf45591a49bb18`, déploiement Cloudflare `5355521b-4e56-42a7-9df3-12ec56a8011a` réussi. Configuration de production comparée avant/après : inchangée. Achats ouverts : `enabled:true`, `test:false`.

Six parcours FR/EN/ES × mobile/ordinateur réussis sur `qognito-site.pages.dev`, domaine technique de la même production : bandeaux 130 px, grand prix séparé, formulaire français visible et bouton de paiement actif, trois consentements obligatoires non cochés, EN/ES sans formulaire. Aucun POST de commande ni paiement ; aucune erreur JavaScript.

Le domaine public `qognito.io` oppose un challenge Cloudflare HTTP 403 au navigateur automatisé ; le rendu public dans un navigateur humain n’est donc pas attesté par ce contrôle. Aucune protection modifiée.

Preuves privées : `.wrangler/prix-2026-10-23/`. Un éventuel commit documentaire ultérieur ne change pas l’application ; la dernière référence canonique figure dans `~/VIBE/MANUEL_SITEWEB.md`.
