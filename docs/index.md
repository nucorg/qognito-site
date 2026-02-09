# Qognito.io — L'Ingénierie de l'Intelligence Physique

## La Thèse

**La physique valide l'IA — pas l'inverse.**

L'industrie critique ne tolère pas l'hallucination. Un réacteur nucléaire ne se pilote pas avec des probabilités, un réseau électrique ne se stabilise pas avec des chatbots, un procédé chimique ne se surveille pas avec du texte brut.

L'IA générative actuelle maîtrise le langage. Elle ignore la physique. Elle consomme trop d'énergie, hallucine trop souvent et réagit trop lentement pour les systèmes où l'erreur a un coût physique réel.

Qognito.io conçoit des architectures de données industrielles où les lois de la physique contraignent l'IA *avant* qu'elle ne raisonne — pas après. Je ne vends pas de l'IA "bavarde". Je livre des systèmes qui ne peuvent pas halluciner sur votre métier, parce que la thermodynamique, la neutronique et la cinétique chimique les en empêchent.

---

## La Preuve

### 19 mois chez EDF — 2 systèmes opérationnels

Depuis mi-2024, je conçois et livre des architectures de données pour la surveillance des réacteurs nucléaires du parc EDF. Ce n'est pas du conseil. Ce sont des systèmes qui tournent.

#### POC 1 — Pipeline de Données de Procédés

Plateforme de visualisation temps réel haute performance avec assistant virtuel expert pour la surveillance des données nucléaires.

**Ce que j'ai construit :**
- **Data Lake Medallion** (Bronze → Silver → Gold) sur Apache Arrow partitionné, avec moteur analytique DuckDB zero-copy — des millions de points de données capteur traités en sub-seconde, 32 threads, 32 GB RAM
- **3 règles de validation physique** codées et testées :
  - *Règle 1 — Aberrations statistiques :* Puissance bornée à 110% PN (protection AAR), bore >= 0 ppm
  - *Règle 2 — Impossibilité neutronique :* Le réacteur ne peut pas être en puissance si les grappes sont chutées
  - *Règle 3 — Cohérence chimique :* Écart boremètre/chimiste > 50 ppm = capteur défaillant
- **4 modules d'imputation physique** — chaque variable est imputée selon sa physique propre : LOCF pour les grappes (mouvement discret par crans), spline cubique pour la puissance (dynamique continue), redondance spatiale pour les températures (4 boucles corrélées), interpolation linéaire pour le bore (cinétique lente)
- **Filtrage Kalman** calibré par phase opérationnelle : ordre 0 (random walk, p_factor=4.0) pour la stabilité thermique EPN, ordre 1 (linear growth, p_factor=1.5) pour le suivi de rampes en montée en puissance
- **Arbre de décision physique** classifiant automatiquement 7 phases opérationnelles (INVALID, EPN, SHUTDOWN, STRETCH, TRANSIENT, MEP, CYCLE) à partir des constantes REP 900 MWe
- **270+ tests unitaires** couvrant chaque règle, chaque module, chaque edge case

**Résultat :** Pipeline opérationnel traitant les données de 11 unités du parc nucléaire (GR1, GR2, CN2, TN3, FL3, PA4, CH2, BU5, BE1, CI1, CR1), 3 paliers (900, 1300, 1450 MWe). Taux de correction physique : 96.4% des incohérences résolues automatiquement.

#### POC 2 — Assistant Expert Nucléaire - Coeur Combustibles

Système d'IA conversationnelle spécialisé dans le domaine nucléaire, capable d'interroger les données de surveillance en langage naturel *sans halluciner* sur la physique.

**Ce que j'ai construit :**
- **Knowledge Graph Neo4j** modélisant l'ontologie nucléaire complète : 11 réacteurs, 10 paramètres physiques, 9+ capteurs par unité, 5 règles physiques, corrélations inter-paramètres avec force quantifiée
- **3 outils de Tool Calling** (Claude Haiku) : recherche sémantique de capteurs via le graphe, extraction haute performance de séries temporelles via DuckDB, diagnostic d'anomalies via les règles physiques du Knowledge Graph
- **Intelligence métier intégrée** : substitution automatique des capteurs selon la phase (neutronique privilégiée en EPN), recommandation de capteurs corrélés pour le diagnostic (Kalman dérivée de puissance pour instabilité thermique), adaptation au palier (3 boucles / 4 boucles)

