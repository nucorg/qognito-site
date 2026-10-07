# Livre blanc : publication sur Cloudflare Pages

## Architecture livrée

Astro reste statique. Le navigateur envoie le formulaire en JSON à `https://api.web3forms.com/submit`. Le PDF devient visible après une réponse HTTP positive **et** `success: true`. Cette réponse signifie prise en charge par Web3Forms ; elle ne prouve pas la livraison de l’email ni le téléchargement effectif du PDF. Aucun backend, CRM cloud ou identifiant SMTP n’est installé.

La clé Web3Forms est publique par conception. La boîte destinataire est associée à cette clé chez Web3Forms, pas librement choisie par le navigateur. Activer la restriction de domaine si l’offre du compte la permet. Le honeypot `botcheck` est présent ; Web3Forms le considère désormais comme une protection limitée. Surveiller les soumissions et envisager un captcha pris en charge si les abus apparaissent. Les doubles clics sont bloqués dans le navigateur ; après une panne réseau, un nouvel essai peut créer un doublon, identifiable par `request_id`.

Sources vérifiées le 29 septembre 2026 : [documentation](https://docs.web3forms.com/), [honeypot](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection), [politique](https://web3forms.com/privacy), [DPA](https://web3forms.com/dpa).

## Parcours en français, anglais et espagnol

La page de téléchargement existe en français (`/livres-blancs/la-facture-fantome-ia/`), en anglais (`/en/livres-blancs/la-facture-fantome-ia/`) et en espagnol (`/es/livres-blancs/la-facture-fantome-ia/`). Les liens de l’accueil et de SAGA-IA respectent la langue de la page ; le sélecteur FR/EN/ES ouvre la page équivalente lorsqu’elle existe. Chaque page fournit son PDF : français version 2.0, anglais version 3.0 et espagnol version 1.0. Les chemins et versions sont définis par langue dans `src/config/whitepaper.ts`. La politique de confidentialité existe en français et en espagnol ; la page anglaise renvoie vers la version française.

Les trois pages partagent `src/components/WhitepaperPage.astro`, les traductions dans `src/content/whitepaper.ts` et le script du formulaire. Une même clé Web3Forms suffit. Les notifications contiennent `livre_blanc_version` (`2.0` en FR, `3.0` en EN, `1.0` en ES), `form_language` (`fr`, `en` ou `es`) et le texte exact de la demande de contact affiché au lecteur (`contact_statement`). `contact_requested` conserve les valeurs `oui` ou `non` dans les trois langues pour faciliter le suivi.

## Activation

1. Exporter et vérifier les PDF finaux depuis les manuscrits corrigés. Copier le PDF français dans `public/livres-blancs/la-facture-fantome-ia-v2.pdf`, le PDF anglais dans `public/livres-blancs/the-ai-costs-you-dont-see-en-v3.pdf` et le PDF espagnol dans `public/livres-blancs/la-factura-fantasma-ia-v1.pdf` ; ne pas publier de PDF provisoire. La version ES v1.0 fournie par Qognito Content a été déclarée prête à publier par Boris le 7 octobre 2026.
2. Créer le formulaire dans le compte Web3Forms de Qognito et associer la bonne boîte. Vérifier ses quotas, l’antispam et la réception effective des notifications.
3. Examiner le DPA et les transferts avec Web3Forms ; déterminer comment demander/suivre les suppressions. Sa politique prévoit jusqu’à **trois ans de conservation**, distincts des 30 jours / 12 mois chez Qognito. Ne pas déclarer que ce prestataire ne stocke aucune donnée. Si cette durée n’est pas acceptable, demander une durée plus courte au fournisseur avant ouverture.
4. Dans Cloudflare Pages, configurer les variables publiques de `.env.example` : clé de formulaire, fournisseur/localisation/garanties de la messagerie. Ne jamais mettre de mot de passe dans ces variables publiques.
5. Préparer le fichier local et une sauvegarde restaurable ; effectuer les contrôles ci-dessous.
6. Passer `PUBLIC_WHITEPAPER_ENABLED=true`, recompiler et déployer. Le build échoue si la clé, l’un des trois PDF ou les informations de messagerie manquent. Les trois fichiers doivent commencer par la signature PDF attendue. Sans activation, la page reste informative et **aucun champ de collecte ni clé n’est rendu**.

Le site se compile avec `npm run build` vers `dist/`. `_headers` est prévu pour Cloudflare Pages : les PDF reçoivent `X-Robots-Tag: noindex, noarchive`. Vérifier ces en-têtes sur la réponse HTTP du déploiement. Cela limite l’indexation ; le lien PDF reste accessible et partageable. La collecte n’est pas un contrôle d’accès.

L’ancien fichier français `la-facture-fantome-ia-v1.pdf` reste accessible pour les liens déjà partagés ; aucun formulaire courant ne le propose. Les fichiers sont copiés depuis les PDF fournis, sans recompression ni modification du contenu. Les trois fichiers courants sont sous `/livres-blancs/` et bénéficient des mêmes en-têtes Cloudflare PDF.

## Suivi local et sauvegarde

Créer les fichiers vierges : `python3 scripts/init-crm.py`. Le dossier `~/Qognito-CRM/` est privé et hors Git. Lire sa procédure avant d’y placer des contacts réels. `prospects.ods` contient Prospects, Oppositions et Guide. Ne jamais copier de formule depuis un email.

Restic doit être installé. Créer un fichier de mot de passe fort (permissions 600) hors de `~/Qognito-CRM/` et du disque de sauvegarde ; conserver une copie indépendante dans un gestionnaire de mots de passe. Ne pas committer ce secret.

Configurer `~/Qognito-CRM/backup.json` avec un **support réellement monté**, un dépôt dédié (ex. `/media/boris/geddy-backup/qognito-crm-restic`), le dossier source et le chemin du fichier de mot de passe. Le script refuse un volume absent pour ne pas remplir le disque système par erreur. Ne pas utiliser le dépôt d’une autre sauvegarde.

```sh
python3 scripts/crm-backup.py init
python3 scripts/crm-backup.py backup
python3 scripts/crm-backup.py check
python3 scripts/crm-backup.py restore --target /tmp/qognito-restauration-controle
```

Ouvrir le fichier restauré et comparer les données. Après ce test, copier les deux fichiers de `scripts/systemd/` dans `~/.config/systemd/user/`, exécuter `systemctl --user daemon-reload` puis `systemctl --user enable --now qognito-crm-backup.timer`. Les scripts refusent une restauration dans un dossier existant. La tâche fonctionne dans la session utilisateur ; le PC doit être allumé et le disque monté. Fermer LibreOffice avant 19 h. Consulter les échecs avec `journalctl --user -u qognito-crm-backup.service` et la planification avec `systemctl --user list-timers`.

Configurer un second dépôt indépendant sur un autre disque avec un autre fichier JSON ; l’exécuter chaque semaine avec `--config CHEMIN`. Garder ce disque dans un autre lieu et effectuer un contrôle de restauration trimestriel. Sans deuxième support, il n’y a pas de protection contre la perte simultanée du PC et de son disque de sauvegarde.

L’expiration utilise `forget --keep-within 90d --prune` dans le dépôt dédié et s’applique lors des sauvegardes réussies. Un disque débranché peut garder des snapshots plus anciens jusqu’à sa reconnexion : réappliquer la rétention avant de le remettre en stockage. Après restauration, réappliquer les suppressions/oppositions récentes avant toute relance.

## Recette avant communication

- Tester sur mobile et ordinateur, clavier seul, JavaScript absent et email invalide.
- Refus API, timeout et réseau indisponible : pas de PDF présenté comme obtenu, données conservées pour réessayer.
- Réponse positive : lien PDF valide, formulaire masqué, focus sur la confirmation.
- Honeypot rempli : aucune requête émise. Double clic : une seule requête.
- Case facultative : `contact_requested=non` par défaut ; télécharger sans cocher doit fonctionner.
- Contrôler dans la boîte réelle : notice/version, demande de contact, provenance, identifiant, absence de données inutiles ; supprimer le contact de test ensuite.
- Contrôler Cloudflare : CSS et JS chargés, PDF 200, type PDF et en-tête de désindexation.
- Effectuer une sauvegarde et une restauration réelles, puis vérifier le traitement d’une suppression.

Ne pas utiliser les formulaires publics pour des tests d’envoi sans accord explicite : les tests navigateur peuvent intercepter l’API et simuler sa réponse. Aucun message de lancement n’est envoyé par les scripts.

## Tests reproductibles

`npm run test:form` crée une copie temporaire isolée du projet, des PDF de test et des réponses Web3Forms simulées. La configuration de production n’est pas modifiée. Chrome installé localement est utilisé lorsqu’il est disponible ; sinon installer Chromium avec `npx playwright install chromium`, ou définir `CHROME_BIN` vers un navigateur compatible. Les captures sont écrites dans `/tmp/qognito-livre-blanc-{fr,en,es}-{desktop,mobile}.png`.

`npm run test:crm` vérifie le tableur vierge, ses permissions, la préservation de données existantes et le refus de sauvegarde sans configuration. Cela ne remplace pas un test de restauration avec les supports réels.

## PDF anglais corrigé — version 3.0, 2 octobre 2026

Titre EN retenu par Boris : **The AI Costs You Don’t See**. Le fichier fourni `the-ai-costs-you-dont-see-en-v3.pdf` est intégré à l’identique dans `public/livres-blancs/`. Sa couverture porte le titre attendu et ses pieds de page indiquent « Version 3.0 ». Cette version remplace l’export v2 qui conservait un titre différent et des pieds de page « Version 1.0 ».

Les notifications EN indiquent désormais `livre_blanc_version=3.0`. Le PDF français et sa version `2.0` restent inchangés. Les anciennes adresses des PDF anglais v1 et v2 sont redirigées directement vers la v3 par Cloudflare (301) ; ces anciens fichiers ne sont plus présents dans le dossier public. Les pages web FR/EN/ES conservent leurs adresses. Le serveur `astro preview` ne reproduit pas les règles `_redirects` de Cloudflare.
