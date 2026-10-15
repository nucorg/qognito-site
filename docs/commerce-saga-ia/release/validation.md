# Recette du 14 octobre 2026

Périmètre de ce premier rapport : code local, ressources Cloudflare locales, Stripe en **sandbox uniquement**. Aucune commande réelle. Les IDs ci-dessous sont des objets fictifs ; aucun token de livraison ni secret n’est publié. Les essais effectués ensuite sur Cloudflare sont consignés séparément dans la [recette distante du 14 octobre](recette-distante-2026-10-14.md).

**Mise à jour — étape 2** : les reprises après panne email/webhook, le renouvellement, le remboursement partiel avec avoir, les alertes reçues par Boris et la restauration D1/R2 sont désormais validés à distance. Voir le [rapport des reprises](recette-reprises-2026-10-14.md), qui remplace les réserves techniques historiques ci-dessous. Les rebonds après acceptation email et la surveillance indépendante de Cloudflare/Resend ne sont pas couverts ; la relecture commerciale finale reste attendue.

| Vérification | Résultat |
|---|---|
| PDF final FR 1.1 | 93 pages : couverture conservée + corps révisé de 92 pages ; 41 destinations et 72 annotations internes vérifiées après assemblage ; extraction LiteParse avec autonomie/Arbitre facultatif |
| Tests automatisés de commerce | Réussis : prix/TVA imposés côté serveur, trois accords, PDF absent/altéré, origine étrangère, édition EN refusée, signatures et modes, idempotence/concurrence, autorisation sans droit au PDF, reprise sans retour navigateur, résilience email, renouvellement, remboursement partiel/total, état figé de l’achat, facture récupérée sans double encaissement, raison sociale sur facture professionnelle, expiration et litige ouvert/perdu/gagné |
| Ancien commerce sandbox | Tests conservés et réussis ; tables historiques intactes |
| Achat réel dans Stripe test | Réussi, édition 1.1 : commande `1ba96f79-3fb5-47cf-a9c4-a72b4d885274`, total 4999 centimes, TVA 261, PDF HTTP 200 et empreinte correcte |
| Facturation après capture | Facture `in_1UQPQ4PyuwM2ZYZmBN8PKEqO`, payée 4999 ; paiement déjà encaissé rattaché ; compteur de tentatives de collecte à zéro |
| Remboursement total réel dans Stripe test | `re_3UQPPIPyuwM2ZYZm2RWbuOMn`, 4999, réussi ; ancien lien retourne HTTP 403 |
| Adresse étrangère dans Checkout | Belgique, commande `ac53b1a9-175a-480e-94c3-245ca366c85f` : `market_rejected`, autorisation annulée, aucun PDF |
| Carte refusée par Stripe test | Commande `0577a1a2-756d-439d-a2a7-43bb14021f7d` : refus affiché, commande non payée, aucun PDF |
| 3D Secure Stripe test | Commande `cc63c992-cd49-4bf5-92dc-c297fc4668d7` : défi complété, paiement confirmé, PDF HTTP 200. Le test attend le chargement complet du cadre Stripe avant validation du défi. |
| Émission Resend | Contrat API et reprise simulés ; aucun compte Resend, donc réception réelle non testée |
| Interface | FR/EN/ES à 390 et 1280 px : prix FR, messages d’attente EN/ES sans formulaire, liens/canonical, erreur récupérable, aucun débordement ni erreur JS |
| Arbitre | [Version publique v1.0.0](https://github.com/nucorg/app_saga_arbitre/releases/tag/v1.0.0), commit `b2588db`, [CI trois OS réussie](https://github.com/nucorg/app_saga_arbitre/actions/runs/38549604195) ; restauration Linux indépendante et navigateur six onglets sans réseau externe |

Produit Stripe test courant : `prod_VRHxmdWLIJZ2wa`, prix `price_1UQPNsPyuwM2ZYZmwUIiqpeO`, taux `txr_1UQPA8PyuwM2ZYZmGkqUjmzM`, configuration cartes `pmc_1UQPA8PyuwM2ZYZmWqkqub70`. Ils ne sont jamais réutilisés en live.

L’assemblage PDF est reproductible par `qognito-content/formations/saga-ia/volume-01/outils/assembler-edition.py` avec `pypdf==6.1.1`. Ce script conserve l’ancienne édition et vérifie les empreintes des deux sources avant création. Le fichier de contrôle accompagne le PDF privé dans `editions/fr/1.1/assemblage.json`.

## Vérifications encore requises avant ouverture

- Déploiement distant réalisé ensuite : voir le [rapport dédié](recette-distante-2026-10-14.md), qui distingue les contrôles exécutés des vérifications restantes.
- Réception email réelle, bounces, alertes, restauration D1, renouvellement opérationnel et facture complète relue.
- Sur cette origine distante : 3DS, refus, retour annulé/expiration, doublon/panne webhook et récupération, pays/DOM refusés, remboursement partiel/total et avoir sans second remboursement.
- Médiateur effectivement désigné, CGV et pages relues ; identité et mentions de facture confirmées.
- Relecture finale du PDF assemblé avec la couverture retenue ; cette sélection par Boris ne vaut pas autorisation de paiement live.

Les captures restent sous `/tmp/qognito-volume-*.png`, `/tmp/qognito-stripe-*.png` et `/tmp/qognito-arbitre-release.png` sur le poste ; elles contiennent uniquement des données fictives de recette. Elles ne sont pas une preuve d’hébergement distant. Les simulations ne sont pas présentées comme des ventes.

Contrôle final : build Astro réussi ; 46 contrôles du livre blanc réussis ; absence du PDF payant vérifiée par empreinte sur tous les fichiers de `dist/` ; encadré CGV présent une seule fois après chargement. Les premiers écrans du PDF assemblé et les rendus web ont été examinés visuellement. Le contrôle d’ouverture live échoue comme attendu sans configuration ni approbation.
