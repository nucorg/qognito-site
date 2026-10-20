# Commerce — proposition de sauvegarde de production

Axe II · Cible I. Préparée le 14 octobre 2026. **Installée et éprouvée le 20 octobre 2026 après choix explicite de Boris.** Dépôt commerce distinct sur le SSD existant, quotidien à 20 h Paris, rétention 90 jours, rattrapage horaire. Deux snapshots de production ont été créés puis restaurés localement, dont un exécuté depuis systemd. Le timer est actif. Boris a confirmé la copie du mot de passe dans son gestionnaire accessible depuis un autre appareil. La seconde copie indépendante reste différée.

Programme : `scripts/commerce-backup.py`, copie installée stable dans `~/Qognito-Commerce/bin/`. Configuration et mode d’emploi privés : `~/Qognito-Commerce/backup.json` et `UTILISATION.md`. Le dépôt CRM reste indépendant et son timer inchangé. L’autorisation d’ouverture des achats reste attendue.

## Configuration retenue et installée

| Paramètre | Proposition pour le lancement |
|---|---|
| Destination | SSD monté sur `/media/boris/geddy-backup`, dans un **dépôt Restic séparé** `qognito-commerce-restic`. Le dépôt prospects `qognito-crm-restic` reste indépendant. |
| Chiffrement | Chiffrement Restic des sauvegardes ; le SSD lui-même est en ext4, sans chiffrement complet constaté. Mot de passe conservé hors du dépôt, avec copie de récupération hors du PC. |
| Fréquence | Une sauvegarde quotidienne à **20 h, heure de Paris**, et une sauvegarde avant migration, changement d’édition ou intervention sur le registre. |
| Rattrapage | Tâche utilisateur persistante ; au redémarrage ou à la reconnexion du SSD, réessayer si aucune sauvegarde récente n’a réussi. Pas de succès silencieux lorsque le support manque. |
| Conservation | **90 jours d’historique**, avec purge seulement après sauvegarde réussie et limitée au dépôt commerce. Les éditions PDF immuables restent dans la source sauvegardée, même après arrêt de leur vente. |
| Contrôles | Import local du SQL et vérifications d’intégrité ; SHA-256 des PDF ; statut daté de la dernière réussite ; alerte locale sur échec. Contrôle Restic et restauration trimestrielle dans une destination isolée. |
| Limite | PC et SSD doivent être disponibles. Une sauvegarde quotidienne peut perdre les changements survenus depuis sa dernière réussite ; l’absence du PC/SSD prolonge cette période. Stripe devra être réconcilié lors d’une restauration. |
| Seconde copie | Prévoir ensuite une copie chiffrée sur un support indépendant, conservé séparément. Le SSD branché au PC ne couvre pas leur perte simultanée. |

Le mot de passe Restic ne doit être ni affiché dans le terminal ni incorporé au dépôt qu’il protège. La clé locale reste hors du dépôt et hors du paquet sauvegardé ; sa copie dans le gestionnaire a été confirmée par Boris le 20 octobre. Aucun secret n’a été affiché.

## Ce qui doit être sauvegardé

1. **D1 production** : export SQL complet de `qognito-commerce-production`, ID `73e36ed0-aea8-48a7-9606-aadbbe7496d5`. Inclure migrations, commandes, contrats, événements, factures et alertes ; aucun prélèvement ni modification des données distantes.
2. **PDF privés** : toutes les éditions encore référencées par des commandes et l’édition proposée aux nouveaux acheteurs. La liste est calculée depuis les références du SQL exporté et le catalogue du commit réellement déployé. Au 20 octobre : PDF r2, clé R2 `saga-ia/volume-01/fr/1.1/saga-ia-volume-01-fr-v1.1-isbn-9791099077301-r2.pdf`, SHA-256 `e723caa4563afe7ac09dae3d06e3eadabfae98975dd4364d7ad33a4d0020c4a8`. Les commandes de production sont encore absentes ; l’export contient huit tables dont cinq migrations. Relire le fichier depuis le bucket privé de production et comparer l’empreinte.
3. **Configuration et code nécessaires à la reprise** : catalogue, manifeste éditorial, migrations, configuration Pages/Worker et sources de la version publiée. Git seul ne couvre pas les fichiers de travail non commités ; relever le commit et l’écart local. Une copie quotidienne du travail local ne doit pas être étiquetée automatiquement « code exact déployé ».
4. **Secrets nécessaires à la reprise**, dans la sauvegarde chiffrée : Stripe, webhook, signature des liens et Resend. Les copier par une liste explicite depuis les fichiers privés du commerce ; ne pas collecter toutes les variables d’environnement ou toutes les clés du poste.
5. **Manifeste de sauvegarde** : date, environnement, identifiants de ressources, version de migration, empreintes, résultat des contrôles et référence du snapshot Restic. Aucune donnée client dans le journal public.

