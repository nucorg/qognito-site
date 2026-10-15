# Publication du site — 15 octobre 2026, 12 h 03 (Paris)

Axe II · Cible I. Déploiement demandé par Boris après son essai des dernières retouches. La vente reste fermée dans l’attente de l’ISBN et de la décision d’ouverture.

Ce rapport décrit la publication directe de 12 h 03. La reprise ultérieure des sources dans Git est documentée dans [synchronisation-git-2026-10-15.md](synchronisation-git-2026-10-15.md).

## Version publiée

- Projet Cloudflare Pages : `qognito-site`, environnement **production**, branche de déploiement `main`.
- Déploiement : **`c43b459d-5336-4acd-9fb6-2402296764fb`**, terminé avec succès à 10:03:16 UTC.
- Précédente production : `1b059f1b-f01d-4d7e-889a-27b8dfdeac69`, conservée comme référence de retour arrière.
- Domaines rattachés : `qognito.io`, `www.qognito.io`, `qognito-site.pages.dev`.
- Source locale : `draft/vente-volume-1`, base `b78297529c96b6825d4344178d5ef1b65e780faa`, avec modifications non commitées (`commit_dirty:true`). Aucun commit, push ou fusion effectué dans cette publication. La réconciliation Git reste à terminer.

## Changements visibles

1. **Extrait avant achat** : trois pages françaises, imprimées 17 à 19, accessibles depuis les pages du volume FR/EN/ES. Chaque libellé indique la langue du PDF et sa longueur. Ouverture au clic dans un nouvel onglet, sans formulaire ni chargement automatique.
2. **Accueil** : encart Volume 1 placé immédiatement après le livre blanc dans les trois langues. Le composant partagé `VolumeCallout.astro` reprend les textes de Formations, avec 49,99 € TTC en français et les états d’attente EN/ES.
3. **Formations** : retrait de la marge supplémentaire de 60 px avant le séparateur. La distance entre la fin du dernier paragraphe et la ligne passe d’environ 105 à 45 px dans les contrôles.

Extrait public : `/extraits/saga-ia-volume-01-fr-v1.1.pdf`, **91 227 octets**, SHA-256 `6dfeabd1b485c2ebc0a01905de3693d0605cb0bb56f42955e5dcf7eb79186998`. La copie est distincte du PDF complet de 93 pages, qui reste privé. Les fichiers source et public, le catalogue et le manifeste éditorial concordent.

## Contrôles et limites

- `npm run test:commerce`, `npm run build` et compilation des Pages Functions : réussis.
- Comparaison avant publication : `functions/` et `server/` identiques à la copie du déploiement précédent. Configuration de production alignée sur `wrangler.jsonc` ; achats fermés avant et après l’envoi.
- API Cloudflare après publication : déploiement canonique réussi, variables ordinaires et bindings D1/R2 identiques ; quatre noms de secrets attendus toujours présents. Aucune réinstallation de secrets, modification d’objets Stripe, migration D1, modification R2 ou republication du Worker dans ce lot.
- Sur `qognito-site.pages.dev` : **18 rendus contrôlés** (accueil, Formations, volume × FR/EN/ES × 390/1 280 px). Textes de l’encart identiques, liens localisés, espace réduit, extrait présent sans préchargement, formulaire français masqué, aucun débordement horizontal ni erreur JavaScript.
- Disponibilité : HTTP 200, `{"enabled":false,"test":false,"terms_version":"2026-10-14-v2"}`.
- Tentative de checkout avec corps vide : HTTP **503** `checkout_unavailable`, rejet avant accès au registre des commandes et à Stripe selon le code vérifié. Aucun paiement réel ni session Checkout créé.
- Extrait récupéré depuis **`qognito.io` et `qognito-site.pages.dev`** : HTTP 200 `application/pdf`, taille et empreinte identiques à la source.
- Sur `qognito.io`, les requêtes automatisées à l’accueil et à la disponibilité reçoivent encore un challenge Cloudflare HTTP 403. Les vérifications de rendu ont donc utilisé le domaine technique stable de la même production. Le contrôle humain antérieur de Boris sur le domaine public reste acquis ; aucun nouveau contrôle humain après ce déploiement n’est présumé.

Les validations préalables de société Stripe, facture de production, Worker et parcours public ont été déclarées terminées par Boris avant ce lot. Ce déploiement ne relance pas ces recettes et n’ouvre pas les achats. La réception de l’ISBN n’activera pas automatiquement la vente : finaliser le PDF et son empreinte, puis appliquer la décision d’ouverture.

## Traçabilité et reprise

Le paquet exact de publication est conservé en privé sous `.wrangler/sales-production/releases/2026-10-15-extrait-accueil/`. Le build a été copié explicitement avec ses Functions et dépendances locales, sans copie globale du dépôt éditorial. Les preuves sont dans `.wrangler/sales-production/publication-2026-10-15-{before,deployment,manifest,http,browser}.json` et les captures du même préfixe. Le manifeste contient les empreintes des fichiers publiés ; il ne représente pas une révision Git.

Commande utilisée après constitution du paquet :

```sh
CLOUDFLARE_ACCOUNT_ID=10434902b076f59013c4ec2189997cdd npx wrangler pages deploy dist --project-name qognito-site --branch main --cwd .wrangler/sales-production/releases/2026-10-15-extrait-accueil --commit-dirty=true --commit-message 'Publier extrait PDF et améliorations accueil/formations ; ventes fermées'
```

Les futurs déploiements doivent repartir d’un build actualisé. Ne pas réutiliser un ancien dossier `dist` de préparation ni relancer le provisionnement Stripe pour une retouche de pages.
