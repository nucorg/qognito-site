# Stripe Payments et Tax — complément sandbox

6 octobre 2026 · Axe II, Cible I · intégration technique locale.

## État observé sur le compte

Le MCP Stripe répond. Un seul compte accessible : « environnement de test Qognito »,
`livemode=false`. Le planificateur `stripe_implementation_planner` est présent et
a été utilisé dans cette session. Il a proposé Checkout hébergé pour un achat
ponctuel ; aucun besoin d’installer un plugin ou le recours `npx skills add`.
Les montants et noms d’exemple du planificateur n’ont pas été adoptés.

Lecture seule de Tax : `status=pending`, champ manquant `head_office`, aucun code
fiscal ni comportement fiscal par défaut, aucune immatriculation enregistrée.
Lors de cette inspection initiale, aucune mutation du compte n’a été effectuée.
Une recette manuelle de paiement sandbox a ensuite été menée avec Boris, comme
consigné ci-dessous. Les clés privées locales n’ont pas été ouvertes par l’agent.

## Comparaison avec le plan Stripe

| Élément | Existant avant cette session | Complément local |
| --- | --- | --- |
| Checkout hébergé ponctuel | Prix test EUR côté serveur, quantité 1, FR/EN, idempotence | Contrôle UUID et protocole de l’origine renforcés |
| Isolation sandbox | Clé test exigée, objets réels refusés, commerce désactivé par défaut | Tax applique les mêmes contrôles de mode |
| Notification de paiement | Corps brut signé, session relue, écriture transactionnelle et reprises | Contrôle fiscal, prix ponctuel et montant confrontés ; sous-total/taxe conservés |
| Stripe Tax | `automatic_tax=false` | Activation explicite et contrôlée ; prérequis du compte et classification explicite du produit |
| Livraison PDF et accès nominatif | Deux tâches `awaiting_setup` | Toujours en attente : stockage privé, identité et backend Arbitre à définir |

## Scénario de test fiscal

Par défaut, `COMMERCE_TAX_MODE=disabled`. Pour un scénario fiscal sandbox choisi
explicitement par Boris, renseigner les paramètres dans `.dev.vars`, sans utiliser
les réglages du compte réel :

- `COMMERCE_TAX_MODE=automatic` ;
- `SAGA_TEST_PRICE_ID` : prix test ponctuel EUR du scénario ;
- `SAGA_TEST_TAX_CODE` : identifiant exact choisi dans Stripe et appliqué au produit ;
- `COMMERCE_COLLECT_TAX_IDS=true` uniquement pour un scénario de collecte d’identifiant fiscal.

Le produit doit être actif et de test. Son code fiscal explicite doit correspondre
au code choisi ; aucun code de repli du compte n’est adopté silencieusement.
Le prix doit avoir `tax_behavior=inclusive` ou `exclusive` explicitement fixé.
Le serveur exige les réglages Tax actifs et au moins une immatriculation sandbox
active. Le compte observé ne satisfait pas ces prérequis : l’activation actuelle
renverrait 503 avant création d’une session.

Stripe documente des réglages Tax séparés pour les sandboxes et des immatriculations
de test ; un essai fiscal utilise une adresse fictive dans une juridiction du
scénario. [Tester Stripe Tax](https://docs.stripe.com/tax/testing).

Checkout collecte l’adresse de facturation et transmet `automatic_tax.enabled=true`
dans ce mode. Les données du client déterminent la localisation fiscale du calcul.
[Tax avec Checkout hébergé](https://docs.stripe.com/tax/checkout/page).

Le webhook exige un calcul `complete`, des taxes entières non négatives et des
montants cohérents entre ligne et session. Pour un prix exclusif, le total vaut le
prix plus la taxe ; pour un prix inclusif, le total reste le prix. Un calcul
complet peut légitimement produire une taxe nulle : ce résultat ne qualifie pas
à lui seul une vente comme exonérée. Le mode fiscal est conservé dans la session
pour traiter une notification retardée après changement du mode local.
[Comportement des prix](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior),
[taxe nulle](https://docs.stripe.com/tax/zero-tax).

Cette tranche conserve une ligne pour le pack. Si la qualification retenue exige
deux composants distincts, il faudra adapter le catalogue, les prix, les lignes
Checkout et le webhook ; ne pas ouvrir la vente en forçant un code unique.

## Décisions nécessaires avant configuration commerciale

| Décision à obtenir | Conséquence pour Stripe |
| --- | --- |
| Qualification du PDF, de l’accès à l’outil et du pack : opération composite ou prestations distinctes | Code fiscal du produit ou codes séparés ; éventuelle ventilation du montant |
| Marchés desservis et clientèle particuliers/entreprises | Scénarios d’adresse, collecte des identifiants fiscaux et règles de disponibilité |
| Adresse du siège et immatriculations pertinentes confirmées | Réglages Tax et immatriculations ; le test ne prouve aucune obligation ou inscription réelle |
| Prix adopté, devise et présentation en taxes incluses/exclues | Création des prix et choix explicite de `tax_behavior` |
| Conditions de vente, facturation et traitement des remboursements | Informations collectées, preuve des conditions et réconciliation commandes/droits |

La qualification et les immatriculations doivent être confirmées avec le conseil
fiscal/comptable compétent. Aucun taux de TVA, code du pack, régime OSS, exonération
ou mécanisme d’autoliquidation n’est décidé par ce chantier. Aucun document de
gestion ni document de formation n’a été consulté ou modifié pour ces arbitrages.

## Contrôles exécutés

- `npm run test:commerce` : réussi ; API Stripe simulée, signatures du SDK et SQLite transactionnel.
- Nouveaux cas Tax : prérequis absents, compte/immatriculation réels rejetés, code manquant,
  prix indéfini, inclusif/exclusif, calcul incomplet, taxe incohérente et taxe nulle.
- `npm run build` : réussi, 16 pages Astro ; aucune route ES ajoutée.
- `npm run db:commerce:local` : migration fiscale appliquée uniquement à D1 local.
- Recette navigateur Wrangler local FR/EN : mobile 390 px et bureau 1280 px,
  navigation et erreur de configuration récupérable, aucune erreur JavaScript.

Les appels de paiement et Tax de la recette automatisée sont simulés. Boris a
ensuite installé Stripe CLI 1.53.0, connecté le sandbox Qognito et renseigné les
secrets en privé. La recette manuelle FR du compte sandbox a réussi : Checkout,
carte fictive, retour navigateur, webhook HTTP 200, commande D1 de test et deux
tâches `pdf`/`arbitre` confirmées en `awaiting_setup`. Le prix utilisé est fictif
et ponctuel ; aucun prix commercial n’a été adopté. Tax restait désactivé.
Le paiement EN et le calcul fiscal avec adresses fictives restent à recetter,
après configuration explicite des scénarios et prérequis de Tax.
La livraison privée, l’accès nominatif durable, les remboursements et la
réconciliation des droits ne sont pas implémentés. Aucun déploiement ni paiement réel.
