## L'Encodeur de Contraintes

### Le problème que personne ne résout

L'IA généraliste ne connaît pas les lois de votre domaine. Votre expert métier ne sait pas les écrire dans un pipeline. Le data engineer sait construire le pipeline, mais pas quelles règles y mettre. Trois compétences nécessaires — zéro profil qui les couvre simultanément.

Résultat : l'IA est déployée sans contrainte physique, puis corrigée en boucle quand la recette métier échoue. Ou pire : elle est déployée avec des contraintes approximatives que personne n'a validées.

---

### Ce que fait l'Encodeur de Contraintes

Je prends le savoir tacite de vos experts métier et je l'encode dans des systèmes qui contraignent l'IA. Concrètement :

| Ce que votre expert sait | Ce que j'en fais |
|---|---|
| "Cette concentration est physiquement impossible" | Règle de bornage dans le pipeline de validation |
| "Dans cette phase, le comportement change" | Arbre de décision des phases opérationnelles, constantes calibrées par état |
| "Ce capteur dérive par rapport à la référence" | Recalage par assimilation de données dans la couche de nettoyage |
| "Quand cet équipement est à l'arrêt, cette mesure est un artefact" | Règle de cohérence physique codée comme contrainte de premier rang |
| "Ce signal est corrélé à celui-là dans cette configuration" | Corrélations quantifiées dans le Knowledge Graph |

L'expert ne sait pas écrire ces règles dans un pipeline. Le data engineer ne sait pas quelles règles écrire. L'IA ne sait pas qu'il y a des règles à écrire. **Mon rôle est le pont entre les trois.**

---

### Pourquoi ce profil est rare

Ce n'est pas une compétence unique — c'est une intersection.

La traduction entre physique industrielle, ingénierie des données et IA cognitive est elle-même tacite, contextuelle, forgée par l'expérience. On ne forme pas un traducteur physique-data-IA en bootcamp.

Chacun des trois domaines a ses experts. Mais l'expert en neutronique ne parle pas en DataFrames. Le data engineer ne parle pas en phénomènes. Le spécialiste IA ne parle pas en bornes physiques. Le travail de traduction — savoir *quoi* encoder, *comment* l'encoder, et *pourquoi* cette contrainte est non négociable — c'est une compétence de niveau architecte qui ne s'apprend que par la pratique sur des systèmes réels.

---

### Ce que ça change pour le client

**Sans encodage de contraintes :**

- L'IA produit des résultats statistiquement corrects mais physiquement faux
- L'expert métier valide manuellement chaque sortie — le gain d'automatisation disparaît
- Le turnover consultant remet le compteur à zéro : chaque nouveau profil redécouvre les règles du domaine

**Avec encodage de contraintes :**

- Les lois physiques sont codées dans l'architecture — l'IA ne peut pas les violer
- L'expert métier supervise le système, il ne le compense plus
- Les règles survivent au turnover : elles sont dans le code, pas dans la tête du consultant

> L'encodage de contraintes est une forme d'investissement : le savoir tacite de vos experts devient un actif technique transférable. Ce que je livre — prototype fonctionnel, architecture documentée, tests — reste exploitable après mon départ.

---

### La preuve par l'exemple

Depuis mi-2024, j'applique cette approche sur la surveillance des réacteurs nucléaires du parc français :

- **55 constantes physiques** encodées comme bornes inviolables dans le pipeline de validation
- **3 règles de cohérence** (bornage, impossibilité neutronique, cohérence chimique) automatisant 96,4 % des validations
- **7 phases opérationnelles** classifiées par arbre de décision calibré — pas par heuristique statistique
- **1 Knowledge Graph** encodant l'ontologie métier : réacteurs, capteurs, paramètres, règles, corrélations quantifiées
- **1 assistant IA** qui ne peut répondre qu'à travers les faits validés par le graphe — zéro hallucination sur le domaine

Chaque règle, chaque constante, chaque corrélation a été extraite d'un dialogue avec les experts métier, puis encodée dans un système testable (270+ tests unitaires).

→ Résultats détaillés : voir [La Preuve](index.md#la-preuve)

---

### Pour qui

Ce positionnement est pertinent si votre projet coche trois cases :

1. **Contraint** — Le problème est borné par une loi physique. Thermodynamique, neutronique, cinétique chimique, mécanique des fluides — si la réalité impose une borne que l'algorithme ne peut pas ignorer.

2. **Aride** — Le sujet est techniquement négligé. La valeur se cache dans les problèmes ingrats : nettoyage de séries temporelles, recalage de capteurs, validation de cohérence physique.

3. **Prouvable** — La faisabilité est démontrable par un prototype fonctionnel en moins de 3 mois.

C'est le [Filtre CAP](index.md#le-filtre-cap-pragmatisme-de-combat). Si le projet ne passe pas les trois, je ne le prends pas.

---

**Un système critique où l'IA doit respecter la physique de votre domaine ?**
→ bguarisma@qognito.io
