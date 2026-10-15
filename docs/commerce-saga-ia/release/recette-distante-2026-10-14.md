# Recette distante — 14 octobre 2026

Axe II · Cible I. Copie de test autorisée par Boris, avec paiements Stripe fictifs et emails destinés uniquement à sa boîte de réception. La production `qognito.io` n'est pas déployée dans cette opération.

**Complément ultérieur : [étape 2 — reprises, alertes et restauration validées](recette-reprises-2026-10-14.md).** Ce complément lève les réserves techniques en fin de ce rapport initial. État final : Pages `83313289`, Worker `564645cd-8399-4309-947a-15a41e57e11b`, migrations 0001 à 0005. Les références ci-dessous conservent l'historique des premières validations.

## Installation

- Page à essayer : **https://qognito-commerce-staging.pages.dev/formations/saga-ia/volume-1/**.
- Cloudflare Pages : `qognito-commerce-staging`, branche principale de ce projet : `staging`. Déploiement actuel après correction du SIRET : `9c7e5dd7` ; CGV v2 introduites par `9c1bffa2`, après correction du bouton dans `2e1a99c2`.
- Worker planifié : `qognito-commerce-jobs-staging`, version `e607e45a-0bbe-437b-ae27-3606c602280d`, toutes les cinq minutes. Aucune route publique ; observabilité activée.
- D1 : `qognito-commerce-staging`, ID `c76a81d6-b91f-4963-8d64-101337c7114f`. Migrations 0001 à 0004 appliquées.
- R2 : `qognito-commerce-staging`, classe Standard, placement WEUR. Accès `r2.dev` désactivé, aucun domaine public connecté (vérifiés par Wrangler).
- PDF édition 1.1 chargé au chemin du catalogue. Relu depuis R2, SHA-256 conforme : `6ac5920802ac4cfd0a5efa4820accf9f6ce8ce4ecabd4cca3b7ff092216d0add`.
- Webhook Stripe test : `we_1UQRV0PyuwM2ZYZm60WwkoSM`, vers `/api/commerce/webhook` sur l'origine de recette ; version API `2026-09-30.endive`.
- Les quatre secrets sont installés dans Pages et le Worker. Le HMAC et le secret webhook distants sont distincts de ceux des essais locaux.
- `COMMERCE_MODE=test`, checkout de recette ouvert. `/api/commerce/availability` confirme `enabled:true`, `test:true`. Aucun marqueur d'approbation live.
- Domaine Resend `transaction.qognito.io` vérifié par Boris ; l'email reçu lors de l'inscription n'est pas encore une preuve du parcours de commande complet.

## Contrôles effectués

| Contrôle | Résultat / preuve |
| --- | --- |
| Achat normal depuis un navigateur | Commande `7770f3d3-586c-4221-badf-b33588093cc6`, état payé en sandbox, 4 999 centimes, PDF HTTP 200 et SHA-256 conforme |
| 3D Secure | Commande `77e22dd9-14c9-4f53-90f6-f2de380c9567`, défi terminé, état payé en sandbox, PDF HTTP 200 et empreinte conforme |
| Carte refusée et expiration | Commande `f5d319e0-8638-4ed2-8156-a63e22a1ae61`, paiement refusé, aucun lien PDF ; après expiration déclenchée dans Stripe, état D1 `expired` confirmé |
| Adresse belge | Commande `b5e208da-a7bb-4d34-983f-d55b8bc14501`, `market_rejected`, aucun lien PDF ; PaymentIntent annulé et montant encaissé nul vérifiés dans Stripe |
| Adresse DOM | Commande `22254b17-0c8c-4445-80bc-c706778677dc`, adresse FR avec code postal 97200 : `market_rejected`, aucun lien PDF ; autorisation annulée et montant encaissé nul vérifiés |
| Rejeu de webhook | Même événement signé de la première commande renvoyé deux fois : HTTP 200, événement déjà enregistré |
| Accès sans justificatif | PDF sans signature : HTTP 403 ; commande sans cookie signé : HTTP 401 ; webhook avec signature invalide : HTTP 400 |
| Pages FR/EN/ES | HTTP 200 ; 49,99 € en FR, Available soon en EN, Pronto disponible en ES ; aucun formulaire d'achat EN/ES |
| Indexation et fichiers publics | Robots de recette en Disallow, en-tête noindex ; contrôle des 88 fichiers du build de recette, PDF payant absent |
| Interface de confirmation | Défaut identifié : couleur ambre du texte sur le fond ambre du bouton. Surcharge CSS retirée ; après redéploiement, libellé présent et couleur blanche sur fond ambre vérifiés dans le navigateur |
| Interface mobile | Page FR distante à 390 px, formulaire et indication Stripe test visibles, aucun débordement horizontal ni erreur JavaScript |
| Build et tests locaux | Build Astro et tests de commerce réussis avant déploiement |
| Exécution automatique distante | Premier passage observé le 14 octobre à 14 h 56 min 12 s, heure de Paris : résultat `ok`, aucune exception ; les deux commandes passent à `email_status=accepted` |
| Factures Stripe | `in_1UQRj9PyuwM2ZYZmIRksCk2C` et `in_1UQRjHPyuwM2ZYZmUhBCw7CH` : chacune payée en sandbox pour 4 999 centimes, reste dû nul, zéro tentative de collecte supplémentaire |
| Envois Resend | Deux demandes acceptées : `01a13a7c-33c3-7c39-ac63-01680717a172` et `01a13a7c-5512-79e4-ac02-6bed7279d6a9`. La clé est limitée à l'envoi : lecture du statut de livraison via l'API refusée (`restricted_api_key`). Aucun élargissement de ses droits demandé |
| Remboursement total | Première commande remboursée en sandbox : `re_3UQRXtPyuwM2ZYZm0SOGGVYM`, 4 999 centimes, succès. Le lien PDF précédemment valide retourne HTTP 403 après traitement du webhook |

