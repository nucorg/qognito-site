# Contrôles de la préparation commerciale initiale

6 octobre 2026 · périmètre local `qognito-site`, sans déploiement.

Cette page décrit la première tranche, avant intégration Stripe. Les contrôles et
limites de la tranche Stripe suivante sont consignés dans `stripe.md` et
`stripe-fr-en.md` ; ils complètent cet état historique.

| Contrôle exécuté | Résultat |
| --- | --- |
| `npm run test:commerce` | Réussi : provision Arbitre, marge, amortissement, seuil de ventes, taux unique et ventilation fiscale ; coûts manquants et scénarios impossibles refusés |
| CLI sur `commerce/pricing-input.example.json` | Échec attendu : coût fixe inconnu refusé ; aucune sortie de prix fabriquée |
| `npm run build` | Réussi : sortie statique, 16 pages Astro ; aucun checkout ajouté |
| Catalogue JSON | Prix nul, aucune édition vendable ni marché choisi ; tous les canaux désactivés |
| Inspection du build | Aucun fichier de préparation commerciale identifié dans `dist/`, aucune route ES, aucun PDF contenant « saga » dans son chemin |
| `git diff --check` | Réussi |

L’inspection par chemin n’est pas un détecteur de PDF privé renommé. Aucun artefact
du volume n’existe encore dans la remise observée et aucun fichier n’a été copié.
Lors de la remise finale, comparer les empreintes du PDF privé à l’ensemble des
fichiers publics, puis n’importer que les aperçus approuvés avec leurs empreintes.

Pas de contrôle visuel d’une nouvelle fiche produit : aucun composant/texte public
n’a été modifié. Les tests Web3Forms et CRM n’ont pas été relancés : ils ne dépendent
pas du simulateur interne ni du catalogue sans consommateur.

Les tests ne valident ni la fiscalité du pack, ni ses coûts réels, ni l’admission
aux plateformes, ni les droits et réglages distants d’Arbitre. Les scénarios de
tests sont fictifs ; aucun montant issu des tests n’est un prix recommandé.

Fichiers préparés :

- `commerce/saga-volume-01.json` : catalogue commun encore inactif.
- `commerce/pricing-input.example.json` : entrées à compléter après réponse de Boris.
- `scripts/commerce-pricing.mjs`, `tests/commerce-pricing.mjs`, `package.json` :
  outil local de simulation et commande `test:commerce`, sans dépendance nouvelle.
- `docs/commerce-saga-ia/` : conclusions sourcées, ordre de réalisation, calcul,
  relecture FR/EN et contrôles.

`docs/publication-formations.md` était déjà non suivi avant cette intervention ;
aucune modification effectuée. Aucun cours, manifeste éditorial, compte Stripe,
invitation email ou réglage d’hébergement n’a été modifié. Aucun commit ni push.
