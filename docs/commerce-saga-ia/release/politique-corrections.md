# Volume 1 — proposition de politique de correction

Axe II · Cible I. Préparée le 14 octobre 2026 pour Boris. **Proposition à adopter ; aucune nouvelle clause publiée ni modification du PDF.** La relecture des pages, des CGV v2 et du PDF 1.1 est déclarée terminée par Boris ; l’activation des achats reste une étape distincte.

## Règle proposée

> Les corrections de l’édition achetée sont fournies sans frais : coquilles, erreurs de calcul, liens internes défectueux ou problèmes de fichier. Elles sont accompagnées d’un relevé des changements. Les nouvelles éditions enrichies, traductions et autres volumes ne sont pas inclus dans l’achat. Cette distinction ne limite pas les garanties légales applicables.

La règle porte sur la correction du contenu vendu, sans promesse d’ajouter continuellement les nouveautés de l’IA ni de fournir toutes les éditions futures. Une correction nécessaire à la conformité ne devient pas payante parce qu’elle est publiée dans une nouvelle édition. Les CGV v2 indiquent déjà que les garanties légales et les mises à jour nécessaires restent applicables.

## Traitement concret au lancement

1. Le lecteur écrit à **contact@qognito.io**, avec sa référence de commande, la page et le problème rencontré. Boris accuse réception et relève le cas dans le journal éditorial ; objectif interne proposé : réponse initiale sous deux jours ouvrés, sans promettre ce délai dans les CGV.
2. Vérifier le signalement dans la source : coquille sans effet sur le sens, erreur affectant un résultat ou une consigne, ou problème empêchant l’utilisation du fichier. Une demande d’enrichissement est distinguée d’une correction.
3. Corriger la source et vérifier le passage, ses calculs, figures et renvois. Pour une coquille, un erratum peut suffire ; pour un défaut qui compromet la compréhension ou l’usage, préparer un PDF corrigé et une information des lecteurs concernés. Ne pas attendre une refonte payante pour traiter ce défaut.
4. Conserver l’édition 1.1 identifiée par son empreinte. Toute nouvelle version corrigée reçoit son propre identifiant, fichier et empreinte dans le manifeste ; ne pas écraser le PDF d’une commande existante.
5. Au lancement, **la remise d’un erratum ou d’un PDF corrigé peut être manuelle**, par email transactionnel à l’adresse de la commande vérifiée, sans second paiement. Le fichier peut être joint à cet email. Conserver la référence de commande, la version remise et la date dans le suivi privé ; ne pas mettre les acheteurs en copie collective.
6. Avant de vendre la version corrigée aux nouveaux acheteurs, aligner le manifeste, le catalogue, les objets Stripe qui identifient l’édition, le fichier R2 et l’empreinte approuvée ; tester le parcours et la récupération des anciennes commandes.

**Point technique vérifié :** les commandes conservent `edition_id`, `pdf_key` et `pdf_sha256`. Le téléchargement vérifie l’empreinte. Le script de renouvellement prolonge l’accès à ce même fichier ; il ne migre pas une commande vers une nouvelle édition. Écraser l’objet R2 casserait donc les anciens téléchargements. Aucune diffusion automatique de corrections n’est présentée comme déjà installée.

## Journal des corrections

Le journal est tenu avec les sources éditoriales et ne contient pas d’identité client. Le suivi des remises nominatives reste privé.

| Référence | Signalement / page | Impact | Décision | Version corrigée | Contrôles | Date de diffusion |
|---|---|---|---|---|---|---|

Aucune erreur nouvelle n’est constatée par la rédaction de cette politique. Ne pas remplir le tableau avec des incidents fictifs.

## Repères vérifiés

Les mises à jour nécessaires à la conformité doivent être distinguées des enrichissements commerciaux ; leur information et fourniture dépendent du contrat et de la nature du contenu. Voir [Code de la consommation, L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20) et [mise en œuvre de la garantie pour les contenus numériques](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132879/2026-04-16), consultés le 14 octobre 2026. Cette proposition opérationnelle n’ajoute pas de durée arbitraire aux garanties déjà présentes dans les CGV.
