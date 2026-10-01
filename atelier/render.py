#!/usr/bin/env python3
"""Atelier du Trait — rendu image par image d'un gabarit HTML en vidéo.

Usage :
  python3 atelier/render.py atelier/gabarits/f3_collage.html --scene atelier/scenes/003_yao_1.json \
      --sortie atelier/rendus/003 --duree 28 [--voix voix.wav] [--musique beat.wav] [--sons]

Produit dans le dossier de sortie :
  <id>_master_1080x1920.mp4   (24 i/s, H.264, AAC 48 kHz — fichier d'archive)
  <id>_reseaux_1080x1920.mp4  (celui qu'on publie : ~4 à 10 Mb/s)
  <id>_statut_480p.mp4        (copie légère pour le Statut WhatsApp, visée < 5 Mo)
  <id>_couverture.jpg         (image 0 = première image vue sans le son)
  <id>.srt                    (sous-titres, si la scène contient des temps avec « sous »)
Prérequis : python3, playwright (Chromium), ffmpeg.
"""
import argparse, json, os, subprocess, sys, shutil

FPS = 24

def chromium(p):
    exe = '/opt/pw-browsers/chromium'
    kw = {'args': ['--allow-file-access-from-files']}
    if os.path.isfile(exe):
        kw['executable_path'] = exe
    return p.chromium.launch(**kw)

def srt(scene, chemin):
    blocs = []
    if scene.get('ouverture'):
        blocs.append((0, scene['temps'][0]['debut'], scene['ouverture']))
    for t in scene.get('temps', []):
        if t.get('sous'):
            blocs.append((t['debut'], t['fin'], t['sous']))
    if scene.get('fin', {}).get('appel'):
        blocs.append((scene['fin']['debut'] + 2.9, scene['duree'], scene['fin']['appel']))
    f = lambda s: '%02d:%02d:%02d,%03d' % (s // 3600, s % 3600 // 60, int(s % 60), int(round((s - int(s)) * 1000)))
    with open(chemin, 'w', encoding='utf-8') as o:
        for i, (a, b, txt) in enumerate(blocs, 1):
            o.write(f"{i}\n{f(a)} --> {f(b)}\n{txt}\n\n")

def sons(scene, chemin, duree):
    """Bruitages provisoires (papier, coup de fin) en attendant les vrais sons de la banque."""
    coupes = [t['debut'] for t in scene.get('temps', [])] + ([scene['fin']['debut']] if scene.get('fin') else [])
    filtres, entrees = [], []
    for i, c in enumerate(coupes):
        entrees += ['-f', 'lavfi', '-t', '0.28', '-i', 'anoisesrc=color=pink:amplitude=0.35']
        filtres.append(f"[{i}]highpass=f=900,lowpass=f=6000,afade=t=out:st=0.05:d=0.23,adelay={int(c*1000)}|{int(c*1000)}[s{i}]")
    n = len(coupes)
    fin = scene['fin']['debut'] + 2.2 if scene.get('fin') else duree - 2
    entrees += ['-f', 'lavfi', '-t', '0.6', '-i', 'sine=frequency=55:sample_rate=48000']
    filtres.append(f"[{n}]volume=2.2,afade=t=out:st=0.05:d=0.5,adelay={int(fin*1000)}|{int(fin*1000)}[k]")
    mix = ''.join(f'[s{i}]' for i in range(n)) + '[k]'
    filtres.append(f"{mix}amix=inputs={n+1}:normalize=0,apad=whole_dur={duree}[out]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *entrees, '-filter_complex', ';'.join(filtres),
                    '-map', '[out]', '-ar', '48000', '-ac', '2', '-t', str(duree), chemin], check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('gabarit'); ap.add_argument('--scene'); ap.add_argument('--sortie', required=True)
    ap.add_argument('--duree', type=float); ap.add_argument('--voix'); ap.add_argument('--musique')
    ap.add_argument('--sons', action='store_true')
    a = ap.parse_args()
    scene = json.load(open(a.scene, encoding='utf-8')) if a.scene else None
    duree = a.duree or (scene or {}).get('duree', 20)
    ident = (scene or {}).get('id', 'trait')
    os.makedirs(a.sortie, exist_ok=True)
    muet = os.path.join(a.sortie, f'{ident}_muet.mp4')
    from playwright.sync_api import sync_playwright
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', muet], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = chromium(p); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        if scene:
            pg.add_init_script('window.SCENE = ' + json.dumps(scene, ensure_ascii=False) + ';')
        pg.goto('file://' + os.path.abspath(a.gabarit)); pg.evaluate('window.pret')
        total = int(round(duree * FPS))
        for f in range(total):
            pg.evaluate(f'setT({f / FPS})')
            img = pg.locator('canvas').screenshot(type='jpeg', quality=92)
            ff.stdin.write(img)
            if f == 0:
                open(os.path.join(a.sortie, f'{ident}_couverture.jpg'), 'wb').write(img)
            if f % 48 == 0:
                print(f'  image {f}/{total}', flush=True)
        b.close()
    ff.stdin.close(); ff.wait()
    pistes = []
    if a.sons and scene:
        s = os.path.join(a.sortie, f'{ident}_sons.wav'); sons(scene, s, duree); pistes.append((s, 0.9))
    if a.voix: pistes.append((a.voix, 1.0))
    if a.musique: pistes.append((a.musique, 0.125))  # environ -18 dB sous la voix
    master = os.path.join(a.sortie, f'{ident}_master_1080x1920.mp4')
    if pistes:
        ent = sum([['-i', x] for x, _ in pistes], [])
        f = ''.join(f'[{i+1}:a]volume={v}[a{i}];' for i, (_, v) in enumerate(pistes))
        base = f + ''.join(f'[a{i}]' for i in range(len(pistes))) + f'amix=inputs={len(pistes)}:normalize=0'
        for filtre in (base + ',loudnorm=I=-14:TP=-1:LRA=11,aresample=48000[aout]', base + '[aout]'):
            r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', muet, *ent, '-filter_complex', filtre, '-map', '0:v', '-map', '[aout]',
                                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', master])
            if r.returncode == 0:
                break
            print('  réglage du niveau impossible (piste silencieuse ?) : mixage sans normalisation')
        else:
            raise SystemExit('Échec du mixage son')
    else:
        shutil.copy(muet, master)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-c:v', 'libx264', '-crf', '23', '-maxrate', '10M', '-bufsize', '20M',
                    '-preset', 'slow', '-c:a', 'copy', '-movflags', '+faststart', os.path.join(a.sortie, f'{ident}_reseaux_1080x1920.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master, '-vf', 'scale=480:-2', '-c:v', 'libx264', '-crf', '30',
                    '-preset', 'slow', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', os.path.join(a.sortie, f'{ident}_statut_480p.mp4')], check=True)
    if scene: srt(scene, os.path.join(a.sortie, f'{ident}.srt'))
    os.remove(muet)
    print('OK', master)

if __name__ == '__main__':
    main()
