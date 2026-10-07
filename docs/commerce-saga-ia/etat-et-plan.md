# SAGA-IA — préparation du commerce, 6 octobre 2026

Périmètre : Axe II, Cible I. Dossier interne de décision, sans publication ni activation.
Rôles Frontend-Qognito et Copywriter-B2B ; workflow `localiser-site-qognito`.
Les sources de formation et le manifeste éditorial ont été laissés intacts.

Décision suivante de Boris : différer ACP/UCP, préparer Stripe aujourd’hui et remplir
personnellement le formulaire OpenAI après cette intégration. Voir `stripe.md` pour
la tranche technique de test et `questions-prix.md` pour l’entretien économique.
L’audit ci-dessous conserve l’état initial, avant cette tranche Stripe.

## Recommandation

Construire d’abord une vente directe vérifiable, puis raccorder les canaux dont
l’admission est confirmée. Le numérique est représentable dans ACP et UCP ; cette
capacité ne vaut pas admission dans ChatGPT, Google ou Stripe Agentic Commerce Suite.
Le choix ultérieur doit dépendre des marchés admis, du pack accepté, du coût complet
et de la demande réelle, plutôt que du protocole développé en premier.

## État local vérifié

| Élément | Constat | Conséquence |
| --- | --- | --- |
| Site | Astro 6, build statique ; routes FR et EN, aucune route ES | FR/EN pour la présentation ; pas d’activation ES |
| SAGA | `src/content/saga.ts`, composants `SagaCard` et `SagaProgramme`, pages `/formations/` et `/en/formations/` | Le cursus en cinq sections et l’offre du volume 1 doivent rester distincts |
| Publication | `../qognito-content/formations/saga-ia/volume-01/publication.yml` : FR 1.0 en `preparation`, édition courante nulle, validations et empreintes nulles | Rien à importer aujourd’hui ; EN n’est pas une édition livrable |
| Artefacts | Seul `publication.yml` présent sous `volume-01/` à la lecture | PDF final, couverture et extrait attendus de l’autre chantier |
| Stripe | Aucun SDK, route de checkout, webhook, identifiant produit/prix ni variable Stripe trouvé dans le code/configuration inspectés | Stripe prévu, intégration locale absente ; état d’un compte externe inconnu |
| Livraison | Les livres blancs publics utilisent Web3Forms et des PDF sous `public/livres-blancs/` | Circuit impropre au PDF payant ; `noindex` n’est pas une protection |
| Arbitre | README et séparation décrivent un déploiement shinyapps.io ; aucune attribution email, liste d’accès ou liaison de commande dans le code R inspecté | Protection distante et plan d’hébergement non vérifiés ; ne pas promettre un provisionnement opérationnel |
| Vendeur | Mentions légales du site : QOGNITO SASU, France, numéro de TVA déclaré | Déclaration du site ; régime fiscal et marchés à confirmer par Boris |

La documentation `docs/publication-formations.md` était déjà non suivie dans Git
au début de la tâche : elle est conservée sans modification. Aucun cours, compte,
droit distant, objet Stripe ou fichier de publication n’a été modifié.

## Standards et canaux commerciaux

Recherche officielle effectuée le 6 octobre 2026. Recontrôler avant raccordement :
ces accès et spécifications évoluent. Aucun compte de marchand n’a été audité.

| Canal | Pays et accès effectif | Pack PDF + Arbitre | Décision actuelle |
| --- | --- | --- | --- |
| ACP, standard ouvert | Implantable par un marchand indépendamment d’une plateforme | Le standard prévoit notamment les biens numériques ; pas de certification de ce pack | Garder un adaptateur possible ; aucun endpoint factice |
| ChatGPT, flux produits | Partenaires approuvés seulement. L’upload standard cible les US ; pays et devises supplémentaires exigent confirmation OpenAI. L’implantation française seule ne démontre ni exclusion ni admission | `is_digital` existe, avec configuration préalable ; ce champ ne constitue pas une admission du PDF de formation avec outil | Admission du vendeur français, marchés et nature du pack non confirmées |
| UCP, standard ouvert | Profil, négociation de capacités et paiement indépendants du pays ; contraintes du canal séparées | Checkout numérique possible sans fulfillment physique | Adaptateur possible sur le même backend |
| Google AI Mode/Gemini, checkout UCP | Marchands sélectionnés. L’aide mentionne US/Canada/Australie, mais le guide du hub daté du 2 octobre décrit un accès US, Canada/Australie à venir. Pas d’accès France démontré | Shopping exclut les livres numériques ; le guide checkout exclut notamment les cours en ligne et certains services groupés | Offre incompatible avec les restrictions observées ; ne pas développer ce raccordement sans admission explicite du pack |
| Stripe Agentic Commerce Suite (ACS) | France dans la liste de pays vendeur ; compte et configuration requis. Chaque connexion à un agent demande son acceptation | Stripe expose des solutions pour contenus numériques/services ; aucun accord propre à Qognito établi | Route candidate à comparer à des adaptateurs propres après confirmation du pack et des agents |
| Vente directe | À définir selon pays, clientèle, fiscalité et capacité de livraison | Offre cohérente en principe ; reste à valider commercialement et à livrer effectivement | Fondation prioritaire, préparation locale uniquement |

