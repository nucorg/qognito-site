# Prix du pack — données attendues et méthode

6 octobre 2026 · Axe II, Cible I · simulation interne, aucun prix adopté.

Les anciennes hypothèses 49 € TTC au lancement et 69 € TTC ensuite ne sont ni un
prix plancher ni une décision. Elles pourront être comparées aux coûts, à la marge
et à la valeur perçue lorsque les données seront reçues. Aucun montant n’est inscrit
dans le catalogue ni dans les pages publiques.

## Données indispensables demandées à Boris

- Coûts fixes à amortir : rédaction/fabrication, traductions, mise en vente et
  intégration. Séparer les coûts déjà engagés de ceux encore nécessaires pour voir
  le besoin de trésorerie ; la rémunération du travail doit être explicite.
- Volume prudent de ventes et horizon de récupération ; objectif de marge.
- Coût par achat : livraison, email, administration, support, acquisition,
  provision pour remboursements/incidents. Éviter les doubles comptes.
- Arbitre : hébergement, consommation réelle, capacité concurrente, maintenance,
  accès nominatif, assistance technique et migrations. Un tarif d’API saisi dans
  un simulateur n’est pas une consommation de modèle du service.
- Coût durable par acheteur : horizon chiffré et réserve au-delà, avec scénarios
  faible/nominal/fort usage. L’horizon comptable ne raccourcit pas le droit vendu.
- Frais de paiement et de canal réellement applicables : taux sur montant brut,
  fixe, conversion éventuelle et coûts de litige. Ne pas inventer un tarif Stripe.
- Pays, B2B/B2C, régime TVA, qualification du document et du pack.

## Fiscalité : décision encore ouverte

Le BOFiP courant consulté, daté du 29 juillet 2026, prévoit un taux réduit pour les
livres répondant à la définition fiscale, y compris téléchargés. Il précise que
les biens/services associés ont en principe leur propre taux, sous réserve d’une
opération unique avec éléments accessoires. Cette doctrine ne qualifie pas notre
PDF ni Arbitre. Le format PDF, le titre « formation » ou un outil présenté comme
inclus ne suffisent pas à trancher.
[BOI-TVA-LIQ-30-10-40](https://bofip.impots.gouv.fr/bofip/1437-PGP.html/identifiant=BOI-TVA-LIQ-30-10-40-20260729).

Faire préciser la définition fiscale du document, le caractère autonome/accessoire
d’Arbitre, l’opération unique ou les prestations distinctes, puis le traitement des
clients selon leur pays et statut. L’outil de calcul peut éprouver un taux unique,
une absence de collecte explicite ou une ventilation validée ; il ne choisit aucun
taux par défaut. Une ventilation arbitraire pour améliorer la marge ne convient pas.

## Calcul reproductible

Le modèle raisonne en euros de coût supporté : HT si la TVA est récupérable, TTC
sinon. Il n’effectue aucun actualisation automatique des années futures : les coûts
d’Arbitre sont provisionnés en somme simple, avec une réserve terminale explicite.
La réserve ne garantit pas à elle seule la continuité du service.

Notation : `F` coûts fixes, `N` ventes retenues, `V` coûts variables hors Arbitre et
paiement, `A` réserve durable Arbitre par acheteur, `b` frais fixes, `f` taux des frais
sur brut, `m` marge cible sur revenu net de TVA. Pour un prix TTC `P`, une composante
fiscale de part TTC `w_i` et de taux `t_i` donne :

```text
h = somme(w_i / (1 + t_i)), avec somme(w_i) = 1
Revenu net de TVA = P × h
Contribution par vente = P × (h − f) − V − A − b
Résultat par vente après amortissement = contribution − F / N
P requis pour la marge m = (F / N + V + A + b) / (h × (1 − m) − f)
Ventes pour couvrir F = plafond(F / contribution), si contribution > 0
```

Ce calcul dépend d’une composition fiscale constante dans le scénario et de frais
linéaires. Faire un scénario par marché/mix de paiement et par niveau d’usage.
Le seuil de ventes est conditionnel au coût Arbitre par acheteur retenu : si ce coût
change avec le volume, recalculer. Les coûts fixes futurs partagés d’Arbitre doivent
être répartis sur une base prudente puis inclus dans ses coûts annuels, sans être
aussi comptés dans `F`. Il faut provisionner les cohortes anciennes même si les
ventes nouvelles s’arrêtent.

Copier `commerce/pricing-input.example.json` dans un fichier de travail local, par
exemple sous `/tmp`, puis remplir toutes les valeurs. Les taux sont décimaux :
`0.2` signifie 20 %, sans que cet exemple soit une qualification fiscale. Les coûts
annuels sont des coûts par acheteur pour chaque année de l’horizon. La réserve
terminale est distincte. Zéro doit être renseigné explicitement ; `null` est refusé.

```sh
node scripts/commerce-pricing.mjs /tmp/saga-pricing.json
node tests/commerce-pricing.mjs
```

Les sorties restent des simulations. Le script n’écrit aucun fichier, prix,
produit Stripe, configuration du site ou flux marchand.

## Arbitrage recommandé après réception des coûts

Comparer les hypothèses antérieures et d’autres montants si nécessaire sur trois
scénarios d’usage/volume. Retenir un prix qui finance la réserve Arbitre même dans
le scénario prudent et une marge explicite ; confronter ensuite ce prix à la valeur
du pack pour les décideurs visés. Le coût détermine la viabilité, pas la disposition
à payer. Recueillir des retours ou tester une proposition avant de promettre un gain.

Privilégier un prix unique pour le premier lancement, sauf justification explicite
d’un tarif introductif. Si un tarif de lancement est retenu, décider son montant,
sa durée/condition de fin et le prix ultérieur. Ne pas afficher de prix barré ni
« économie » à partir d’un prix futur hypothétique.

Pour la présentation : montant TTC final par marché B2C ; indication HT utile en
B2B selon le régime confirmé. Une page EN peut rester en EUR : anglais ne signifie
ni conversion automatique en USD ni admission du marché américain. Si la taxe
dépend du pays du client, préciser le marché du prix affiché et confirmer le total
avant paiement. Source de prix commune, formatage `fr-FR` / `en-GB` ; aucun champ
de prix indépendant dans les deux textes.

La décision doit consigner offre/version, prix, devise, marchés, régime fiscal,
date d’effet, approbation de Boris et traitement des futures éditions. L’accord sur
le montant ne suffit pas à autoriser paiement réel et déploiement.
