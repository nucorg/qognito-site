# Référence du PDF privé SAGA-IA

6 octobre 2026 · Axe II, Cible I · préparation technique locale de la livraison.

Boris a désigné le PDF destiné à la vente :
`/home/boris/VIBE/projets/qognito-content/formations/saga-ia/volume-01/editions/fr/1.0/saga-ia-volume-01-fr-v1.0.pdf`.

La présence du fichier et ses octets ont été vérifiés en lecture seule :

- Édition : `saga-ia-volume-01-fr-v1.0`, français, version 1.0.
- Taille : 1 698 109 octets.
- SHA-256 : `71b0cd2784b44ac7a6ce56e50941651a991a27153c47de878d7a1e4ab17562f5`.

Ces informations sont consignées dans `commerce/saga-volume-01.json`, champ
`contents.private_pdf_candidate`. Le chemin source est relatif à la racine de
`qognito-site`. Ce champ est un inventaire local : aucun endpoint ne le consomme
et aucun fichier n’a été copié dans le site ou dans un stockage distant.

Le manifeste `publication.yml` de `qognito-content` décrit cette édition au statut
`preparation`. L’édition FR courante, la date de validation, la taille et l’empreinte
du manifeste ne sont pas encore renseignées. Ce constat doit être rapproché de la
remise éditoriale ; aucune modification du manifeste ou du PDF n’est effectuée
dans ce chantier frontend. Cette vérification n’évalue pas le contenu du PDF.

Contrôles locaux réussis : concordance de la taille et du SHA-256 entre catalogue
et fichier source ; comparaison avec 116 fichiers dans `public/` et `dist/`,
sans copie identique détectée ; `git diff --check`. Cette comparaison ne détecte
pas une version modifiée du document. Aucun canal de vente actif.

Le catalogue commercial reste un brouillon, `sellable_editions` reste vide,
les canaux de vente restent désactivés et le prix commercial reste indéfini.
La présence du PDF ne configure ni la fiscalité du pack ni les droits Arbitre.
La langue FR de cet artefact ne constitue pas une édition PDF anglaise.

Pour la prochaine tranche de livraison sandbox, utiliser cette empreinte pour
contrôler le fichier avant import dans un stockage privé, puis relier le droit PDF
à l’édition achetée et à un bénéficiaire authentifié. L’accès nominatif à Arbitre
doit être préparé séparément. Les tâches de la recette Stripe restent en attente.