Sources : [ACP officiel](https://www.agenticcommerce.dev/),
[onboarding OpenAI](https://developers.openai.com/commerce/guides/get-started),
[champs et marchés OpenAI](https://developers.openai.com/commerce/specs/file-upload/products?fields=required&version=currently-stable&view=table),
[checkout UCP](https://ucp.dev/latest/specification/checkout/),
[programme Google](https://support.google.com/merchants/answer/16837055?hl=fr),
[déploiement réel du hub UCP](https://developers.google.com/merchant/ucp/guides/tools/merchant-center/overview),
[conditions et restrictions checkout Google](https://developers.google.com/merchant/ucp/guides/overview/merchant-center),
[règle Google sur les livres numériques](https://support.google.com/merchants/answer/14183113?hl=en),
[services non admis dans Shopping](https://support.google.com/merchants/answer/6150006?hl=en-GB),
[Stripe ACS et pays](https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail),
[panorama Stripe](https://docs.stripe.com/agentic-commerce).

**Écart documentaire Google à conserver** : l’aide généraliste énumère trois
marchés, alors que le guide du hub, mis à jour le 2 octobre 2026, décrit un
déploiement US et annonce les deux autres pour le début de l’année suivante.
Ne pas présenter Canada/Australie comme ouverts au compte Qognito. Le guide impose
en outre un compte Merchant Center en règle, des produits approuvés pour les fiches
gratuites, des politiques de retour, le support et l’éligibilité checkout explicite.
Ces exigences ne sont pas satisfaites par un simple profil UCP sur notre domaine.


Les règles des plugins ChatGPT constituent un canal distinct : leurs règles actuelles
limitent le commerce aux biens physiques. Elles ne doivent pas être extrapolées à
toute découverte web ou à toute implémentation d’ACP.
[Règles des plugins](https://developers.openai.com/plugins/app-guidelines).

## Découverte, sélection, achat

1. **Découverte** : une page publique peut être trouvée sur le web ; un flux structuré
   peut être accepté par une plateforme. Aucun de ces mécanismes ne garantit une
   recommandation, un classement ni l’admission à un checkout intégré.
2. **Sélection** : l’agent présente une offre et ses conditions. Il faut identifier
   le pack, la langue/version du PDF réellement disponible, le bénéficiaire et le
   prix applicable à son marché. EN sur la page ne signifie pas PDF EN livré.
3. **Achat** : checkout sur le site après redirection, ou checkout intégré admis par
   la plateforme. Le paiement doit ensuite produire une commande vérifiée et des
   droits effectifs ; le protocole n’effectue pas notre livraison à notre place.

L’[onboarding OpenAI](https://developers.openai.com/commerce/guides/get-started)
documente d’abord les flux de produits. Le
[guide Google](https://developers.google.com/merchant/ucp) distingue données Merchant
Center et checkout. Ces parcours ne doivent pas être assimilés à une ouverture
automatique de l’achat à tous les marchands.

## Coexistence et dépendances

**Coexistence ACP/UCP : possible par architecture**, sans supposer leur identité ni
un pont automatique. Deux adaptateurs peuvent appeler le même catalogue, calcul
fiscal, service de commande et registre de droits. Stripe documente l’usage d’ACP
ou UCP dans sa suite. Recommandation d’architecture déduite de ces interfaces, pas
preuve qu’un pack Qognito est déjà raccordé aux deux.
[Stripe](https://docs.stripe.com/agentic-commerce),
[architecture UCP](https://ucp.dev/specification/overview/).

**Stripe** : prévu pour Qognito, mais aucune obligation universelle de choisir Stripe
dans ACP ou UCP. ACP accepte des PSP compatibles ; UCP négocie des payment handlers.
Choisir ACS introduit les dépendances commerciales et techniques propres à Stripe,
ainsi que l’acceptation de chaque agent. Frais, fonctions disponibles et conditions
du compte Qognito restent à obtenir.
[FAQ ACP](https://www.agenticcommerce.dev/),
[paiements UCP](https://ucp.dev/specification/overview/),
[connexion des agents chez Stripe](https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail).

**Cloudflare** : hébergement du site existant ; ni ACP ni UCP n’imposent Cloudflare.
Workers et un stockage R2 privé sont une option pour le backend et le PDF, à comparer
à un autre service existant. R2 signé limite la durée d’accès, mais le lien est
réutilisable et partageable jusqu’à expiration. Le serveur doit vérifier le droit
avant de l’émettre ; pour un contrôle nominatif à chaque téléchargement, servir le
fichier derrière une session authentifiée. Ne jamais ouvrir le bucket complet.
[Documentation R2](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

**Arbitre** : shinyapps.io permet des applications privées et des invitations email
avec les plans Standard/Professional ; le réglage distant n’est pas démontré par
l’absence d’authentification dans le code R. Vérifier le plan réel, les quotas,
l’invitation, l’identité du bénéficiaire et le coût en charge. Ne pas confondre
utilisateur invité à une application et membre du compte pouvant publier.
[Posit, accès et invitations](https://docs.posit.co/shinyapps.io/guide/authentication_and_user_management/).

## Ordre de réalisation et points de passage

| Ordre | Travail | Inconnue à résoudre / preuve requise |
| --- | --- | --- |
| 1 | Catalogue commun du pack et arbitrage économique | Coûts de Boris, réserve Arbitre, sens contractuel de « durable », cible et marchés |
| 2 | Qualification fiscale et conditions de vente | Qualification du PDF ; opération composite ou éléments distincts ; règles par marché/clientèle ; rétractation, remboursement et licence adaptés |
| 3 | Remise éditoriale | PDF final validé, édition choisie, hashes ; couverture/extrait validés. EN attend sa propre édition |
| 4 | Backend de commande et livraison en mode test | Paiement signé vérifié, journal de commandes, droits, stockage privé, attribution Arbitre effectivement testée |
| 5 | Présentation FR/EN et prix décidé | Relecture des blocs, disponibilité réelle par langue, prix/taxes/conditions exacts ; contrôle desktop/mobile |
| 6 | Vente directe réelle, après accord | Parcours complet testé et autorisation de prix, paiement et déploiement |
| 7 | Canaux agentiques admis | Confirmation vendeur/pays/pack et conditions ; choisir ACS ou adaptateurs sur le coût et les contraintes observés |

En parallèle des étapes 1–4, préparer les questions d’admission suivantes sans les
envoyer : « QOGNITO SASU, établie en France, peut-elle vendre sur vos surfaces dans
les marchés [à définir] un PDF de formation, édition fixe, avec un accès nominatif
durable à une application de simulation, sans abonnement ? Quels parcours sont
admis : découverte/flux, redirection au checkout, checkout intégré ? Quels frais,
prestataires et règles de remboursement s’appliquent ? » Aucun message externe
n’est envoyé dans cette tâche.

## Contrat technique proposé pour la prochaine tranche

Une commande conserve `order_id`, canal, identifiant fournisseur de paiement,
offre/version, édition/langue, montant/devise/taxes, bénéficiaire vérifié et version
des conditions acceptées. Les identifiants fournisseur/commande sont uniques.
Le retour du navigateur après paiement n’est jamais une preuve de règlement.

Après notification signée et vérification du règlement, le backend enregistre la
commande, crée une tâche de livraison durable et attribue deux droits séparés :
PDF de l’édition achetée et Arbitre pour une personne. Les reprises de notification
ne créent pas de deuxième droit. PDF et Arbitre ont chacun leur état : `pending`,
`granted`, `failed` ou `revoked`. Un échec partiel déclenche une reprise suivie ;
il ne devient pas silencieusement une livraison complète.

Contrôles de la prochaine tranche : paiement refusé/incomplet, notification invalide,
notification rejouée, identité non autorisée, lien expiré, invitation Arbitre échouée,
reprise après incident, remboursement et réconciliation des droits. Une attribution
manuelle initiale est envisageable si son délai est annoncé et son suivi fiable.
La procédure de remboursement/révocation reste à arbitrer avant implémentation.

## Travaux réalisés dans cette tranche

`commerce/saga-volume-01.json` prépare l’offre sans montant, marché ni canal actif.
`scripts/commerce-pricing.mjs` simule le prix requis avec coûts et fiscalité explicites.
`commerce/pricing-input.example.json` reste volontairement incomplet.
Les textes FR/EN sont proposés dans `offre-fr-en.md`, hors des routes publiques.
Ces fichiers ne sont consommés par aucun checkout ni flux ACP/UCP.

Les nouveaux constats sur les canaux pourraient être reportés à la stratégie via
`qognito-strat-update` dans une tâche distincte ; aucun report n’est effectué ici.
