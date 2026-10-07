# Remise des publications de formation

Structure adoptée le 6 octobre 2026. La livraison payante reste à implémenter.

## Référence éditoriale

Les publications finalisées sont remises dans le dépôt voisin :

```text
../qognito-content/formations/saga-ia/
├── README.md
└── volume-01/
    ├── publication.yml
    ├── editions/fr/1.0/
    └── apercus/fr/1.0/
```

Le premier volume réunit les sections 1 et 2 dans un PDF unique, couverture incluse. Les sources et la fabrication restent dans `../formation_saga_c1`. Les éditions EN et ES et les volumes suivants seront ajoutés lorsqu’ils seront préparés.

L’inventaire `publication.yml` identifie les artefacts par langue et version, leur statut, leur provenance et leurs empreintes. Les chemins d’artefacts sont relatifs au dossier de cet inventaire. Une édition en `preparation` ou sans fichiers validés n’est pas disponible. Au moment de la création de la structure, aucune édition courante n’est déclarée.

## Règle de récupération

Le futur processus devra sélectionner explicitement une édition `valide_pour_diffusion`, vérifier ses fichiers et leurs empreintes, puis traiter séparément :

| Artefact | Destination |
| --- | --- |
| Couverture et extrait validés sous `apercus/` | Ressources publiques du site |
| PDF complet sous `editions/` | Stockage privé et livraison après vérification du droit de l’acheteur |

**Aucune copie globale de `formations/` vers `public/` ou `dist/`.** Les livres blancs suivent aujourd’hui une diffusion publique avec formulaire ; ce circuit ne protège pas un PDF payant. `noindex` ne constitue pas un contrôle d’accès.

Le catalogue marchand conserve les prix, taxes, pays desservis, licence et droits à Arbitre. L’identifiant éditorial `saga-ia-volume-01` ne représente pas à lui seul l’offre commerciale PDF + accès à Arbitre. La disponibilité du fichier, celle de l’offre et celle de l’application sont distinctes.

Cette documentation n’active aucune route, traduction, copie de fichier, collecte, paiement ou intégration ACP/UCP. La configuration des livres blancs reste indépendante.
