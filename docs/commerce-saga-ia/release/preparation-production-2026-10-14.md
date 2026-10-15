# Préparation de production — 14 octobre 2026

Axe II · Cible I. Préparation autorisée par Boris ; ventes réelles encore fermées.

## Production déployée, achats fermés

| Élément | État vérifié le 14 octobre |
|---|---|
| Compte Cloudflare | `10434902b076f59013c4ec2189997cdd` |
| Pages | Projet `qognito-site`, déploiement de production `1b059f1b-f01d-4d7e-889a-27b8dfdeac69`, branche distante `main` ; configuration de préparation issue de `draft/vente-volume-1` |
| D1 | `qognito-commerce-production`, ID `73e36ed0-aea8-48a7-9606-aadbbe7496d5`, Europe de l'Ouest ; migrations 0001–0005, zéro commande, événement et alerte |
| R2 | `qognito-commerce-production`, Standard, Europe de l'Ouest ; accès public r2.dev désactivé, aucun domaine personnalisé |
| PDF R2 | `saga-ia/volume-01/fr/1.1/saga-ia-volume-01-fr-v1.1.pdf`, relu à distance ; SHA-256 `6ac5920802ac4cfd0a5efa4820accf9f6ce8ce4ecabd4cca3b7ff092216d0add` |
| Secrets | Clé Stripe restreinte live, secret du webhook, signature des liens propre à la production, clé Resend ; quatre secrets installés sur Pages **production uniquement** et sur le Worker ; preview inchangée |
| Stripe | Compte réel `acct_1UNa5lLSrIVlLS58` ; paiements et virements activés par Stripe, informations de compte soumises |
| Produit | `prod_VRMxP834p8TSfU` |
| Prix | `price_1UQUDMLSrIVlLS58pUO2CRTF`, **49,99 € TTC**, ponctuel, inclusif |
| TVA | `txr_1UQUDMLSrIVlLS58SHNNYB9F`, FR 5,5 % inclusive, taux confirmé par Boris |
| Moyens de paiement | `pmc_1UQUDNLSrIVlLS58iqzzavXv`, configuration dédiée, carte uniquement |
| Webhook | `we_1UQUDNLSrIVlLS58rxhuAVpP`, **actif**, 11 types d'événements, URL stable `https://qognito-site.pages.dev/api/commerce/webhook` |
| Worker | `qognito-commerce-jobs-production`, version `75faa5e2-0da6-4bb6-b4d0-dbe3dae3ca3b`, cron `*/5 * * * *`, aucune URL publique |
| Ouverture | `COMMERCE_CHECKOUT_ENABLED=false` ; marqueurs d'approbation du contrat et du PDF absents |

La configuration durable est dans `wrangler.jsonc` (`env.production`) et `wrangler.jobs.production.jsonc`. La configuration racine et les previews restent désactivées et n'héritent pas des bindings de production. Les valeurs ordinaires préexistantes du formulaire de livre blanc sont conservées. Les secrets ne sont jamais inscrits dans ces fichiers.

Le déploiement direct Pages ne constitue pas une fusion Git : intégrer cette configuration et le code de la vente dans la branche de production avant un prochain déploiement automatique depuis Git. Aucun commit ni push effectué pendant cette préparation.

### Adresse du webhook et protection Cloudflare

Les appels automatisés à `qognito.io` ont reçu un **challenge navigateur Cloudflare**, y compris un POST signé sur `/api/commerce/webhook`. Stripe ne peut pas résoudre ce challenge. Le webhook utilise donc le domaine technique **stable du même projet Pages de production**, `qognito-site.pages.dev`, qui accepte les notifications signées. L'adresse de déploiement ponctuelle `3f6de915…pages.dev` n'est pas utilisée pour Stripe.

Les liens visiteurs restent sur `qognito.io`. Aucun réglage de protection de la zone n'a été modifié ; le jeton Wrangler actuel ne permet pas de lire ces réglages (HTTP 403). Le parcours dans un navigateur normal sur `qognito.io`, y compris la réponse de `/api/commerce/availability`, reste à contrôler avant l'ouverture. Les vérifications sur le domaine technique ne remplacent pas ce contrôle.

### Scripts exécutés

