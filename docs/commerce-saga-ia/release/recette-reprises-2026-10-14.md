# Reprises après incident — recette distante du 14 octobre 2026

Axe II · Cible I. Étape 2 demandée par Boris : paiements Stripe fictifs, emails réels uniquement à `bguarisma@qognito.io`. Aucun déploiement en production.

## Résultat

Les contrôles de reprise, renouvellement, remboursement partiel, alerte et restauration ont réussi. **Boris confirme la réception des trois emails : incident, livraison du PDF et reprise.** La validation commerciale finale et l'autorisation d'ouverture restent distinctes.

| Contrôle | Preuve distante |
| --- | --- |
| Notification Stripe indisponible, aucun retour navigateur exploité | Le webhook de la fixture répond HTTP 503. Checkout terminé dans Stripe, autorisation `requires_capture`, commande encore `created` dans D1. Le traitement serveur retrouve ensuite le paiement, le capture et passe la commande à `paid` |
| Facture et encaissement uniques | Une facture payée de 4 999 centimes ; `attempt_count=0`, rattachée au paiement existant. Aucun second encaissement |
| Panne d'envoi du PDF | Cinq réponses HTTP 503 injectées à l'appel d'envoi. `email_status=pending`, `job_attempts=5`, prochaine tentative future ; le PDF payé reste accessible et intègre |
| Reprise d'envoi | Après retrait de la panne : Resend accepte le message, compteur remis à zéro, erreur effacée. Un passage supplémentaire conserve le même identifiant d'envoi |
| Rejeu de notification | Événement réel Checkout renvoyé deux fois avec signature valide : HTTP 200, une seule entrée dans `sales_events`, une seule facture et aucun nouvel email |
| Expiration et renouvellement | Échéance avancée uniquement dans la base isolée : HTTP 403. Renouvellement : version 1 → 2, nouvel email, nouveau lien HTTP 200, ancien lien toujours HTTP 403 |
| Remboursement partiel | 1 000 centimes remboursés en sandbox ; `amount_refunded=1000`, état toujours `paid`, PDF HTTP 200 |
| Avoir sans second remboursement | Avoir de 1 000 centimes associé au remboursement déjà existant via `refunds`. Stripe contient un seul remboursement. Aucun usage de `refund_amount`, qui déclencherait un nouveau remboursement |
| Alerte d'incident et reprise | Panne simulée de l'envoi d'alerte : notification conservée en base puis envoyée au rétablissement. Deux passages n'envoient pas de doublon. Alerte de reprise envoyée après résolution. **Les deux reçues par Boris** |
| Restauration D1 | Export du D1 de recette puis import dans une autre base distante ; comparaison de toutes les valeurs des 7 tables du snapshot, dont 6 commandes et 22 événements. Empreintes identiques, `foreign_key_check` vide et `quick_check=ok` |
| Restauration R2 | PDF relu depuis le bucket de recette, copié dans un autre bucket privé, puis téléchargé depuis celui-ci : SHA-256 identique au catalogue |

La reprise métier est exécutée sur Cloudflare avec le **vrai `runJobs`**, appelé par une route administrative de la fixture ; les échéances des tentatives sont avancées pour éviter une attente artificielle. Les appels Stripe sont réels en sandbox. Les HTTP 503 sont injectés au point d'appel ; aucun fournisseur n'a réellement été mis en panne. Le navigateur n'appelle pas la page de confirmation. L'exécution planifiée normale du Worker est contrôlée séparément.

La première assertion de remboursement a lu D1 avant la fin du webhook concurrent. Stripe et D1 ont ensuite été contrôlés : remboursement et avoir déjà corrects. Le test attend désormais la fin de cette synchronisation ; son rejeu utilise les mêmes clés d'idempotence et confirme toujours un seul remboursement.

## Références de test

