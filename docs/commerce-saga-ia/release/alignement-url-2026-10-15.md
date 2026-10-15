# Alignement des URL de pages — 15 octobre 2026

Axe II · Cible I. Correctif technique de référencement.

## État

**Correctif contrôlé ; publication autorisée par Boris le 15 octobre 2026, avec maintien des ventes fermées.** Version de départ : commit `c6b62c8`, déploiement `90ea46d9`.

Cette note décrit le correctif et sa recette locale. Les références finales de publication et les contrôles en ligne sont suivis dans la section « Dernière publication » de `~/VIBE/MANUEL_SITEWEB.md` et dans les preuves privées `.wrangler/sales-production/seo-release-2026-10-15/`.

## Constat et choix

Search Console signale notamment des pages actuelles sans barre oblique finale comme redirigées, ainsi que `/formations/` et `/graphe-des-procedes/` comme variantes canoniques. Boris a confirmé dans son navigateur que `/formations`, `/en/formations` et `/livres-blancs/la-facture-fantome-ia` aboutissent aux versions avec `/` final ; `/formations/` conserve cette adresse.

Le site génère les pages sous la forme `chemin/index.html`, mais sa table de routes déclarait les adresses sans `/` final dans les balises canoniques, les liens entre langues et le sitemap. La convention retenue pour les pages HTML est donc l’adresse avec `/` final.

Les requêtes automatisées effectuées pendant le diagnostic ont été refusées sur les domaines public et technique. Les destinations publiques ci-dessus reposent sur la confirmation de Boris. Aucune conclusion supplémentaire n’est tirée sur l’accès de Googlebot ou sur l’indexation effective.

## Correctif

- Astro : `trailingSlash: 'always'` et format de construction `directory` explicites. L’hébergeur reste responsable des redirections des pages statiques.
- Table des routes FR/EN/ES : `/` final sur les pages, propagé aux canoniques, `hreflang`, sitemap, navigation et liens partagés.
- Suppression de l’ajout manuel de `/` dans les liens du livre blanc et du bouton Formations pour éviter les doubles barres.
- Cibles des anciennes redirections FAQ/expertise espagnoles et lien espagnol de confidentialité alignés.
- Assertions existantes des tests navigateur adaptées aux adresses exactes avec `/` final.

## Contrôles réalisés

- Build complet avec les variables publiques de `wrangler.jsonc` : réussi, 30 pages et compilation du module Functions.
- Audit des fichiers générés : 29 URL uniques de sitemap, canoniques identiques à ces URL, variantes linguistiques cohérentes et réciproques, 30 pages avec canonique propre, 515 occurrences de liens locaux vers des pages contrôlées ; aucune double barre ni destination locale manquante. La confirmation de commande reste hors du sitemap.
- Comparaison au dossier `dist` présent avant intervention : textes visibles des 30 pages identiques ; fichiers PDF, images, scripts et module Functions identiques par SHA-256. Les modifications générées concernent les pages HTML, le sitemap et les redirections.
- Prévisualisation Astro : les 29 URL du sitemap répondent directement HTTP 200, sans redirection.
- `npm run test:form` : 46 contrôles réussis ; envois simulés, aucun email réel envoyé.
- `npm run test:sales:browser` : réussi en FR/EN/ES, largeurs 390 et 1 280 px ; disponibilité et checkout simulés, aucun paiement effectué.
- `git diff --check` : réussi.

Les comparaisons et réponses HTTP de cette session sont conservées temporairement dans `/tmp/qognito-seo-bo8qtsg3/`. Les captures des tests sont dans `/tmp/qognito-livre-blanc-*` et `/tmp/qognito-volume-*` ; ces chemins ne constituent pas une archive durable.

## Publication et suivi

1. Enregistrer les seuls fichiers de ce correctif puis publier via GitHub ; le push sur `main` déclenche la construction Cloudflare. Les rapports locaux déjà présents sous `docs/rapports/` restent hors du lot.
2. Contrôler la réussite du déploiement et vérifier en ligne le sitemap, les canoniques et les destinations finales. Vérifier aussi que la disponibilité commerciale reste fermée.
3. Dans Search Console, inspecter les versions finales avec `/`, notamment Formations et le livre blanc ; demander leur indexation si nécessaire et suivre la date de nouvelle exploration. L’indexation reste une décision de Google.
4. Les anciennes FAQ et l’adresse HTTP peuvent légitimement rester dans « Page with redirect ». Ne pas chercher à supprimer toutes les exclusions de ce rapport. L’état des variantes ne changera qu’après réexploration.

## Références

- [Google — rapport d’indexation](https://support.google.com/webmasters/answer/7440203?hl=fr).
- [Google — cohérence des URL canoniques](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=fr).
- [Cloudflare Pages — distribution des pages statiques](https://developers.cloudflare.com/pages/configuration/serving-pages/).
