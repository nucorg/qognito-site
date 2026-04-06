# Script de génération du Knowledge Graph pour Qognito.io
library(visNetwork)
library(htmlwidgets)
library(magrittr)

# 1. Définition des nœuds (Structure de l'Ontologie Physique)
nodes <- data.frame(
  id = 1:10,
  label = c(
    "Réacteur N4", "Palier 1300", "Puissance (RPN)", "Température (RCP)", 
    "Bore (REN)", "Grappes (RGL)", "Règle: Bornage", "Règle: Cohérence", 
    "Phase: EPN", "Assistant IA"
  ),
  group = c("Physique", "Physique", "Capteur", "Capteur", "Capteur", "Capteur", "Règle", "Règle", "Phase", "IA"),
  title = c("Système Physique", "Configuration Palier", "Mesure Neutronique", "Mesure Thermique", "Mesure Chimique", "Mesure Mécanique", "Contrainte Inviolable", "Validation Croisée", "État de Fonctionnement", "Interface Expert"),
  stringsAsFactors = FALSE
)

# 2. Définition des relations
edges <- data.frame(
  from = c(1, 1, 2, 3, 4, 5, 6, 3, 4, 7, 8, 9, 10),
  to   = c(2, 3, 1, 7, 7, 8, 8, 8, 8, 10, 10, 10, 1),
  label = c("est un", "possède", "configure", "validé par", "validé par", "contrôle", "contrôle", "corrélé à", "corrélé à", "contraint", "valide", "contextualise", "interroge"),
  stringsAsFactors = FALSE
)

# 3. Couleurs "Navy & Ambre" (Qognito)
colors <- list(
  Physique = "#0A1628", # Navy
  Capteur = "#6B7B8D",  # Gris Titane
  Règle = "#D4850F",    # Ambre
  Phase = "#add8e6",    # Bleu clair
  IA = "#0A1628"        # Navy
)

# Appliquer les couleurs aux nœuds
nodes$color <- sapply(nodes$group, function(g) colors[[g]])
nodes$font.color <- ifelse(nodes$color == "#0A1628", "white", "black")

# 4. Construction du graphe
network <- visNetwork(nodes, edges, width = "100%", height = "500px") %>%
  visNodes(shape = "dot", shadow = TRUE) %>%
  visEdges(arrows = "to", color = list(color = "#cbd5e0", highlight = "#D4850F")) %>%
  visOptions(highlightNearest = TRUE, nodesIdSelection = TRUE) %>%
  visInteraction(dragNodes = TRUE, dragView = TRUE, zoomView = TRUE) %>%
  visPhysics(solver = "forceAtlas2Based", stabilization = TRUE)

# 5. Sauvegarde dans les assets du site
# Le chemin est maintenant relatif au dossier qognito-site/
output_path <- "docs/assets/knowledge_graph.html"
saveWidget(network, file = output_path, selfcontained = TRUE)

message(paste("Succès ! Le graphe a été généré ici :", output_path))