**Résultat :** Un ingénieur pose une question en français ("Diagnostique RCP104MT, la température semble instable"), l'assistant interroge le Knowledge Graph, identifie la règle physique applicable, extrait les données, et recommande le capteur corrélé — en moins de 2 secondes.

---

## Les Principes

Ces principes ne sont pas des slogans. Ce sont les règles de conception que j'applique depuis 19 mois. Chacune est adossée à un choix technique vérifiable.

### La Physique avant le Verbe (Physics First)

L'IA actuelle est probabiliste ; l'industrie est déterministe. Pour les systèmes critiques, la statistique ne suffit pas.

*En pratique :* Je ne confie jamais une donnée brute à un algorithme. Le pipeline valide d'abord par la physique (bornage, cohérence neutronique, recalage chimique par assimilation de données), puis impute selon la dynamique propre de chaque variable (inertie thermique, cinétique du bore, mouvement discret des grappes). L'IA intervient *après* cette couche de vérité physique — contrainte par un Knowledge Graph qui encode les lois du domaine.

### La Sobriété comme Architecture (Data Sobriety)

Une mauvaise architecture de données est une dette énergétique et cognitive. Les détails arides — nettoyage de logs, optimisation de flux, structures de partitionnement — sont là où se trouve l'impact réel.

*En pratique :* Architecture zero-copy (Arrow + DuckDB) traitant des téraoctets sans duplication mémoire. Partitionnement Bigramme/Trigramme pour un pruning automatique qui réduit les données scannées d'un facteur 10 à 100x. Sub-seconde pour 1 million de points. Pas de GPU, pas de cluster — un seul serveur bien architecturé.

### Le Critère de Solvabilité (Pragmatisme de Combat)

Avoir raison en théorie ne suffit pas. Avant chaque projet, j'applique le filtre "3S" — trois questions impitoyables :

1. **Sizeable** (Considérable) — Le problème a-t-il un impact vital sur vos opérations ?
2. **Overlooked** (Négligé) — Est-ce un sujet technique "aride" que les autres ignorent, là où réside la valeur réelle ?
3. **Solvable** (Soluble) — Avez-vous la physique et la donnée pour le résoudre ?

Si un projet ne passe pas ces trois filtres — manque de données, latence trop élevée, contrainte physique non modélisable — je le tue immédiatement. Je livre des systèmes qui marchent dans le monde réel, pas des POC éternels.

---

## L'Offre

### Architecture de Données Industrielles sous Contrainte Physique

**Ce que je livre :** Des pipelines de données de procédés (séries temporelles capteurs) avec validation physique intégrée, Knowledge Graphs métier, et assistants IA contraints par les règles de votre domaine.

**Concrètement :**

- **Pipeline Medallion (Bronze → Silver → Gold)** — Ingestion, nettoyage, imputation physique, validation, enrichissement. Chaque étape est traçable, testée, auditable. Les règles physiques de votre domaine sont codées comme contraintes de premier rang, pas comme post-traitements.

- **Knowledge Graph Métier** — Modélisation de l'ontologie de votre installation : équipements, capteurs, paramètres physiques, règles de cohérence, corrélations. Ce graphe devient le socle de vérité qui contraint tout raisonnement IA en aval.

- **Assistant IA Expert** — Interface conversationnelle où un LLM interroge vos données *à travers* le Knowledge Graph. L'assistant ne peut pas halluciner sur votre métier : il n'a accès qu'aux faits validés par le graphe et les outils de Tool Calling. Il diagnostique, recommande, extrait — en langage naturel, en temps réel.

- **Audit & Cadrage "First Principles"** — Avant de construire, je passe votre projet au filtre 3S. Si le problème n'est pas Sizeable, Overlooked et Solvable, je vous le dis avant de facturer. Objectif : tuer les faux projets pour accélérer les vrais, et livrer une preuve de valeur en moins de 3 mois.

