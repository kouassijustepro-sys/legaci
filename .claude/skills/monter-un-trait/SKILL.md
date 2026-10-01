---
name: monter-un-trait
description: Procédure complète pour transformer une fiche vidéo du Trait (LEGAC'I) en vidéo publiable dans l'Atlas de papier — scène JSON, aperçu, rendu, son, contrôle, exports. À utiliser quand on demande de monter, rendre ou préparer un Trait pour publication.
---
# Monter un Trait

Entrées attendues : le numéro du Trait, le tableau de scènes du Scénariste (ou le JSON), la voix balisée (fichier audio si elle existe), le feu vert des portes 1 (faits) et 2 (droits).

## 1. Préparer la scène
- Écris `atelier/scenes/<id>_<sujet>.json` d'après le tableau de scènes. Champs F3 : `id, duree, format, etiquette, titre[], tampon, ouverture, temps[{nom, debut, fin, sous, grand?, compteur?}], fin{debut, appel}`.
- 7 mots au plus par texte à l'écran ; sous-titres de 2 lignes au plus.
- Si un texte porte [À VÉRIFIER] : arrête-toi et demande le feu vert de la porte 1.

## 2. Rassembler les éléments
- Cherche dans `banque/` (textures, objets, mains, lieux, domaine public, portraits dessinés, sons, lettrages).
- Ce qui manque : liste-le pour le fondateur (à photographier, à dessiner, à demander). Un dessin provisoire peut servir pour l'aperçu, jamais pour la version publiée si une vraie photo est prévue.

## 3. Aperçu
`python3 atelier/apercu.py atelier/gabarits/<gabarit>.html --scene atelier/scenes/<fichier>.json --temps <6 à 8 temps> --sortie atelier/rendus/<id>/apercu.jpg`
Montre l'aperçu. Corrige avant de rendre.

## 4. Rendu
`python3 atelier/render.py atelier/gabarits/<gabarit>.html --scene <json> --sortie atelier/rendus/<id> --voix <voix.wav> --musique <beat.wav> --sons`
(sans voix ni musique : `--sons` seul pour les bruitages provisoires)

## 5. Contrôle (porte 3)
`python3 atelier/controle.py atelier/rendus/<id>` puis l'agent controleur-technique regarde 6 images. Tant que c'est BLOQUÉ, on corrige et on recommence.

## 6. Livrer
Dans `atelier/rendus/<id>/` : `_reseaux_1080x1920.mp4` (à publier), `_statut_480p.mp4`, `_couverture.jpg`, `.srt`. Annonce au fondateur ce qui est prêt, et ce qui reste (voix, photo, accord).

## Pièges
- Ne jamais déplacer le texte essentiel hors du cadre central 1080×1350.
- Un seul élément en couleur par scène.
- La fin (route, point braise, « Le legs, c'est ici. ») est obligatoire.
