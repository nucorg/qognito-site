# Vente du volume 1 — livraison préparée le 14 octobre 2026

Axe II · Cible I. Préparation de vente directe ; aucune ouverture réelle.

## Décisions et état

- **49,99 € TTC**, achat unique, TVA inclusive **5,5 % confirmée par Boris**, France métropolitaine uniquement. Le taux n’est pas une conclusion fiscale produite par le code.
- Édition française **1.1**, **93 pages** : couverture existante + révision de 92 pages retenue par Boris. Les 41 destinations et 72 annotations internes sont conservées ; contrôle LiteParse des passages sur l’autonomie.
- PDF privé : `qognito-content/formations/saga-ia/volume-01/editions/fr/1.1/saga-ia-volume-01-fr-v1.1.pdf` ; SHA-256 `6ac5920802ac4cfd0a5efa4820accf9f6ce8ce4ecabd4cca3b7ff092216d0add`.
- Pages EN et ES : **Available soon** / **Pronto disponible**, sans vente ni précommande. Liens depuis le programme et le livre blanc ; BOOTAG-IA et REASON-IA retirés de la présentation du parcours professionnel.
- [Arbitre v1.0.0](https://github.com/nucorg/app_saga_arbitre/releases/tag/v1.0.0) public, gratuit, MIT, facultatif ; README et tests Linux/Windows/macOS. Aucun accès hébergé vendu.
- Téléphone communiqué : **+33 7 62 64 05 06**. Boris est le contact vendeur ; **médiateur de la consommation non désigné**.
- Resend **non créé** ; Cloudflare CLI **non authentifié**. Aucun R2/D1 distant créé, aucune configuration de production modifiée, aucun paiement réel effectué.

## Parcours implémenté

La page demande l’identité du lecteur, le type d’achat, l’entreprise éventuelle et le code postal, puis trois accords distincts (conditions, fourniture immédiate, perte du droit de rétractation au commencement de la fourniture). Stripe collecte l’adresse complète et l’email. Le serveur fige édition, prix, TVA, contrat et accords dans D1.

Stripe autorise la carte ; le serveur vérifie l’adresse réelle avant capture. Une adresse hors France métropolitaine annule l’autorisation. Seul l’état payé contrôlé côté Stripe ouvre le téléchargement. Les webhooks signés sont idempotents ; le traitement périodique reprend les notifications perdues. Un contrôle d’empreinte du PDF précède le paiement et chaque téléchargement.

Le PDF reste dans **R2 privé**, sans domaine public ni URL r2.dev. Lien signé sept jours, renouvelable via l’assistance ; cookie HttpOnly 24 h pour la page de confirmation. Un remboursement total ou un litige désactive les futurs accès. Un remboursement partiel est enregistré et conserve l’accès ; aucune suppression du PDF déjà enregistré chez l’acheteur n’est possible.

La capture manuelle et la facturation automatique de Checkout sont incompatibles : la facture est créée après paiement, sans recouvrement automatique, puis rattachée au PaymentIntent déjà payé (`invoices.attachPayment`). Le worker périodique envoie ensuite via Resend la confirmation, le lien, la facture, les trois accords et le texte contractuel figé. `email_status=accepted` signifie accepté par Resend, pas reçu ni lu.

## Recette exécutée

Voir [validation.md](validation.md) pour les preuves et les limites. Les anciens scénarios à 1 € et les anciens documents restent historiques ; les nouvelles tables `sales_*` ne modifient pas les anciennes `commerce_*`.

## Ce qui reste avant ouverture

1. Boris désigne un médiateur référencé compétent, après adhésion/convention, et fournit son nom, adresse et URL de saisine. [Obligation et choix du médiateur](https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/choisir-un-mediateur-de-la-consommation).
2. Créer Resend, vérifier un sous-domaine d’envoi, puis fournir la clé par la configuration privée. Recette de réception réelle et de reprise après échec.
3. Authentifier Cloudflare et créer l’environnement de recette distant décrit dans [exploitation.md](exploitation.md).
4. Relire les trois pages et les CGV ; confirmer l’identité et les mentions de facture dans Stripe. L’encadré de garantie correspond à une fourniture ponctuelle (annexe D. 211-3), non à un abonnement.
5. Après recette distante complète, Boris autorise explicitement l’ouverture réelle. Préparer alors les objets Stripe live distincts et les bindings de production, puis exécuter les contrôles d’ouverture. Les interrupteurs restent fermés jusque-là.

L’activation DGFiP et la confirmation fiscale par Boris sont consignées, sans accès ni intervention dans son dossier comptable.

Références : [rattachement d’un paiement à une facture Stripe](https://docs.stripe.com/api/invoices/attach_payment), [décret 2022-946 et modèles de garanties](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045978303) (texte consulté sur sa [reproduction](https://justice.pappers.fr/loi/JORFTEXT000045978303/article/JORFARTI000045978344), accès direct Légifrance refusé), [tableau INC fourniture ponctuelle/continue](https://www.inc-conso.fr/sites/default/files/pdf/iv-garantie-conformite-contenus-numeriques-services-numeriques_3.pdf).
