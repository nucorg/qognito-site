# Page de recette Stripe — relecture FR/EN

6 octobre 2026 · Axe II, Cible I · source/cible : `server/commerce/test-page.mjs`,
objet `testCopy` FR/EN, première version. Usage : recette de sandbox, hors navigation
du site marchand. Aucune traduction de publication pédagogique.

| Clé | Source FR | Traduction EN |
| --- | --- | --- |
| title | Test de paiement SAGA-IA | SAGA-IA payment test |
| description | Environnement de test Stripe. Aucun achat réel. | Stripe test environment. No real purchase. |
| notice | Utilisez uniquement les données de carte de test Stripe. Le montant configuré est fictif et ne fixe pas le prix commercial. | Use Stripe test card details only. The configured amount is fictitious and does not set the commercial price. |
| delivery | Ce test enregistre une commande de test. Aucun PDF ni accès à SAGA Arbitre n’est délivré. | This test records a test order. No PDF or access to SAGA Arbitre is delivered. |
| button | Ouvrir le paiement de test | Open test checkout |
| error | Le paiement de test est indisponible. Vérifiez la configuration côté serveur. | Test checkout is unavailable. Check the server configuration. |
| returned | Retour de Stripe reçu. La commande est enregistrée séparément après vérification de la notification de paiement. | Return from Stripe received. The order is recorded separately after verification of the payment notification. |
| cancelled | Vous êtes revenu du paiement de test. Ce retour ne prouve pas l’état du règlement. | You have returned from test checkout. This return does not confirm the payment status. |
| backlink | Retour aux formations | Back to courses |

Éléments annexes : titre HTML `{title} | Qognito`, navigation `FR`/`EN`, métadonnées
`noindex,nofollow`, statut d’erreur annoncé via `aria-live`, retour localisé vers
`/formations/` ou `/en/formations/`. La page est la même route dynamique avec le
paramètre `lang`, ce qui n’active aucune langue nouvelle. `lang=es` ne crée pas de
route ES. Aucun champ de montant, email, carte ou secret sur cette page.

Passes A/B : les neuf paires comparées intégralement et relues en EN ; séparation
entre retour navigateur, vérification du paiement et livraison conservée.
Passe C : textes dans la source intégrée, navigation FR/EN, message d’échec,
retour Stripe, absence de débordement sur 390 px et 1280 px et absence d’erreur JS
contrôlés dans le navigateur Cloudflare local. Deux captures ont été examinées
visuellement (FR mobile et EN desktop) ; les quatre variantes ont été capturées.

Solidité de la source : description exacte du mode test implémenté ; appels Stripe
du compte réel non exécutés. Fidélité et adéquation : aucun défaut majeur connu dans
ce périmètre. Statut : **prête pour relecture intégrale de la page de test**, sans
acceptation de Boris présumée et sans validation de la future fiche commerciale.