## Livraison et contrôles restant à consigner

### Mise à jour des CGV avec CM2C

À la demande de Boris, le paragraphe de médiation des CGV **2026-10-14-v2** contient désormais le nom, l'adresse postale, le site, le formulaire de saisine et le courriel de CM2C. Le téléphone vendeur reste celui communiqué par Boris. Le test réussi de `contact@qognito.io` est confirmé par Boris.

- Nouvelle version déployée sur [la page de recette des CGV](https://qognito-commerce-staging.pages.dev/conditions-de-vente/), avec les Functions correspondantes. Configuration Pages `COMMERCE_MEDIATOR` alignée sur la source du contrat.
- Build et tests de commerce réussis. API `/api/commerce/terms` et texte affiché identiques à `termsText()` ; `/api/commerce/availability` retourne `terms_version=2026-10-14-v2`, `test=true`, `enabled=true`.
- Rendu Chrome contrôlé à 320, 390 et 1 440 px : aucune erreur JavaScript ni débordement horizontal. Le texte statique sans JavaScript a aussi été vérifié à 390 px.
- Pages EN/ES contrôlées : disponibilité prochaine et absence de formulaire de commande, conformément au périmètre FR du contrat.
- La commande conserve `terms_version` et `terms_text` en base ; le Worker existant reprend ce texte enregistré dans l'email. Aucun retraitement des contrats antérieurs ni nouveau paiement requis pour ce contrôle.
- Preuves locales : `.wrangler/sales-staging/terms-v2-verification.json` et `terms-v2-mobile.png`. Aucune modification du site de production ni approbation live.

Attestation et convention CM2C consultées à la demande de Boris : adhésion de QOGNITO attestée jusqu’au **14 octobre 2029**, convention datée du 14 octobre 2026. Réserve documentaire levée. Boris confirme ensuite le SIRET **130 175 730 00014** : mentions légales FR/ES et référentiel commun corrigés ; détails dans le [README](README.md#médiateur-choisi--cm2c).

### Correction du SIRET et validation de l’adhésion

- SIRET **130 175 730 00014** confirmé explicitement par Boris après lecture de l’attestation et de la convention CM2C ; correction des mentions légales FR/ES, du référentiel commun et de la relecture bilingue.
- Build réussi ; seuls les deux fichiers HTML de mentions légales ont changé dans le déploiement de recette `9c7e5dd7`.
- Premier contrôle navigateur avant disponibilité du nouveau SIRET sur l’alias canonique : échec de comparaison. Après vérification HTTP de l’alias et de l’URL du nouveau déploiement, contrôle navigateur complet réussi : FR/ES à 390 et 1 440 px, numéro correct, aucun débordement ni erreur JavaScript.
- Lien du pied de page anglais vers les mentions françaises vérifié. API des CGV toujours conforme à la version `2026-10-14-v2` ; mode Stripe test confirmé.
- Preuve locale : `.wrangler/sales-staging/legal-siret-verification.json`. Aucune modification des paiements ni du déploiement de production.

### Autres contrôles

- Boris confirme avoir suivi les consignes du parcours normal sans incident, sans tests limites. Cette validation utilisateur complète les contrôles techniques ci-dessus ; aucune nouvelle référence de commande n'a été fournie.
- La commande 3DS `77e22dd9-14c9-4f53-90f6-f2de380c9567` a été conservée active ; la première commande sert au test de remboursement.
- Vérification ultérieure de l'assistance : après le rejet de livraison initial vers `contact@qognito.io`, Boris confirme la création de l'alias Google Workspace rattaché à `bguarisma@qognito.io`. Boris confirme ensuite avoir déjà testé `contact@qognito.io` avec succès ; point validé sur sa déclaration. L'envoi Resend des commandes et la réception des réclamations sont deux contrôles distincts.
- Avant ouverture réelle : reprise après panne email/webhook, renouvellement et expiration du lien, remboursement partiel et avoir, alertes reçues, restauration D1, mentions de facture et revue des CGV avec médiateur désigné. Les tests locaux de ces mécanismes ne valent pas une recette distante complète.

Les états et liens signés utilisés par les scripts restent dans `.wrangler/sales-staging/`, ignoré par Git. Aucun secret ni lien signé n'est conservé dans ce rapport.
