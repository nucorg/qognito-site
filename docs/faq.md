# FAQ

## Les concepts

### Qu'est-ce que l'IA sous contrainte physique ?

Une approche d'ingénierie où les lois physiques du domaine — thermodynamique, neutronique, cinétique chimique, mécanique — sont encodées comme des contraintes de premier rang dans l'architecture de l'algorithme. L'IA ne peut pas proposer de résultat qui viole les lois de votre métier. Ce n'est pas un filtre appliqué après coup : c'est la structure même du système.

→ Voir **La Preuve** pour les cas d'application concrets.

---

### Qu'est-ce que le Filtre CAP ?

Ma méthodologie de qualification avant chaque engagement. Trois critères, simultanément :

- **C — Contraint.** Le problème est borné par une loi physique.
- **A — Aride.** Le sujet est techniquement négligé (pas commoditisé).
- **P — Prouvable.** Un prototype fonctionnel est livrable en moins de 3 mois.

Si le projet ne passe pas les trois, il n'est pas pris.

---

### Qu'est-ce qu'un Knowledge Graph métier ?

Un graphe de connaissances qui modélise l'ontologie d'une installation industrielle : équipements, capteurs, paramètres physiques, règles de cohérence, corrélations quantifiées. Il encode explicitement les relations entre les éléments de votre domaine. C'est ce graphe qui contraint l'assistant IA : le LLM ne raisonne pas seul, il interroge le graphe — et ne peut accéder qu'aux faits physiquement validés.

→ Pour approfondir la méthodologie de conception : [Quand l'IA rencontre la physique (et perd)](https://blog.bguarisma.com/quand-ia-rencontre-physique-et-perd)

---

## Les questions pratiques

### Nos données sont sensibles — comment gérez-vous la confidentialité ?

Je travaille dans le nucléaire depuis mi-2024. La sensibilité des données n'est pas un sujet annexe — c'est une contrainte de conception.

Concrètement : les données restent dans l'infrastructure du client. Le Knowledge Graph encode la structure métier (ontologie, règles, corrélations), pas les données brutes. Le LLM n'a jamais d'accès direct aux données : il les interroge à travers le graphe, avec validation anti-injection. Le prototype est conçu pour s'intégrer dans le cadre de sécurité existant de votre organisation.

---

### Combien de temps faut-il pour un premier livrable ?

Le Filtre CAP donne un go/no-go en quelques jours. Si le projet passe, le prototype fonctionnel est livré en moins de 3 mois. Ce délai dépend de deux facteurs : la disponibilité de vos données et la complexité de la physique à encoder. Le pipeline de validation, le Knowledge Graph et l'assistant sont des briques modulaires — on ne repart pas de zéro à chaque engagement.

---

### Que se passe-t-il après le prototype ?

Le prototype est conçu avec une exigence de production dès le départ : tests systématiques, validation physique, architecture documentée. L'objectif est que votre équipe de delivery (ou votre intégrateur) parte d'une base solide pour l'industrialisation — pas d'un démonstrateur jetable.

Je livre : le prototype fonctionnel, l'architecture documentée, et la preuve mesurable que l'approche tient. Je peux accompagner la transition vers l'équipe produit si nécessaire, mais l'objectif est votre autonomie.

---

### Quelle est la différence avec une ESN ou un cabinet de conseil ?

Quatre différences structurelles :

**L'engagement porte sur un livrable, pas sur du temps.** Je livre un prototype fonctionnel avec une preuve mesurable — pas un rapport de cadrage ni des jours de régie.

**La qualification est en amont.** Le Filtre CAP évalue le projet avant l'engagement. Si le problème ne passe pas les trois critères, je vous le dis avant de facturer.

**L'expertise est intégrée, pas distribuée.** Physique nucléaire, data engineering haute performance et IA cognitive dans un seul interlocuteur. Pas de chaîne de sous-traitance, pas de consultant junior qui monte en compétence sur votre budget.

**Le délai est court.** Preuve de valeur en moins de 3 mois, parce que le format (pipeline + Knowledge Graph + assistant) est déjà éprouvé.

---

### Peut-on commencer par un diagnostic avant de s'engager sur un prototype ?

Oui. Le Filtre CAP est lui-même un diagnostic. La première étape consiste à évaluer si votre problème est Contraint, Aride et Prouvable. Si ce n'est pas le cas, vous le savez rapidement et sans engagement. Si ça l'est, le diagnostic alimente directement la spécification du prototype — rien n'est perdu.

---

### Pour quelles industries intervenez-vous ?

L'approche est pertinente partout où l'erreur algorithmique a un coût physique réel :

- **Nucléaire** — surveillance de réacteurs, validation de données capteurs, diagnostic, aide à la décision
- **Énergie** — réseaux électriques, optimisation de production, gestion de parcs sous contrainte thermodynamique
- **Chimie** — procédés continus, cinétique de réaction, surveillance de paramètres critiques
- **Aéronautique** — systèmes embarqués, maintenance prédictive sous contrainte mécanique et thermique

Plus généralement : toute industrie dont les données capteur doivent respecter des lois physiques avant d'alimenter un modèle ou un outil de décision.

---

### Comment prendre contact ?

**Un problème de données critiques où l'IA doit parler physique ?**

→ bguarisma@qognito.io
