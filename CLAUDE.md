# Atelier du Trait — LEGAC'I

Ce dossier fabrique les vidéos du Trait, le média culturel de LEGAC'I (Abidjan). Le fondateur n'est pas développeur : réponds-lui en français simple, montre un aperçu avant chaque rendu long, et explique en une phrase ce que tu as fait.

## Règles qui ne bougent jamais
1. Aucun faux témoignage, aucune citation inventée. Un personnage fictif est écrit « personnage fictif » à l'écran.
2. Aucun texte factuel n'entre dans une scène s'il n'a pas passé le Vérificateur (porte 1). Si une scène contient [À VÉRIFIER], refuse de la rendre et dis pourquoi.
3. Images, sons, musiques : seulement `banque/` (LEGAC'I), domaine public, licence commerciale, ou accord écrit. Jamais d'image générée qui imite une vraie personne ou une archive.
4. Mineur : jamais nommé ni reconnaissable sans accord écrit d'un parent.
5. Le mot « chaîne » n'est jamais utilisé pour LEGAC'I.

## Direction artistique : l'Atlas de papier
- Papier ivoire #EFE7D6 toujours texturé ; kraft #D9CDB4 ; encre #141414 ; or #C8A44D.
- Braise #FE3131 → #FF904D : seulement la route et le point « vous êtes ici ».
- Un seul élément en couleur par scène : rouge #C13439 (La Question), bleu #246AB8 (Le Cas), vert #29983B (Ailleurs), jaune #EED234 (La Figure), or (Arrêt sur image), aucun (Face à face), le point braise (La Main).
- Polices (dans `atelier/fonts`) : League Spartan 700–900 (LS), Big Shoulders Display 900 (BS), Reenie Beanie (RB), Special Elite (SE).
- Signatures : main réelle qui entre dans la 1re seconde ; route aux bords blancs ; point braise + « Le legs, c'est ici. » (1,5 s) ; signature sonore de 2 s.
- Interdits : aplats lisses, dégradés numériques, verre dépoli, coins arrondis (sauf l'étiquette Dymo, objet réel), empattements, texte blanc sur braise.

## Réglages techniques
- 1080×1920, 24 i/s ; découpages animés à 12 i/s (`step12`, `boilSeed` dans `atlas.js`) avec frémissement ±2 px / ±1°.
- Zones sûres : rien d'essentiel dans les 250 px du haut, 380 px du bas, 120 px de droite. Tout l'essentiel tient dans 1080×1350 au centre.
- Son : 48 kHz ; voix vers −14 LUFS ; crêtes sous −1 dBTP ; musique ~18 dB sous la voix.
- Sorties : `_reseaux_1080x1920.mp4` (à publier), `_statut_480p.mp4` (< 5 Mo), `_couverture.jpg` (image 0), `.srt`.

## Les 8 formats (détails : onglet « Formats de montage » du document Salle de rédaction)
| Format | État | Gabarit |
|---|---|---|
| F1 Affiche vivante (4:5) | à construire | `gabarits/f1_affiche.html` |
| F2 Planche (4:5) | à construire | `gabarits/f2_planche.html` |
| F3 Collage qui bouge | **prêt** | `gabarits/f3_collage.html` |
| F4 Archive déchirée | à construire | `gabarits/f4_archive.html` |
| F5 Portrait parlant | à construire | `gabarits/f5_portrait.html` |
| F6 Écran-jeu | à construire | `gabarits/f6_ecran.html` |
| F7 Manifeste | à construire | `gabarits/f7_manifeste.html` |
| F8 Carte | fin incluse dans F3 ; format long à construire | `gabarits/f8_carte.html` |

Pour construire un gabarit : réutilise `atlas.js`, lis `window.SCENE` (JSON), expose `window.pret` (promesse) et `window.setT(t)`. Ordre conseillé : F6, F5, F2, F4, F1, F7, F8.

## Commandes
```
python3 atelier/apercu.py atelier/gabarits/f3_collage.html --scene atelier/scenes/003_yao_1.json --temps 0.5 5 10 15 22 27 --sortie apercu.jpg
python3 atelier/render.py atelier/gabarits/f3_collage.html --scene atelier/scenes/003_yao_1.json --sortie atelier/rendus/003 [--voix voix.wav] [--musique beat.wav] [--sons]
python3 atelier/controle.py atelier/rendus/003
```
Prérequis : python3, `pip install playwright` puis le navigateur Chromium de Playwright, ffmpeg.

## Agents de l'atelier
`.claude/agents/monteur.md`, `ingenieur-son.md`, `controleur-technique.md`. Procédure complète : `.claude/skills/monter-un-trait/SKILL.md`.
