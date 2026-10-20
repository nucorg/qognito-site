# Ouverture des achats — préparation du 20 octobre 2026

Axe II · Cible I. **Préparation réalisée ; achats fermés.** L’instruction d’implémenter le plan ne vaut pas autorisation d’activation. Aucun paiement réel ou fictif n’a été créé pendant cette préparation.

## Décisions et résultat

Boris a retenu les corrections gratuites remises manuellement, une mention sur les pages produit FR/EN/ES, une sauvegarde commerce chiffrée séparée sur le SSD existant, une seconde copie indépendante ultérieure et la récupération du mot de passe via son gestionnaire. **Boris a confirmé la copie dans ce gestionnaire.**

| Élément | Résultat |
|---|---|
| Politique de corrections | Règle retenue, journal éditorial créé, suivi privé des remises initialisé sans donnée client. Aucun message envoyé. |
| Information des lecteurs | Trois blocs intégrés dans la branche de préparation, alignés dans une fiche de relecture. Non publiés ; relecture des blocs par Boris attendue. |
| Sauvegarde | Dépôt Restic commerce créé sur le SSD identifié par son UUID, distinct du CRM. Exports de production et restaurations isolées réussis. |
| Planification | Service utilisateur installé avec copie stable du programme, quotidien à 20 h Paris ; rattrapage horaire et au démarrage. Exécution forcée depuis systemd réussie. |
| Récupération | Clé locale privée, exclue des sauvegardes ; copie dans le gestionnaire confirmée par Boris. |
| Production | Toujours au commit `33f113d`, Pages `5e7d6d11`, Worker `c7af4f82` ; achats fermés, aucune publication de cette branche. |

Le PDF complet r2 et l’extrait sont inchangés : empreintes `e723caa4…` et `6a114f94…`, édition FR 1.1, 93 pages, ISBN 979-10-990773-0-1. Le prix reste 49,99 € TTC et les CGV restent `2026-10-14-v2`.

## Textes à relire

Fiche complète : `qognito-content/localisations/site/2026-10-20-ouverture-commerce/relecture-bilingue.md`.

Les trois langues précisent le périmètre de l’édition française achetée. La mention explique gratuité, relevé des changements, référence de commande et page à transmettre, remise possible par email après vérification, exclusions des enrichissements/traductions/autres volumes et maintien des garanties. Aucun délai public ajouté. Les éditions EN/ES restent annoncées à venir, sans achat ni précommande.

Les passes de comparaison, relecture linguistique et intégrité portent sur tous les blocs ajoutés et leurs dépendances. Le skill `localiser-site-qognito` exige la relecture humaine de ces blocs avant leur publication ; l’accord sur le workflow ne valide pas les textes.

## Sauvegarde réellement installée

Le programme `scripts/commerce-backup.py` et sa copie stable installée proposent : `init`, `backup`, `backup-if-due`, `status`, `check`, `restore --target <dossier-neuf>`. Configuration, état, journaux, mode d’emploi et restaurations dans `~/Qognito-Commerce`, hors du dépôt public.

Le paquet inclut l’export SQL complet, les PDF cités dans cet export et le catalogue publié, leur intégrité, le code du commit publié, les configurations Pages/Worker, le bundle Worker, quatre secrets de reprise explicitement sélectionnés, le programme de sauvegarde et son manifeste. Le travail local non publié est distingué du code réellement déployé. Le mot de passe Restic et l’OAuth Cloudflare ne sont pas sauvegardés avec le paquet.

Le SSD doit être monté avec l’UUID attendu. L’export et les téléchargements doivent réussir avant toute annonce de sauvegarde. Rétention 90 jours, hôte/étiquette stables ; simulation de rétention avant purge, uniquement après un snapshot réussi et une première restauration vérifiée. Aucun accès aux données du dépôt CRM.

Premières preuves : snapshots `738ce4ed…` et `68dd04eb…`, tous deux restaurés ; contrôle Restic réussi. Huit tables exportées, cinq migrations, zéro commande réelle, un PDF référencé par le catalogue. Le second snapshot provient d’un service systemd avec Node 22.22.0 et Wrangler du projet. Les snapshots suivants et leur statut sont dans le fichier privé `status.json`.

