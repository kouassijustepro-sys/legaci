#!/usr/bin/env python3
"""Contrôle technique d'un rendu du Trait. Rend FEU VERT ou BLOQUÉ avec la liste des écarts.
python3 atelier/controle.py atelier/rendus/003"""
import json, os, subprocess, sys, glob, re
d = sys.argv[1]; ecarts = []; notes = []
def probe(f):
    o = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate',
                        '-of', 'json', f], capture_output=True, text=True).stdout
    return json.loads(o)
def lufs(f):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', e); pk = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)
    return (float(i[-1]) if i else None, float(pk[-1]) if pk else None)
pub = glob.glob(os.path.join(d, '*_reseaux_1080x1920.mp4')); sta = glob.glob(os.path.join(d, '*_statut_480p.mp4'))
if not pub: ecarts.append('Fichier _reseaux_1080x1920.mp4 absent')
for f in pub:
    p = probe(f); v = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in p['streams'] if s['codec_type'] == 'audio']
    dur = float(p['format']['duration'])
    if (v['width'], v['height']) != (1080, 1920): ecarts.append(f"Résolution {v['width']}x{v['height']} (attendu 1080x1920)")
    if v['r_frame_rate'] not in ('24/1',): ecarts.append(f"Cadence {v['r_frame_rate']} (attendu 24/1)")
    if v['codec_name'] != 'h264': ecarts.append('Codec vidéo non H.264')
    if not (12 <= dur <= 62): ecarts.append(f'Durée {dur:.1f} s hors de 12–62 s')
    if not a: ecarts.append('Aucune piste audio (ajouter au moins la signature sonore)')
    else:
        i, pk = lufs(f); notes.append(f'Son : {i} LUFS, crête {pk} dBFS')
        if i is not None and not (-16.5 <= i <= -12.5): ecarts.append(f'Niveau sonore {i} LUFS (viser -14 avec la voix)')
        if pk is not None and pk > -1: ecarts.append(f'Crête {pk} dBFS au-dessus de -1')
    notes.append(f"Poids réseaux : {int(p['format']['size'])/1e6:.1f} Mo, {dur:.1f} s")
for f in sta:
    taille = os.path.getsize(f) / 1e6; notes.append(f'Poids Statut : {taille:.2f} Mo')
    if taille > 5: ecarts.append(f'Copie Statut {taille:.1f} Mo > 5 Mo')
if not glob.glob(os.path.join(d, '*.srt')): ecarts.append('Fichier .srt absent')
if not glob.glob(os.path.join(d, '*_couverture.jpg')): ecarts.append('Couverture (image 0) absente')
print('\n'.join(notes)); print('BLOQUÉ' if ecarts else 'FEU VERT TECHNIQUE'); [print(' -', e) for e in ecarts]
print('À contrôler à l\'œil : première image lisible sans le son, zones sûres (haut 250 px, bas 380 px, droite 120 px), un seul élément en couleur par scène, fin sur le point braise.')
