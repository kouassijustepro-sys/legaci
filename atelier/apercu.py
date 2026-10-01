#!/usr/bin/env python3
"""Aperçu rapide : quelques images d'un gabarit à des temps donnés, en planche.
python3 atelier/apercu.py atelier/gabarits/f3_collage.html --scene atelier/scenes/003_yao_1.json --temps 0.5 2 5 10 16 22 25 27.5 --sortie apercu.jpg"""
import argparse, json, os, subprocess, tempfile
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument('gabarit'); ap.add_argument('--scene'); ap.add_argument('--temps', nargs='+', type=float); ap.add_argument('--sortie', default='apercu.jpg')
a = ap.parse_args(); d = tempfile.mkdtemp()
with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium'
    b = p.chromium.launch(executable_path=exe if os.path.isfile(exe) else None, args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    if a.scene: pg.add_init_script('window.SCENE=' + json.dumps(json.load(open(a.scene, encoding='utf-8')), ensure_ascii=False) + ';')
    pg.on('console', lambda m: print('console:', m.text))
    pg.on('pageerror', lambda e: print('ERREUR:', e))
    pg.goto('file://' + os.path.abspath(a.gabarit)); pg.evaluate('window.pret')
    for i, t in enumerate(a.temps):
        pg.evaluate(f'setT({t})'); pg.locator('canvas').screenshot(path=f'{d}/{i:02d}.jpg', type='jpeg', quality=85)
    b.close()
n = len(a.temps)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '1', '-i', f'{d}/%02d.jpg', '-vf', f'scale=270:-2,tile={n}x1:padding=4', '-frames:v', '1', a.sortie], check=True)
print('OK', a.sortie)