Une première tentative d’export a reçu une erreur d’authentification Cloudflare 10000, sans faux succès. Les tentatives suivantes, y compris systemd, ont réussi avec les autorisations existantes. La cause exacte du refus ponctuel n’est pas établie.

La protection dépend de la disponibilité du PC et du SSD. La seconde copie indépendante reste différée. Restauration trimestrielle à refaire ; les restaurations effectuées ici n’ont écrit ni dans D1 ni dans R2 et n’ont déclenché aucun paiement/email.

## Contrôles et critères d’acceptation

- Neuf tests de sauvegarde : échéances/rattrapage, support absent ou incorrect, concurrence, échec export/authentification, intégrité SQL/PDF, ancienne référence absente, refus d’écrasement et véritable aller-retour Restic sur données synthétiques.
- Cinq suites commerciales, dont contrôle de préparation : fermé par défaut, ouverture exigeant les marqueurs exacts, refus d’une empreinte périmée ou d’une clé test.
- Build Astro/Worker ES2021 et contrôle des artefacts : PDF complet privé, extrait inchangé.
- 46 contrôles du formulaire de livre blanc, aucun email réel.
- Six parcours navigateur locaux fermés, six avec ouverture **simulée localement**, puis six de production fermée. FR/EN/ES, mobile/bureau, textes ajoutés vérifiés localement, ISBN, liens, extrait, formulaire FR et absence de formulaire EN/ES.
- Lecture Stripe : prix live actif 4999 EUR, ponctuel et TTC, édition attendue, TVA 5,5 % inclusive, configuration carte et webhook actifs. Aucun objet recréé.
- Lecture Cloudflare : D1/R2 de production corrects sur Pages et Worker, mode live, checkout fermé, aucun marqueur d’ouverture.

Preuves privées : `.wrangler/ouverture-2026-10-20/` ; état et logs de sauvegarde dans `~/Qognito-Commerce`. Les sorties publiques n’exposent ni secret ni lien de téléchargement signé.

## Décision restant à prendre

**Boris doit relire les trois blocs et autoriser explicitement leur publication ainsi que l’ouverture des achats.** La récupération de la clé et la restauration sont déjà confirmées. Aucun nouvel accord sur le PDF ou les validations Stripe acquises n’est demandé.

Après cet accord seulement :

1. Consigner les textes approuvés et l’accord d’ouverture. Alignement du catalogue (`channels.direct.enabled`, `launch.approved`) et des manuels ; préparer le lot sans toucher au PDF/CGV. Pour les contrôles du catalogue ouvert, utiliser `QOGNITO_VOLUME_EXPECT=open`.
2. Publier le code et les textes approuvés via `main`, achats techniquement fermés. Vérifier ce déploiement et les blocs FR/EN/ES avant activation.
3. Mettre à jour les variables Pages production en conservant tous les autres réglages/secrets : `COMMERCE_LIVE_APPROVED=2026-10-14-v2`, `COMMERCE_PDF_APPROVED_SHA256=e723caa4563afe7ac09dae3d06e3eadabfae98975dd4364d7ad33a4d0020c4a8`, puis `COMMERCE_CHECKOUT_ENABLED=true`. Reporter ces valeurs dans la configuration privée Pages de production et redéployer pour les appliquer. Le Worker de traitement continue de fonctionner ; aucun nouveau provisionnement Stripe.
4. Contrôler la configuration avec `--expect=open` et le navigateur avec `QOGNITO_VOLUME_EXPECT=open`. Attendre `enabled:true`, `test:false`, consentements FR visibles, EN/ES toujours sans formulaire d’achat. Ces contrôles ne soumettent aucun paiement.
5. En cas d’anomalie : remettre le verrou Pages à false et redéployer, vérifier HTTP 503 et formulaire masqué. Conserver Worker/webhooks et droits existants. Aligner ensuite le catalogue et consigner l’incident.
6. Consigner commit, déploiements, accord, disponibilité et résultats dans les manuels. Un premier achat réel reste une décision séparée.