- `scripts/store-stripe-live-key.py` : exécuté par Boris ; clé restreinte dans `.env.stripe-live`, mode 600, ignorée par Git.
- `scripts/prepare-sales-production.mjs --provision-live` : catalogue créé et vérifié ; identifiants conservés pour reprise dans `.wrangler/sales-production/stripe-state.json`. Le script ne crée ni achat ni facture persistante, ne déploie pas et n'ouvre pas les ventes. Un nouveau webhook est laissé désactivé jusqu'au raccordement ; celui-ci a ensuite été activé après contrôle.
- Pages et Worker déployés avec les mêmes ressources et secrets. Procédure de reprise dans [exploitation.md](exploitation.md#suite-technique-à-prendre-en-charge-par-codex).

## Contrôle de facture en recette

Le module `server/commerce/invoice.mjs` ajoute l'identité déjà confirmée dans les CGV et la charte au pied de facture, la référence de commande et la date de paiement. Le client Stripe reçoit la locale française ; le détail des montants s'affiche hors taxes. Les anciennes factures finalisées sont conservées.

- Recette mise à jour : Pages `39d79e44`, Worker `d7124883-0b1b-4d81-82b9-05e50038ec24`.
- Achat **Stripe test** : commande `6b822dde-89e1-4c73-89da-2c969e0301af`, PDF HTTP 200 et empreinte correcte.
- Facture `in_1UQTRZPyuwM2ZYZmFUMtjHdL`, numéro `40113WWN-0007` : statut payé, total 4 999 centimes, HT 4 738, TVA 261, reste à payer zéro. Aucun recouvrement supplémentaire (`attempt_count=0`).
- Email accepté par Resend ; réception de **ce nouvel email** non confirmée par Boris. Sa confirmation des trois emails précédents reste consignée dans le rapport des reprises.
- API, page hébergée et deux PDF examinés. La page envoyée à l'acheteur affiche **« Facture payée »**. Le document « Facture » conserve le montant initial dû ; le document distinct **« Reçu »** affiche **49,99 € payé**, la date, le numéro de facture, le détail HT/TVA et le paiement Visa de test. Ce point est vérifié par téléchargement dans le navigateur et extraction LiteParse, pas inféré du seul statut API. [Fonctionnement de la page Stripe](https://docs.stripe.com/invoicing/hosted-invoice-page).
- L'en-tête du bac à sable comporte encore son nom générique et ses coordonnées de test. Le pied contient les coordonnées Qognito. Cela ne prouve pas les réglages du compte réel : son profil et ses réglages de facture doivent être vérifiés après accès live. La tentative de correction du seul profil sandbox via `accounts.update` a été refusée par Stripe, cette opération visant les comptes connectés ; aucune modification de profil n'a eu lieu.

Artefacts privés : `.wrangler/sales-production/invoice-review.{json,pdf,txt}`, `invoice-receipt-review.{pdf,txt}`, `hosted-invoice-review.txt`, `invoice-test-state.json`. Ils restent exclus de Git.

## Contrôles de production réalisés

- **API et fermeture** : disponibilité HTTP 200 avec `enabled:false`, `test:false`, contrat `2026-10-14-v2` ; tentative de création de commande refusée HTTP 503 avant écriture.
- **Accès protégés** : commande sans cookie refusée 401 ; cookie signé pour une référence inexistante accepté puis commande absente 404, ce qui contrôle la signature et l'accès D1 ; lien PDF invalide refusé 403.
- **Webhook** : signature invalide refusée 400 ; sonde signée en mode live, de type inconnu, reçue et ignorée 200 ; sonde de test signée refusée 400 `environment_mismatch`. Ces sondes ne sont pas des événements émis par Stripe et ne créent aucune commande.
- **Calcul Stripe live** : aperçu de facture non persistant via `invoices.createPreview`, total 4 999 centimes, HT 4 738, TVA 261. Aucun client, paiement, session Checkout ni facture comptable persistante créé. L’aperçu est récupérable par son ID, mais absent de la liste des factures ; son client simulé est absent du compte, aucun encaissement n’est tenté. Ce contrôle ne produit pas de PDF de facture et ne prouve pas son en-tête final. [Distinction entre aperçu et facture Stripe](https://docs.stripe.com/api/invoices/create_preview).
- **Pages FR/EN/ES** : contrôlées sur le domaine technique de production à 390 px, HTTP 200, aucune erreur JavaScript ni débordement horizontal ; formulaire FR masqué avec « Ouverture prochaine de la vente », EN « Available soon », ES « Pronto disponible ».
- **Garde-fous** : toutes les conditions de configuration du contrôle local passent ; seuls `checkout_open`, `terms_approved` et `pdf_approved` sont faux, volontairement. Le code de sortie 1 du contrôle d'ouverture est donc attendu à cette étape.
- **Worker** : calendrier distant confirmé ; première exécution planifiée encore à observer au moment de cette rédaction. Le suivi `wrangler tail` a été connecté puis arrêté sans événement reçu ; l’API d’historique Observability renvoie 403 avec le jeton actuel. L’API GraphQL est accessible : `workersInvocationsScheduled` renvoie des exécutions réussies pour la recette, mais aucune pour la production lors du contrôle jusqu’à 16:29 UTC. La version est déployée à 100 % et expose bien le handler `scheduled`. Ne pas assimiler calendrier enregistré et exécution éprouvée.

Les tests de commerce et le build Astro avaient réussi après l'ajout des mentions de facture. Le déploiement Pages a compilé les Functions. Aucun paiement réel effectué.

Preuves privées dans `.wrangler/sales-production/` : `resources-verification.json`, `deployment-verification.json`, `http-verification.json`, `invoice-preview-verification.json`, `browser-verification.json`, `readiness-check.txt`, `worker-scheduled-metrics.json` et journaux de déploiement. Copie de la configuration Pages précédente : `pages-before-install.json` ; ancien déploiement `7277f604-049f-43c7-8778-11e839771ce9`. Ne pas publier ces artefacts, les secrets ni les liens de facture ou de téléchargement.

## Coordonnées Stripe et suite avant ouverture

**Coordonnées d’assistance validées par API le 14 octobre à 16:20 UTC** : `contact@qognito.io`, téléphone `+33762640506`, adresse 151 Avenue Felix Faure, 92800 Puteaux, FR. L’écart initial est résolu. Boris confirme aussi l’enregistrement des URL `https://qognito.io/confidentialite/` et `https://qognito.io/conditions-de-vente/` ; ces deux valeurs ne sont pas exposées dans la réponse Account v1 consultée.

**Type et identité corrigés par Boris, confirmés par API à 16:29 UTC** : `business_type:"company"`, `company.structure:"private_corporation"`, dénomination `QOGNITO`, nom commercial `Qognito.io`. L’écart avec le type individuel est résolu. Sa capture affiche « Société », « Société non cotée » et une **vérification Stripe en cours**, délai annoncé à l’écran de 24 heures maximum. L’API indique `charges_enabled:true`, `payouts_enabled:true`, `details_submitted:true` ; elle ne fournit pas de bloc `requirements` pour cette consultation, ce qui ne prouve pas la clôture de la vérification affichée. Aucune ouverture des achats n’a été effectuée.

Les identifiants fiscaux de facture par défaut restent absents (`default_account_tax_ids:null`). Le pied de facture de l’application contient les coordonnées, SIREN et TVA déjà confirmés ; cela ne vérifie pas l’en-tête configuré dans Stripe.

Restent avant ouverture :

1. Terminer l'observation du Worker et relever l'issue de la vérification Stripe ; vérifier la présentation vendeur et les réglages de facture réels.
2. Contrôler le parcours sur le domaine public `qognito.io` depuis un navigateur normal, puis relire les pages et les CGV avec Boris.
3. Après accord explicite de Boris sur l'ouverture et les versions du contrat/PDF, poser les marqueurs d'approbation et ouvrir le checkout. Un éventuel premier paiement réel nécessite son accord distinct ; les scripts de recette refusent les clés live.


## Mise à jour de l’accroche — 14 octobre, 16:46 UTC

Boris a validé puis demandé l’insertion des deux phrases sous le prix du volume
français : « Achetez-le une fois. Consultez-le à volonté. Sans abonnement. » en
gras, puis « Téléchargez votre PDF, sauvegardez-le et retrouvez-le hors ligne,
quand vous en avez besoin. » en texte normal, avant les précisions TVA/livraison.

Déploiement Pages `f4e4285d-4021-400c-a2be-38accca7d7be`, remplaçant `3f6de915`.
Build réussi ; contrôle local FR/EN/ES et contrôle distant FR à 390/1 280 px,
sans erreur JavaScript ni débordement. Les fichiers backend sont identiques à
ceux de la préparation précédente ; aucun secret ni objet Stripe modifié.
Bindings et quatre secrets de production présents ; achats fermés, `test:false`.
Le contrôle distant a porté sur `qognito-site.pages.dev` ; la requête automatisée
sur `qognito.io` reste soumise au challenge Cloudflare.

Preuves privées : `.wrangler/sales-production/copy-{build,deploy}.log`,
`copy-local-verification.json`, `copy-production-verification.json` et captures
`copy-{local,production}-fr-{390,1280}.png`.
La fiche de relecture et l’extraction complète FR dans `qognito-content` sont
synchronisées ; les adaptations EN/ES sont préparées pour le futur bloc d’achat,
absent des pages en attente actuelles. Aucun commit ni push effectué.


## Composition du volume — 14 octobre, 17:00 UTC

Introduction validée par Boris : « Les sections 1 et 2 de SAGA-IA réunies dans un
PDF pour examiner les conséquences d’une délégation à l’IA, construire vos
hypothèses économiques et justifier votre décision. » Adaptations EN/ES
synchronisées, ainsi que les encarts Formations/livre blanc et la description
SEO du volume. Les titres sont conservés. Fiche bilingue et pages complètes à jour
dans `qognito-content/localisations/site/2026-10-14-vente-volume-1/`.

Déploiement `1b059f1b-f01d-4d7e-889a-27b8dfdeac69`, remplaçant `f4e4285d`.
Build réussi ; les neuf pages concernées vérifiées à 390/1 280 px, en local puis
sur le domaine stable de production : texte, titre, lien et description SEO
attendus ; aucun débordement ni erreur JavaScript. Contrôle API : achats fermés,
mode réel. Le domaine personnalisé n’a pas été retesté directement dans ce lot.
Changement déployable limité aux trois introductions de `src/content/volume.ts`.
Preuves privées : `.wrangler/sales-production/sections-deployment.json`,
`sections-{local,production}-verification.json`, captures et journaux de build/
déploiement du même préfixe. Aucun commit ni push effectué.
