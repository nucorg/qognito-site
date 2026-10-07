# Stripe — intégration préparée en mode test

6 octobre 2026 · Axe II, Cible I · vente directe prioritaire, ACP/UCP différés par Boris.

## Choix technique

Stripe Checkout hébergé, paiement unique d’une unité, prix choisi côté serveur.
Les Pages Functions ajoutent les deux endpoints sans convertir le site Astro en SSR.
D1 enregistre les commandes et les tâches de livraison ; aucun compte ni base
Cloudflare distante n’a été créé. La configuration fournie est exclusivement locale.
Le SDK Stripe utilise Fetch et Web Crypto dans le runtime Cloudflare.

La recette du sandbox a révélé un refus HTTP 400 de `payment_method_types` à la
création de Checkout. Ce paramètre a été retiré : les moyens de paiement sont
désormais ceux configurés dans le Dashboard du sandbox et proposés par Stripe.
La carte fictive reste le moyen retenu pour la recette guidée. Le webhook prend
déjà en charge le paiement différé. Le simulateur d’API des tests reproduit ce
refus pour empêcher la réintroduction du paramètre.
[Migration Stripe vers les moyens de paiement dynamiques](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods).

Le code accepte uniquement `COMMERCE_MODE=test`, une clé `sk_test_`, des objets
Stripe `livemode=false` et un prix ponctuel EUR. Le mode réel est refusé dans cette
tranche. La page de test est absente quand le mode est désactivé et n’est reliée à
aucune navigation commerciale. Tous les endpoints dynamiques sont hors cache.
`public/_routes.json` limite l’exécution des fonctions aux routes commerciales.

