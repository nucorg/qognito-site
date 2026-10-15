# Vente du volume 1 — livraison préparée le 14 octobre 2026

Axe II · Cible I. Préparation de vente directe ; aucune ouverture réelle.

**Dernière publication : 15 octobre 2026, 12 h 03 (Paris)** — extrait PDF, encart du volume sur l’accueil et espacement Formations publiés ; achats toujours fermés. Déploiement `c43b459d`. Voir le [rapport de publication et les contrôles](publication-site-2026-10-15.md).

Les sources de cette publication et la configuration de production sont réunies dans ce lot Git : [périmètre, reconstruction à l’identique et suivi du déploiement automatique](synchronisation-git-2026-10-15.md).

## Décisions et état

- **49,99 € TTC**, achat unique, TVA inclusive **5,5 % confirmée par Boris**, France métropolitaine uniquement. Le taux n’est pas une conclusion fiscale produite par le code.
- Édition française **1.1**, **93 pages** : couverture existante + révision de 92 pages retenue par Boris. Les 41 destinations et 72 annotations internes sont conservées ; contrôle LiteParse des passages sur l’autonomie.
- PDF privé : `qognito-content/formations/saga-ia/volume-01/editions/fr/1.1/saga-ia-volume-01-fr-v1.1.pdf` ; SHA-256 `6ac5920802ac4cfd0a5efa4820accf9f6ce8ce4ecabd4cca3b7ff092216d0add`.
- Pages EN et ES : **Available soon** / **Pronto disponible**, sans vente ni précommande. Liens depuis le programme et le livre blanc ; BOOTAG-IA et REASON-IA retirés de la présentation du parcours professionnel.
- [Arbitre v1.0.0](https://github.com/nucorg/app_saga_arbitre/releases/tag/v1.0.0) public, gratuit, MIT, facultatif ; README et tests Linux/Windows/macOS. Aucun accès hébergé vendu.
- Téléphone communiqué : **+33 7 62 64 05 06**. Boris est le contact vendeur. **Adhésion CM2C attestée jusqu’au 14 octobre 2029** ; attestation et convention fournies par Boris consultées. SIRET **130 175 730 00014** confirmé par Boris et corrigé dans les mentions légales FR/ES ainsi que le référentiel commun.
- `contact@qognito.io` : Boris confirme la création de l'alias Google Workspace rattaché à `bguarisma@qognito.io`, après le rejet de livraison initial. Boris confirme ensuite avoir testé `contact@qognito.io` avec succès ; ce point est validé sur sa déclaration.
- Resend créé ; **`transaction.qognito.io` vérifié** et email d'inscription reçu par Boris. Clé privée dans `.env.resend`. Wrangler authentifié ; R2 privé et D1 **`qognito-commerce-staging`** créés.
- [Site de recette Cloudflare](https://qognito-commerce-staging.pages.dev/formations/saga-ia/volume-1/) déployé en **Stripe test**. Paiement, 3DS, rejets, PDF, facturation, envoi Resend et remboursement total éprouvés à distance. Premier passage du Worker observé ; Boris confirme avoir suivi les consignes du parcours normal sans incident, sans tests limites. Voir la [recette distante](recette-distante-2026-10-14.md) pour les résultats et limites. Aucun paiement réel effectué.
- **Étape 2 terminée** : reprise sans webhook ni retour navigateur, panne email, renouvellement, remboursement partiel avec avoir, alertes et restauration D1/R2 validés à distance. Boris confirme avoir reçu la livraison et les alertes incident/reprise. Résultats et limites de surveillance : [recette des reprises](recette-reprises-2026-10-14.md).
- **Étape 3 : production configurée et déployée, achats fermés**. Catalogue Stripe réel à 49,99 €, quatre secrets installés, D1/R2 privés raccordés, Pages `1b059f1b` (accroche sous le prix et précision sections 1 et 2 validées par Boris) et Worker de production déployés. Webhook actif sur le domaine technique stable `qognito-site.pages.dev`, car la zone `qognito.io` présente un challenge aux appels automatisés. Calcul HT/TVA live et protections API validés ; première exécution planifiée à observer. Coordonnées d’assistance Stripe validées par API à 16:20 UTC ; URL confidentialité/CGV enregistrées selon Boris. Type et identité corrigés à 16:29 UTC : société non cotée, dénomination QOGNITO, nom commercial Qognito.io. Vérification Stripe en cours selon la capture ; paiements et virements toujours activés côté Stripe. Détails, preuves et réserves : [préparation production](preparation-production-2026-10-14.md).

### Médiateur choisi — CM2C

Coordonnées publiques vérifiées le 14 octobre 2026 et intégrées aux CGV françaises **2026-10-14-v2**, à leur aperçu statique et à la configuration de recette `COMMERCE_MEDIATOR`, à la demande de Boris :

- **Centre de la Médiation de la Consommation de Conciliateurs de Justice (CM2C)**, présent dans la [liste officielle des médiateurs référencés](https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/choisir-un-mediateur-de-la-consommation/mediateurs-references).
- Adresse : **49 rue de Ponthieu, 75008 Paris** ([mentions légales CM2C](https://www.cm2c.net/mentions-legales.php)).
- Site : [cm2c.net](https://www.cm2c.net/) ; [formulaire de saisine](https://www.cm2c.net/declarer-un-litige.php).

Documents consultés avec LiteParse sur instruction explicite de Boris : `attestation_adhesion_13017573000014.pdf` et `convention_CM2C.pdf`, conservés dans son dossier privé de gestion. Aucune copie de ces PDF n’est ajoutée au dépôt.

- Entité couverte : **QOGNITO**, 151 Avenue Félix Faure, 92800 Puteaux ; les deux documents indiquent **13017573000014** comme SIRET.
- Convention datée du **14 octobre 2026**, portant la signature électronique de QOGNITO / Boris Guarisma Navarro ; durée de **trois ans**, échéance **14 octobre 2029** confirmée par l’attestation.
- Objet : médiation des litiges avec les clients consommateurs de Qognito. Aucun périmètre sectoriel plus étroit n’est précisé dans les quatre pages de convention remises.
- Article 4 : reconduction tacite par périodes de trois ans ; dénonciation par lettre recommandée avec accusé de réception trois mois avant l’échéance. Prévoir une revue avant juillet 2029.
- Article 3.2 : communiquer les modalités de saisine de CM2C et collaborer avec le médiateur. Téléphone figurant sur l’attestation : **01 89 47 00 14** ; adresse postale conforme aux CGV.

**Écart résolu** : Boris confirme le SIRET **130 175 730 00014**, conforme aux deux documents CM2C. Les mentions légales FR/ES, leur support de relecture bilingue et `qognito-content/THEME_QOGNITO.md` sont corrigés. Les CGV utilisent le SIREN `130 175 730`, déjà exact ; leur version v2 reste applicable.

Les commandes existantes conservent leur version contractuelle enregistrée. L’attestation ne vaut pas autorisation d’ouverture réelle.

## Parcours implémenté

La page demande l’identité du lecteur, le type d’achat, l’entreprise éventuelle et le code postal, puis trois accords distincts (conditions, fourniture immédiate, perte du droit de rétractation au commencement de la fourniture). Stripe collecte l’adresse complète et l’email. Le serveur fige édition, prix, TVA, contrat et accords dans D1.

Stripe autorise la carte ; le serveur vérifie l’adresse réelle avant capture. Une adresse hors France métropolitaine annule l’autorisation. Seul l’état payé contrôlé côté Stripe ouvre le téléchargement. Les webhooks signés sont idempotents ; le traitement périodique reprend les notifications perdues. Un contrôle d’empreinte du PDF précède le paiement et chaque téléchargement.

Le PDF reste dans **R2 privé**, sans domaine public ni URL r2.dev. Lien signé sept jours, renouvelable via l’assistance ; cookie HttpOnly 24 h pour la page de confirmation. Un remboursement total ou un litige désactive les futurs accès. Un remboursement partiel est enregistré et conserve l’accès ; aucune suppression du PDF déjà enregistré chez l’acheteur n’est possible.

La capture manuelle et la facturation automatique de Checkout sont incompatibles : la facture est créée après paiement, sans recouvrement automatique, puis rattachée au PaymentIntent déjà payé (`invoices.attachPayment`). Le worker périodique envoie ensuite via Resend la confirmation, le lien, la facture, les trois accords et le texte contractuel figé. `email_status=accepted` signifie accepté par Resend, pas reçu ni lu.

## Recette exécutée

Voir [validation.md](validation.md) pour les preuves et les limites. Les anciens scénarios à 1 € et les anciens documents restent historiques ; les nouvelles tables `sales_*` ne modifient pas les anciennes `commerce_*`.

## Ce qui reste avant ouverture

1. Relire les trois pages et les CGV ; confirmer l’identité et les mentions de facture dans Stripe. L’encadré de garantie correspond à une fourniture ponctuelle (annexe D. 211-3), non à un abonnement.
2. Terminer les derniers contrôles de production : première exécution du Worker, issue de la vérification Stripe et parcours sur le domaine public `qognito.io`. Le déploiement direct ne fusionne pas le code dans `main` ; intégrer la configuration durable avant le prochain déploiement Git.
3. Après revue des résultats et validation commerciale, Boris autorise explicitement l'ouverture réelle. Les interrupteurs restent fermés jusque-là.

L’activation DGFiP et la confirmation fiscale par Boris sont consignées, sans accès ni intervention dans son dossier comptable.

Références : [rattachement d’un paiement à une facture Stripe](https://docs.stripe.com/api/invoices/attach_payment), [décret 2022-946 et modèles de garanties](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045978303) (texte consulté sur sa [reproduction](https://justice.pappers.fr/loi/JORFTEXT000045978303/article/JORFARTI000045978344), accès direct Légifrance refusé), [tableau INC fourniture ponctuelle/continue](https://www.inc-conso.fr/sites/default/files/pdf/iv-garantie-conformite-contenus-numeriques-services-numeriques_3.pdf).

### Suite demandée après le bilan du 14 octobre

Boris déclare terminés les prérequis de validation finale des pages, des CGV v2
et du PDF 1.1. Il demande de préparer la [politique de correction](politique-corrections.md)
et les [sauvegardes de production](sauvegarde-production.md). Les deux propositions
sont documentées ; aucune modification contractuelle publique, installation
de sauvegarde ou ouverture du checkout n’a été effectuée dans cette préparation.
