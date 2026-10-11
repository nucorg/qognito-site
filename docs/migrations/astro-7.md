# Migration vers Astro 7

Date : 11 octobre 2026.

## Périmètre

Le recentrage des pages Formation FR, EN et ES sur SAGA-IA est sauvegardé
séparément dans le commit `363783e`. Il constitue la référence avant migration.

La migration passe d'Astro 6.4.4 à 7.3.8 sur la branche `chore/astro-7`, avec
Node.js 22.22.0. Le minimum Node déclaré reste compatible : 22.12.0.
Stripe, Playwright et Wrangler conservent leurs versions installées.

Référence : [guide officiel de migration Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/).

## Adaptations

- Dépendance Astro et fichier `package-lock.json` actualisés.
- `compressHTML: true` explicite pour conserver le traitement des espaces
  d'Astro 6 entre les éléments en ligne.
- Déclaration CSS préfixée placée avant `backdrop-filter` dans le bandeau et
  le menu mobile. Avec l'ordre précédent, la compilation Astro 7 supprimait la
  propriété standard et Chrome perdait le flou. Les valeurs calculées sont
  rétablies : 12 px pour le bandeau, 20 px pour le menu mobile.

Astro 7 détache par défaut les serveurs de développement et de prévisualisation.
Pour arrêter ceux lancés depuis ce projet :

```sh
npm run astro -- dev stop
npm run astro -- preview stop
```

## Contrôles effectués

- Compilation avant et après migration : 25 pages générées.
- Réinstallation avec `npm ci` réussie ; Astro 7.3.8 confirmé et compilation
  des 25 pages réussie après cette réinstallation.
- Formulaire : 46 contrôles réussis avant et après, sans envoi réel de courriel.
- Commerce : suites de tarification et Stripe réussies avec les services simulés.
- Comparaison navigateur de 25 routes en 1440 × 1000 et 390 × 1000 :
  50 comparaisons identiques pour les textes, métadonnées, liens, champs,
  positions et dimensions des éléments et captures de page complète.
- 52 fichiers statiques et 6 pages de redirection identiques octet par octet.
- Sur les pages Formation FR, EN et ES en prévisualisation : ouverture du menu
  mobile, flou calculé, accordéon et retour en haut avec restitution du focus
  vérifiés ; aucune erreur JavaScript relevée.
- Serveur de développement : page Formation EN servie en HTTP 200 avec le titre
  attendu, sans erreur JavaScript relevée.

Les comparaisons visuelles utilisent Chrome et bloquent les ressources externes
de façon identique dans les deux versions. Les iframes des graphes sont masquées
dans les captures ; leurs URL, leur géométrie et leurs fichiers statiques sont
comparés séparément. Ces contrôles ne couvrent pas un paiement réel, les services
externes, Safari ou Firefox.

Les preuves temporaires (captures et `comparison.json`) sont dans
`/tmp/qognito-astro7.79bVc0/` ; elles ne constituent pas une archive pérenne.

## Dépendances et publication

L'audit npm signale 5 vulnérabilités préexistantes (1 faible, 4 élevées), liées
à esbuild et à la chaîne Wrangler/Miniflare. Les versions concernées sont les
mêmes dans le verrouillage avant et après migration. Elles restent à traiter
dans une mise à jour distincte.

La migration est destinée à une intégration locale dans `main` après validation.
Aucun push ni déploiement n'est effectué dans cette opération. Le commit de
migration peut être annulé séparément du recentrage SAGA-IA ; exécuter ensuite
`npm ci` pour restaurer les dépendances correspondant au verrouillage.
