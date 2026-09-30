# Ponctuation et retours à la ligne

Dans les textes français, utiliser une espace insécable (U+00A0) avant `:`, `;`, `?` et `!` pour garder la ponctuation avec le mot précédent.

- Dans le texte HTML/Astro : `réaffecté&nbsp;: les trois angles morts`.
- Dans une chaîne JavaScript/TypeScript : `"réaffecté\u00a0: les trois angles morts"`, ou le caractère insécable directement.
- Après une expression Astro : `{label}{"\u00a0:"}`. Une espace insécable littérale isolée en début de nœud peut être normalisée par le compilateur ; vérifier le HTML généré.
- En anglais, attacher directement la ponctuation au mot précédent : `Prerequisites:`.

Ne pas appliquer `white-space: nowrap` au paragraphe : il doit continuer à se replier sur mobile. Ne pas remplacer les espaces dans les opérateurs du code, les styles, les URL ou les valeurs techniques.

Après une modification, construire le site et vérifier le texte généré ainsi que le rendu aux petites largeurs. Les versions FR et EN partagent certains composants.