Cette sauvegarde technique ne remplace pas l’archivage comptable de l’entreprise. Une rétention de 90 jours ne supprime pas les commandes de D1 ni les factures Stripe ; elle limite l’historique de récupération. Réappliquer suppressions et corrections intervenues depuis le snapshot lors d’une restauration.

## Séquence de référence — réalisée le 20 octobre

1. Vérifier le montage du bon SSD avant toute création ; refuser d’écrire dans un simple dossier local portant le même nom.
2. Initialiser le nouveau dépôt chiffré sans toucher au dépôt prospects. Préparer une configuration privée et une commande dédiée au commerce.
3. Exporter D1 avec Wrangler dans un dossier temporaire privé hors Git ; garder sa sortie dans un journal privé, car elle peut contenir un lien temporaire. Télécharger les objets R2 en lecture seule.
4. Contrôler l’export et les empreintes, puis sauvegarder le paquet stable dans Restic. Un téléchargement R2 ne constitue pas à lui seul une sauvegarde validée.
5. Restaurer immédiatement cette première sauvegarde dans un dossier neuf ; importer son SQL dans SQLite local et vérifier les données et fichiers. La recette distante du 14 octobre a déjà éprouvé le mécanisme d’import D1/R2 isolé ; elle ne valide pas ce nouveau dépôt SSD avant son essai.
6. Installer ensuite le timer de 20 h et son rattrapage ; vérifier son prochain passage et le statut lisible par Boris. Utiliser le Node/Wrangler effectivement installés, car un service systemd ne charge pas automatiquement le shell interactif ni NVM.
7. Fournir à Boris les commandes simples : sauvegarder maintenant, voir la dernière réussite, contrôler le dépôt, restaurer dans un dossier neuf. Faire vérifier la copie de récupération du mot de passe hors PC.

La synchronisation automatique de l’authentification Wrangler doit être éprouvée dans le service. Une expiration de session ou une révocation doit produire un échec visible ; aucune nouvelle clé aux droits complets n’est requise par principe.

## Précautions d’exploitation déjà identifiées

Un export D1 en cours peut bloquer temporairement les autres requêtes de la base : commencer hors activité forte, mesurer sa durée et adapter la méthode si le volume de données augmente. La production est encore fermée aux achats. [Export D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

D1 propose aussi Time Travel, avec une fenêtre dépendant de l’offre Workers (7 ou 30 jours selon la documentation consultée). Le forfait de zone Cloudflare Pro ne permet pas d’en déduire l’offre Workers. Cette fonction reste une aide de récupération chez Cloudflare ; elle ne sauvegarde pas les PDF R2 ni les secrets sur un support indépendant. [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

La politique de conservation Restic doit être limitée au dépôt commerce et groupée par hôte/étiquette stables, pas par nom de dossier temporaire. Avant la première purge, vérifier sa simulation. [Conservation Restic](https://restic.readthedocs.io/en/stable/060_forget.html).

En cas de vraie restauration de production, suivre [la procédure technique](exploitation.md#sauvegarder-et-restaurer--procédure-technique) : fermer les achats, suspendre les traitements, restaurer dans des ressources isolées, réconcilier Stripe, traiter les liens révoqués, vérifier, puis reprendre. Une simple restauration de contrôle n’envoie aucun email et ne relance aucun paiement.

## Preuves et limites de cette installation

- Tests automatisés : neuf scénarios, dont un aller-retour réel Restic sur données synthétiques avec commande et PDF référencé ; refus de support absent/incorrect, concurrence, export interrompu, authentification refusée et intégrité incorrecte.
- Premier snapshot `738ce4ed…`, export D1 2,72 s : huit tables, un PDF, code publié `33f113d`. Restauration SQL/PDF et contrôle Restic réussis.
- Snapshot systemd `68dd04eb…`, export D1 2,94 s : seconde restauration isolée réussie. Le service automatique `backup-if-due` passe sans nouvel export si l’échéance est satisfaite.
- Une première tentative d’export a rencontré l’erreur Cloudflare 10000 ; elle n’a produit aucun faux succès. Une lecture D1 puis une nouvelle tentative ont réussi avec les mêmes autorisations. Cause exacte non établie ; erreur conservée dans les journaux privés.
- Les exports/restaurations de production vérifient une base sans commandes réelles. Le cas d’une commande référant un ancien PDF est couvert par les tests synthétiques et les recettes marchandes antérieures.
- Le service utilise Node 22.22.0 et Wrangler du projet, avec authentification OAuth existante. Un renouvellement/réauthentification impossible produit un échec visible.
- Pas de restauration distante, email ou paiement pendant ces vérifications. Restauration trimestrielle à refaire ; seconde copie chiffrée indépendante non installée.

Statut daté et manifeste complet dans `~/Qognito-Commerce/status.json`. Logs détaillés privés ; preuves de préparation dans `.wrangler/ouverture-2026-10-20/`.