- Commande isolée : `ce788997-c287-4756-a900-f9c15bda4fec`.
- Facture : `in_1UQSyIPyuwM2ZYZm6rIIXX7Z`.
- Événement rejoué : `evt_1UQSxDPyuwM2ZYZmutUShnDE`.
- Remboursement : `re_3UQSxBPyuwM2ZYZm0l4132bO` ; avoir : `cn_1UQT1CPyuwM2ZYZmjX7AHEBb`.
- Resend incident : `01a13ac5-de53-7eb9-8cfa-2a4c508f89a6` ; livraison : `01a13ac6-5dc2-7059-a475-84321ce73c8a` ; reprise : `01a13ac6-91c0-7539-8b2d-52dfc14348e1` ; renouvellement : `01a13ac7-a179-757f-bafd-bc7a1be3b8ff`.
- D1 de simulation : `qognito-recovery-20261014`, `236c5cf0-3c2d-4217-9289-0be77ccec9d1`.
- D1 de restauration : `qognito-restore-20261014`, `8be94624-f169-4eb6-a294-d665e65b8cdb` ; bucket de restauration de même nom.
- Snapshot restauré : avant application de la migration 0005 ; SHA-256 SQL `e96979ac810b7f676a792439bffe848e35f0e3dd936b69f34daa7984e9048e2e`.
- PDF sauvegardé et restauré : `6ac5920802ac4cfd0a5efa4820accf9f6ce8ce4ecabd4cca3b7ff092216d0add`.

Les sauvegardes, configurations, journaux bruts et liens privés restent dans `.wrangler/sales-recovery/`, ignoré par Git, répertoire accessible uniquement au propriétaire. Aucun secret ou lien signé ne figure dans ce rapport.

## Correctifs et déploiement de recette

1. Ajout de `sales_alerts` (migration **0005**) et d'un moniteur après le traitement planifié. Après cinq échecs, l'incident est conservé ; les messages incident/reprise sont envoyés au destinataire `COMMERCE_ALERT_TO`. Les messages ne contiennent ni email acheteur ni lien de téléchargement. Les tests couvrent aussi concurrence, résolution, nouvel incident et perte de réponse du fournisseur après acceptation.
2. Les notifications des deux sites arrivent dans le même sandbox Stripe. Une commande absente de la base principale mais appartenant à une autre origine Checkout est désormais reconnue comme étrangère. Un événement dont la commande manque sur **la même origine** conserve HTTP 503. Cas testés localement et, pour l'autre origine, à distance avec les événements Checkout et PaymentIntent de la fixture.
3. Pages de recette : déploiement `83313289`. Worker final : `564645cd-8399-4309-947a-15a41e57e11b`. Migration 0005 appliquée au D1 de recette. Passage de cette version observé à **16 h 25 min 52 s, heure de Paris** : résultat `ok`, aucune exception, cron toutes les cinq minutes. Le premier passage avec alertes avait aussi été observé sur sa version précédente `580bfe60-24ef-4a84-b82e-b9d91f19fa9e`.
4. Tests `npm run test:commerce`, build Astro et contrôle du diff réussis. Aucun changement des pages commerciales dans cette étape.

**Limites de la surveillance** : les alertes utilisent Resend. Si Resend est entièrement indisponible, elles restent en attente jusqu'à son rétablissement. Si Cloudflare/D1 est indisponible, ce Worker ne peut pas alerter. Une surveillance indépendante n'est pas configurée ; l'API Notifications Cloudflare a refusé l'accès avec les droits OAuth disponibles (HTTP 403). Les rebonds après acceptation par Resend ne sont pas traités automatiquement par ce moniteur.

## Clôture et conservation des essais

Le webhook Stripe temporaire `we_1UQSvhPyuwM2ZYZmwds2eJe9` est désactivé. Le Worker de simulation passe en `RECOVERY_CLOSED=true` : routes de contrôle et de paiement fermées ; seul le téléchargement signé reste accessible pour les emails de test, jusqu'à expiration. Aucun cron n'est associé à cette fixture. Les ressources de restauration restent privées, sans application ni planification connectée. Elles pourront être supprimées après conservation des preuves ; ne jamais supprimer `qognito-commerce-staging` à leur place.

Contrôle final : `/sql`, `/checkout`, `/jobs`, `/alerts` et le webhook temporaire répondent HTTP 410, même avec l'authentification de test. Nouveau lien PDF HTTP 200 et empreinte conforme ; ancien lien HTTP 403. Disponibilité du site de recette principal : `test=true`, `enabled=true`, CGV v2. Preuve locale : `.wrangler/sales-recovery/final-verification.json`.

Scripts de recette explicites, hors CI : [reprises](../../../tests/sales-recovery-remote.mjs), [restauration](../../../tests/sales-restore-remote.mjs), [fixture distante](../../../tests/fixtures/recovery-worker.mjs). Ils sont volontairement bornés à ces ressources de test. Ne pas rouvrir la fixture ni répéter un achat pour simplement consulter les résultats.

Sources opérationnelles : [export/import D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [avoir Stripe associé à un remboursement existant](https://docs.stripe.com/api/credit_notes/create).