**Pour qui :**
- Exploitants de systèmes critiques (nucléaire, énergie, chimie, aéronautique)
- Ingénieries et bureaux d'études avec des données de procédés en séries temporelles
- Tout industriel dont les données capteur doivent respecter des lois physiques avant d'alimenter un modèle

---

## La R&D en cours — PI-VAE (Physics-Informed Variational Auto-Encoder)

Au-delà des pipelines de validation, je développe un **générateur de données synthétiques de réacteur nucléaire** physiquement cohérent.

**Le problème :** Les données nucléaires sont sensibles, restreintes, et les phases opérationnelles rares (transitoires, EPN) sont sous-représentées. Entraîner des modèles ML sur ces données est soit impossible (compliance), soit biaisé (déséquilibre de classes).

**L'approche :** Un Variational Auto-Encoder informé par la physique (PI-VAE) avec :
- **Encodeur GRU** capturant les dépendances temporelles longues (cycle de combustible) et courtes (transitoires, suivi de charge)
- **Échantillonnage MCMC** dans l'espace latent pour garantir la continuité physique entre séquences générées (pas de saut "arrêt à chaud → pleine puissance")
- **Validation physique de la génération** : le modèle n'est pas évalué sur l'erreur de reconstruction (MSE) mais sur la conservation des corrélations physiques — si une baisse de puissance est générée sans la perturbation d'Axial Offset associée, le modèle a échoué

**Le statut :** Stade VAE (architecture de base). Prochaine étape : intégration des contraintes physiques dans la loss function et validation sur données Gold du pipeline EDF.

**La valeur :** Un générateur synthétique validé physiquement ouvre la porte à l'entraînement de modèles ML sans accès aux données réelles (export, formation), à la simulation de scénarios opérationnels (stress tests), et à l'augmentation de datasets pour les phases rares.

---

## La Feuille de Route

**2024–2026 (en cours)** — Mission EDF. Livraison des POC pour le Programme Vision 2035. Construction du pipeline de validation physique et du Knowledge Graph nucléaire. Développement du PI-VAE.

**Fin 2026** — Sortie du portage ESN. Facturation directe. Capitalisation sur 2+ ans de relation prouvée avec EDF.

**2027+** — Industrialisation de l'architecture (pipeline + Knowledge Graph + assistant) comme solution reproductible pour d'autres exploitants de systèmes critiques. Poursuite de la R&D PI-VAE vers un générateur synthétique industrialisable.

---

## Le Stack Technique

| Couche | Technologies |
|---|---|
| **Data Engineering** | Apache Arrow, DuckDB (zero-copy, 32 threads), Parquet partitionné, architecture Medallion (pins) |
| **Validation Physique** | Règles déterministes (neutronique, chimique, thermique), filtrage Kalman (dlm), gradients cinétiques |
| **Knowledge Graph** | Neo4j (ontologie métier, règles physiques, corrélations, contraintes d'unicité, index sémantiques) |
| **IA Cognitive** | Anthropic Claude (Tool Calling), ellmer (orchestration LLM), RAG contraint par graphe |
| **Deep Learning** | VAE / PI-VAE (GRU encoder-decoder, MCMC latent sampling) — R&D en cours |
| **Visualisation** | Shiny Dashboard, dygraphs (séries temporelles interactives), Plotly |
| **Qualité** | testthat (270+ tests), renv (reproductibilité), validation anti-injection SQL |
| **Langage** | R | Python

---

## Qui je suis

Boris Guarisma. Expert IA/Data spécialisé dans l'IA sous contrainte physique pour les systèmes critiques.

19 mois chez EDF. 2 POC opérationnels. 270+ tests. 11 réacteurs. 3 règles physiques. 1 PI-VAE en cours.

Je ne suis pas une ESN. Je ne vends pas du temps. Je conçois des architectures où la physique empêche l'IA de mentir.

**Contact :** bguarisma@qognito.io
