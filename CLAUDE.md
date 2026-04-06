# CLAUDE.md — qognito-site

Site vitrine Qognito.io. Complète `~/VIBE/projets/CLAUDE.md` et `~/VIBE/CLAUDE.md`.

---

## Identité / Contexte

Site public mono-page. Boris n'est pas expert web — **toujours expliquer l'impact visuel
avant d'éditer**. Les règles de marque Qognito (Je/Nous, POC) s'appliquent via
`~/VIBE/QOGNITO/CLAUDE.md`.

---

## Standards techniques

### Stack

- **Générateur** : MkDocs 1.6.1
- **Thème** : Material for MkDocs 9.7.1 (`mkdocs-material`)
- **Architecture** : site mono-page (`index.md`) avec navigation par ancres `#section`
- **Build** : `mkdocs build` → `site/` (ne jamais éditer `site/` directement)
- **Preview** : `mkdocs serve`

### Structure des fichiers à éditer

```
docs/
├── index.md          ← contenu principal (page unique)
├── encodeur.md       ← page "L'Encodeur de Contraintes"
├── faq.md            ← FAQ
├── blog.md           ← agrégateur blog
├── stylesheets/
│   └── extra.css     ← SEUL fichier CSS à modifier (65 lignes)
└── javascripts/
    └── nav-anchors.js ← ne pas modifier sauf bug de navigation
overrides/
└── main.html         ← Schema.org JSON-LD + meta Bing — modifier avec précaution
mkdocs.yml            ← config navigation, thème, couleurs
```

### Branding

| Élément | Valeur |
|---------|--------|
| Navy Qognito (primaire) | `#0A1628` |
| Safety Amber (accent) | `#D4850F` |
| Titanium Gray (texte secondaire) | `#6B7B8D` |
| Logo principal | `docs/assets/Qognito_lettre_entier.png` |
| Assets haute résolution | `~/VIBE/QOGNITO/branding/` |

Toute nouvelle couleur doit respecter cette palette.

---

## Comportement

- **Avant toute modification CSS** : décrire précisément l'effet visuel attendu avant d'éditer
- **Avant toute modification `mkdocs.yml`** : expliquer l'impact sur la navigation ou le build
- **Avant toute modification `main.html`** : signaler la complexité Jinja2 + JSON-LD et confirmer avant d'éditer
- **Ancres** : modifier un titre = casser potentiellement un lien de nav → vérifier `mkdocs.yml` en parallèle
