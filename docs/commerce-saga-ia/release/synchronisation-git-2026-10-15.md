# Version Git du site publié — 15 octobre 2026

Axe II · Cible I. À la demande de Boris, les changements de préparation marchande et de présentation déjà publiés sont regroupés pour intégration dans `main`. Le comportement de production est conservé, avec les achats fermés.

## Périmètre conservé

- Code de vente et de livraison privée, facturation, alertes, migration 0005 et contrôles associés.
- Configuration Pages de production et configuration du Worker, sans secrets. Les identifiants de ressources et de catalogue ne sont pas des identifiants d’authentification.
- Textes et mentions validés, pages FR/EN/ES, encart partagé sur l’accueil et Formations, extrait public de trois pages.
- Procédures de préparation et rapports de recette/publication, y compris les propositions de correction et de sauvegarde identifiées comme telles.

Les fichiers `.env*`, `.dev.vars*` et `.wrangler/` restent exclus de Git ; seuls les exemples explicitement prévus peuvent être suivis. Les valeurs des quatre secrets réels ont été recherchées dans les fichiers sélectionnés sans être affichées : aucune occurrence. Les alertes du scan de motifs correspondent à des identifiants Stripe de remboursement en sandbox et aux URL fictives `fixture` / `settled` des tests.

Les deux rapports locaux sous `docs/rapports/` (passation ES du 7 octobre et télémétrie mensuelle) ne font pas partie de ce lot. Le PDF complet payant reste hors du dépôt public ; seul l’extrait sélectionné est ajouté.

## Reconstruction depuis les fichiers Git

Une copie isolée a été créée depuis l’index Git, sans `.env`, sans `.wrangler` et sans dépendances locales. Après `npm ci`, le build avec les variables `PUBLIC_*` de `wrangler.jsonc` produit **89 fichiers strictement identiques**, par SHA-256, au paquet publié à 12 h 03 (`c43b459d`). Le code `server/`, les Functions et le catalogue marchand correspondent également au paquet publié.

- Build propre : réussi, 30 pages, aucune différence d’empreinte.
- `npm run test:form` dans cette copie : **46 contrôles réussis**, aucun email réel envoyé.
- `npm run test:commerce` : réussi dans le dépôt de travail disposant du PDF éditorial privé. La suite contrôle aussi l’empreinte de ce fichier et exige sa présence au chemin déclaré par le catalogue ; son absence dans une copie Git autonome est normale. Le build du site, lui, n’en dépend pas.
- Les 18 contrôles navigateur de la publication à 12 h 03 restent documentés dans [publication-site-2026-10-15.md](publication-site-2026-10-15.md).

## Publication depuis GitHub

La configuration Cloudflare vérifiée le 15 octobre relie le projet `qognito-site` à `nucorg/qognito-site`, branche de production `main`. Les déploiements automatiques sont activés ; la commande de build est `npm run build`, avec sortie `dist`.

Le push de cette version doit être suivi jusqu’au succès du déploiement correspondant au SHA Git, puis contrôlé sur le domaine technique de production : disponibilité fermée, refus de checkout, extraits et pages attendus. Les quatre secrets, les bindings D1/R2 et les variables de fermeture doivent rester présents. Les références finales et les réponses sont consignées dans les preuves privées `.wrangler/sales-production/git-reconciliation-*.json` et dans les manuels personnel et technique de Boris.

La synchronisation Git n’active pas les ventes. L’ISBN et le PDF final devront être intégrés au catalogue et au stockage privé avant la décision d’ouverture. Aucun provisionnement Stripe, migration de production ou redéploiement du Worker n’est requis pour cette synchronisation des sources du site.

## Compatibilité de la construction Cloudflare

Le premier push (`ba01ec6`) a déclenché `aef322f5`, dont Astro a réussi la construction. La compilation automatique des Functions a ensuite échoué : le Wrangler 3.114.17 de la plateforme ne reconnaît pas l’attribut d’import JSON `with { type: 'json' }` dans `offer.mjs`. Ce déploiement n’a pas remplacé la production précédente.

`npm run build` compile désormais les Functions avec le Wrangler du projet, verrouillé par `package-lock.json`, dans `dist/_worker.js/index.js`. Cloudflare déploie ce module déjà généré au lieu de recompiler le dossier `functions` avec son ancien outil. Le routeur est toujours généré depuis les mêmes Functions ; il conserve le service de repli `ASSETS`, et `public/_routes.json` conserve le périmètre des API. Ce fonctionnement utilise le [mode avancé documenté par Cloudflare](https://developers.cloudflare.com/pages/functions/advanced-mode/).

Le fichier `.node-version` fixe Node 22.22.0, déjà utilisé localement. Le minimum déclaré dans `package.json` est 22.19.0, cohérent avec la dépendance Undici du Wrangler installé ; le Node 22.16.0 par défaut chez Cloudflare produisait un avertissement de compatibilité. Cloudflare documente la [sélection de Node par `.node-version`](https://developers.cloudflare.com/pages/configuration/build-image/).

La seconde construction (`a10937c`, déploiement `f3d58f27`) a compilé les Functions mais a révélé une autre incompatibilité : la plateforme repasse le module généré dans son ancien compilateur, qui produit une erreur d’initialisation `Object.defineProperty called on non-object`. L’erreur a été reproduite localement avec Wrangler 3.114.17. Une transformation ES2021 par la version d’esbuild verrouillée dans le projet abaisse les blocs statiques de classes avant ce second passage. Les huit contrôles de routage passent alors avec Wrangler 3.114.17 et 4.147.0 : pages statiques, disponibilité fermée, checkout refusé, protections commande/téléchargement/webhook, CGV et redirection de l’ancienne page de test. Les deux déploiements échoués ont laissé la version précédente en production.

Cette correction porte sur la fabrication et ne modifie ni le code marchand, ni les textes, ni les variables d’ouverture. Les 89 fichiers statiques restent identiques au paquet publié. Les preuves de compatibilité sont conservées dans `.wrangler/sales-production/git-reconciliation-compatibility.json`.