Sources consultées : [Checkout](https://docs.stripe.com/checkout/quickstart),
[livraison et paiement différé](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted),
[signature et reprise des notifications](https://docs.stripe.com/webhooks),
[Pages Functions](https://developers.cloudflare.com/pages/functions/),
[transactions D1](https://developers.cloudflare.com/d1/worker-api/d1-database/).

## Configuration locale pour Boris

1. Utiliser un environnement Stripe de test ; créer un produit clairement nommé
   « TEST SAGA — aucun produit livré » avec un prix ponctuel fictif en EUR.
   Le montant du test n’est pas le prix commercial. Ne pas créer de prix réel.
2. Conserver les clés dans le fichier privé central `~/.config/qognito/env`
   (dossier en `700`, fichier en `600`), via un éditeur local. Ne pas remettre de
   clé dans les fichiers de démarrage du shell. Pour ce runtime Wrangler, copier
   `.dev.vars.example` vers `.dev.vars` avec `umask 077`, sans écraser un fichier
   existant, puis appliquer `chmod 600 .dev.vars`. Ce fichier ignoré par Git est
   la projection locale des seuls paramètres nécessaires à ce serveur ; ne jamais
   y copier tout le fichier central ni toutes ses autres clés.
   Renseigner côté serveur uniquement
   la clé de test, l’identifiant `price_...`, l’origine locale et le secret du webhook.
   Mettre `COMMERCE_MODE="test"` pour la recette. Ne pas envoyer de clé dans le chat,
   dans Git, dans une variable `PUBLIC_` ou dans un fichier sous `public/`.
   La clé `pk_test_` est inutile pour Checkout hébergé : le navigateur reçoit
   uniquement une URL Stripe. Ne pas ajouter de secret Stripe à `.env`, qui sert
   ici au build Astro. Ne pas afficher les fichiers privés avec `cat`, une commande
   de diagnostic ou un journal ; ne pas saisir les valeurs dans une commande qui
   restera dans l’historique. La connexion OAuth du MCP n’injecte aucune clé dans
   le runtime Cloudflare local.
3. Préparer le site et la base locale :

   ```sh
   npm run build
   npm run db:commerce:local
   npm run dev:commerce
   ```

4. Avec Stripe CLI installé et connecté au bon environnement de test :

   ```sh
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:8788/api/commerce/webhook
   ```

   Reporter son secret `whsec_...` dans `.dev.vars` et redémarrer le serveur local.
   Le secret CLI est distinct du secret d’un endpoint distant. Stripe CLI 1.53.0
   a depuis été installé par Boris, connecté et confirmé actif sur le sandbox
   « environnement de test Qognito » avec `stripe login list`.
5. Ouvrir `http://localhost:8788/commerce-test?lang=fr`, puis EN. Utiliser la carte
   Stripe de test `4242 4242 4242 4242`, une expiration future et un CVC fictif.
   Vérifier l’événement et la commande D1. L’API garde le montant/prix côté serveur.

Le calcul fiscal automatique reste désactivé par défaut. Une préparation de Tax
en sandbox est maintenant intégrée : voir [`tax.md`](tax.md) pour les prérequis,
les décisions et les contrôles. Le prix Stripe fictif ne valide ni TVA, ni
qualification du pack, ni facture commerciale.
Le pays n’est pas restreint dans ce test ; les marchés réels devront être contrôlés
avant ouverture à la vente. Les données de test doivent rester fictives.

## Ce qui est enregistré

Le webhook vérifie le corps brut et la signature Stripe avec une tolérance de
cinq minutes. Il récupère la session auprès de Stripe et contrôle le règlement,
l’offre, le mode de test, le prix, l’unité, la devise et la cohérence des montants.
Une session terminée mais impayée ne produit aucun droit ni commande payée.

Une transaction D1 écrit commande, deux tâches (`pdf`, `arbitre`) et identifiant
d’événement. Les contraintes uniques évitent les doublons même pour plusieurs
notifications concurrentes. Une erreur de base renvoie 500, permettant la reprise.
La migration `0002_commerce_tax.sql` ajoute les montants de sous-total et de taxe,
le mode/statut de calcul fiscal, le comportement du prix et le code fiscal du
scénario. Les anciennes commandes conservent un sous-total inconnu (`NULL`).
Le retour du navigateur ne modifie aucun état de commande et n’affiche aucune donnée
personnelle. Aucun endpoint public ne permet de lister les commandes.

La commande reste `paid_awaiting_setup` et chaque tâche `awaiting_setup` :
**aucune livraison, invitation, licence active ni email marchand envoyé**.
Le registre conserve l’email payeur du test, sans le confondre avec une identité
authentifiée ou un bénéficiaire définitivement choisi. Les champs édition/langue
du PDF et conditions acceptées devront être ajoutés lorsque ces décisions existent.
`page_language` ne désigne que la langue de la page, jamais celle du PDF livré.

## Recette et limites

Tests automatisés : calcul économique ; prix côté serveur et FR/EN ; mode réel et
prix récurrent refusés ; signature réelle du SDK, signature invalide et expirée ;
paiement incomplet ; incohérence de montant/quantité ; rejeu, concurrence et reprise
après échec sur SQLite transactionnel. Les appels API Stripe sont simulés dans ces
tests ; ce n’est pas une transaction exécutée dans le compte de Boris.

La compilation du site et des fonctions et la migration D1 locale ont réussi.
La recette navigateur sur le runtime Cloudflare local a également réussi : FR/EN,
390 px et 1280 px, navigation, absence de débordement et message de configuration
manquante récupérable. Les captures FR mobile et EN desktop ont été examinées.
Le document `stripe-fr-en.md` couvre la relecture intégrale des textes de cette page.
La recette manuelle du compte sandbox a ensuite réussi avec Boris : Checkout
hébergé affichant le mode test, carte fictive Stripe, retour sur la page locale,
webhook HTTP 200 et commande D1 `paid_awaiting_setup`, environnement `test`.
Les deux tâches `pdf` et `arbitre` sont présentes et restent `awaiting_setup`.
Produit de recette : `prod_VONkpSiSFBKc5y` ; prix fictif ponctuel :
`price_1UNb0gPyuwM2ZYZmTaSa6vqW`. Le montant fictif de 1 EUR ne fixe aucun prix
commercial. Tax était désactivé : la taxe nulle ne valide aucune qualification
fiscale du pack. Cette recette confirme le parcours FR ; le paiement EN et le
calcul fiscal dans le compte sandbox restent à recetter. Aucun PDF ni accès
Arbitre n’a été délivré et aucun paiement réel n’a eu lieu.

L’installation a révélé des alertes `npm audit` : plusieurs concernent les
dépendances préexistantes d’Astro ; Wrangler ajoute aussi des alertes de son runtime
local Miniflare/Sharp. Stripe n’est pas signalé dans l’audit consulté. Aucun
`npm audit fix --force` ni changement majeur d’Astro n’a été appliqué dans ce chantier.
Évaluer et traiter les chemins réellement exposés avant l’ouverture en production.

## Avant le passage réel, après accord

- Prix/marchés/fiscalité arrêtés et conditions acceptées lors de la commande.
- PDF final identifié par édition et empreinte ; stockage privé et livraison vérifiés.
- Bénéficiaire confirmé et droits Arbitre effectivement attribués ; coût durable couvert.
- Gestion des remboursements/litiges, notifications acheteur, reprise et réconciliation.
- Données personnelles : conservation, accès, sous-traitants et politique adaptés.
- Catalogue/version/prix immuables par commande : gérer les anciennes sessions même
  si le prix actif change. Le contrôle du test actuel utilise un seul prix configuré.
- Base et secrets distants séparés des tests ; revue finale, puis accord de Boris
  sur activation des paiements réels et déploiement.

Le PDF peut être remis pendant cette préparation sans être copié dans `public/`.
Son arrivée ne débloque pas à elle seule tous ces points.
