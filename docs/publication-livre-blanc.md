# Livre blanc : publication sur Cloudflare Pages

## Architecture livrée

Astro reste statique. Le navigateur envoie le formulaire en JSON à `https://api.web3forms.com/submit`. Le PDF devient visible après une réponse HTTP positive **et** `success: true`. Cette réponse signifie prise en charge par Web3Forms ; elle ne prouve pas la livraison de l’email ni le téléchargement effectif du PDF. Aucun backend, CRM cloud ou identifiant SMTP n’est installé.

La clé Web3Forms est publique par conception. La boîte destinataire est associée à cette clé chez Web3Forms, pas librement choisie par le navigateur. Activer la restriction de domaine si l’offre du compte la permet. Le honeypot `botcheck` est présent ; Web3Forms le considère désormais comme une protection limitée. Surveiller les soumissions et envisager un captcha pris en charge si les abus apparaissent. Les doubles clics sont bloqués dans le navigateur ; après une panne réseau, un nouvel essai peut créer un doublon, identifiable par `request_id`.

Sources vérifiées le 29 septembre 2026 : [documentation](https://docs.web3forms.com/), [honeypot](https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection), [politique](https://web3forms.com/privacy), [DPA](https://web3forms.com/dpa).

## Parcours en français et en anglais

La page de téléchargement existe en français (`/livres-blancs/la-facture-fantome-ia/`) et en anglais (`/en/livres-blancs/la-facture-fantome-ia/`). Les liens de l’accueil et de SAGA-IA respectent la langue de la page ; le sélecteur FR/EN passe d’une version du formulaire à l’autre. Chaque page fournit son propre PDF : français version 2.0 sur FR, anglais édition web 2.0 sur EN. Les chemins et versions sont définis par langue dans `src/config/whitepaper.ts`. La politique de confidentialité reste en français, avec cette précision dans le lien anglais.

Les deux pages partagent `src/components/WhitepaperPage.astro`, les traductions dans `src/content/whitepaper.ts` et le script du formulaire. Une même clé Web3Forms suffit. Les notifications contiennent `livre_blanc_version` (`2.0` en FR, `2.0` en EN), `form_language` (`fr` ou `en`) et le texte exact de la demande de contact affiché au lecteur (`contact_statement`). `contact_requested` conserve les valeurs `oui` ou `non` dans les deux langues pour faciliter le suivi.

## Activation

1. Exporter et vérifier le PDF final depuis le manuscrit corrigé. Copier le PDF français dans `public/livres-blancs/la-facture-fantome-ia-v2.pdf` et le PDF anglais dans `public/livres-blancs/the-ai-costs-you-dont-see-en-v2.pdf` ; ne pas publier de PDF provisoire.
2. Créer le formulaire dans le compte Web3Forms de Qognito et associer la bonne boîte. Vérifier ses quotas, l’antispam et la réception effective des notifications.
3. Examiner le DPA et les transferts avec Web3Forms ; déterminer comment demander/suivre les suppressions. Sa politique prévoit jusqu’à **trois ans de conservation**, distincts des 30 jours / 12 mois chez Qognito. Ne pas déclarer que ce prestataire ne stocke aucune donnée. Si cette durée n’est pas acceptable, demander une durée plus courte au fournisseur avant ouverture.
4. Dans Cloudflare Pages, configurer les variables publiques de `.env.example` : clé de formulaire, fournisseur/localisation/garanties de la messagerie. Ne jamais mettre de mot de passe dans ces variables publiques.
5. Préparer le fichier local et une sauvegarde restaurable ; effectuer les contrôles ci-dessous.
6. Passer `PUBLIC_WHITEPAPER_ENABLED=true`, recompiler et déployer. Le build échoue si la clé, l’un des deux PDF ou les informations de messagerie manquent. Les deux fichiers doivent commencer par la signature PDF attendue. Sans activation, la page reste informative et **aucun champ de collecte ni clé n’est rendu**.

Le site se compile avec `npm run build` vers `dist/`. `_headers` est prévu pour Cloudflare Pages : les PDF reçoivent `X-Robots-Tag: noindex, noarchive`. Vérifier ces en-têtes sur la réponse HTTP du déploiement. Cela limite l’indexation ; le lien PDF reste accessible et partageable. La collecte n’est pas un contrôle d’accès.

L’ancien fichier `la-facture-fantome-ia-v1.pdf` reste accessible pour les liens déjà partagés ; aucun formulaire courant ne le propose. Les fichiers sont copiés depuis les PDF fournis, sans recompression ni modification du contenu. Les deux fichiers courants sont sous `/livres-blancs/` et bénéficient des mêmes en-têtes Cloudflare PDF.

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

`npm run test:form` crée une copie temporaire isolée du projet, un PDF de test et des réponses Web3Forms simulées. La configuration de production n’est pas modifiée. Chrome installé localement est utilisé lorsqu’il est disponible ; sinon installer Chromium avec `npx playwright install chromium`, ou définir `CHROME_BIN` vers un navigateur compatible. Les captures sont écrites dans `/tmp/qognito-livre-blanc-fr-desktop.png`, `/tmp/qognito-livre-blanc-fr-mobile.png` et leurs variantes `en`.

`npm run test:crm` vérifie le tableur vierge, ses permissions, la préservation de données existantes et le refus de sauvegarde sans configuration. Cela ne remplace pas un test de restauration avec les supports réels.

## Remplacement urgent du PDF anglais — 2 octobre 2026

Titre EN retenu par Boris : **The AI Costs You Don’t See**. Le fichier livré sous le nom `THE AI HIIDEN COSTS YOU DONT SEE - Qognito - v2.pdf` est intégré sans modification sous `the-ai-costs-you-dont-see-en-v2.pdf`. L’édition web EN est identifiée `2.0` dans les notifications. L’ancienne adresse du PDF anglais est redirigée par Cloudflare (301) ; l’ancien fichier est retiré du dossier public. Les pages web FR/EN conservent leurs adresses.

Écart observé dans le PDF fourni : couverture « The AI Hidden Costs You Don’t See » et pieds de page « Version 1.0 ». Ces mentions imprimées n’ont pas été retouchées ; un export harmonisé avec le titre et la version du site reste nécessaire. La redirection du PDF est définie dans `_redirects` : le serveur `astro preview` ne reproduit pas les règles Cloudflare.
