// ATLAS DE PAPIER — bibliothèque de dessin du Trait (LEGAC'I)
// Tout est dessiné à la main par le code : papier, déchirures, trame, encre, étiquettes Dymo, route, point braise.
// Règles : 24 i/s ; les découpages bougent à 12 i/s (une image sur deux) avec un frémissement.
const W = 1080, H = 1920;
const C = {
  papier: '#EFE7D6', ombre: '#D9CDB4', encre: '#141414', or: '#C8A44D', blanc: '#FBF8F0',
  braise1: '#FE3131', braise2: '#FF904D',
  noir: '#0B0B0B', ivoireLogo: '#F4F3EE',
  // Filets de famille (Livraison design 2, p.11) — quatre nuances du dégradé braise [À VALIDER]
  familles: { INFORMER: '#FE3131', RACONTER: '#FF5A3C', VIBRER: '#FF7545', VIVRE: '#FF904D' },
  rouge: '#C13439', jaune: '#EED234', bleu: '#246AB8', vert: '#29983B', grille: 'rgba(110,140,160,0.38)'
};
function rng(seed) { let a = (seed * 2654435761) >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const step12 = t => Math.floor(t * 12) / 12;          // temps « stop-motion » à 12 i/s
const boilSeed = t => Math.floor(t * 12);             // change toutes les deux images

// ---------- PAPIER ----------
function papier({ grille = true, seed = 7, teinte = C.papier } = {}) {
  const c = mk(W, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = teinte; x.fillRect(0, 0, W, H);
  // nuages de fibres
  for (let i = 0; i < 2600; i++) {
    const px = r() * W, py = r() * H, l = 6 + r() * 26, a = r() * Math.PI;
    x.strokeStyle = r() < .5 ? 'rgba(120,100,70,0.07)' : 'rgba(255,255,255,0.18)'; x.lineWidth = .6 + r();
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(70,55,35,${.04 + r() * .08})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  // taches douces
  for (let i = 0; i < 14; i++) { const g = x.createRadialGradient(r() * W, r() * H, 0, r() * W, r() * H, 200 + r() * 300); g.addColorStop(0, 'rgba(160,130,90,0.06)'); g.addColorStop(1, 'rgba(160,130,90,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  if (grille) { // cahier quadrillé d'écolier
    x.strokeStyle = C.grille; x.lineWidth = 1.4;
    for (let gx = 18; gx < W; gx += 54) { x.beginPath(); x.moveTo(gx + (r() - .5), 0); x.lineTo(gx + (r() - .5) * 2, H); x.stroke(); }
    for (let gy = 30; gy < H; gy += 54) { x.beginPath(); x.moveTo(0, gy + (r() - .5)); x.lineTo(W, gy + (r() - .5) * 2); x.stroke(); }
  }
  return c;
}
// ---------- GRAIN & VIGNETTE ----------
let _grains = null;
function grain(ctx, t, force = 0.11) {
  if (!_grains) { _grains = []; for (let k = 0; k < 6; k++) { const c = mk(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), r = rng(100 + k); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); _grains.push(c); } }
  ctx.save(); ctx.globalAlpha = force; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(_grains[boilSeed(t) % 6], 0, 0, W, H); ctx.restore();
}
function vignette(ctx, f = 0.45) { const g = ctx.createRadialGradient(W / 2, H * .48, H * .25, W / 2, H * .5, H * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,15,10,${f})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

// ---------- DÉCHIRURES ----------
function bordDechire(x0, y0, w, h, seed, amp = 5, pas = 9) {
  const r = rng(seed), p = [];
  for (let x = 0; x <= w; x += pas) p.push([x0 + x, y0 + (r() - .5) * amp * 2]);
  for (let y = 0; y <= h; y += pas) p.push([x0 + w + (r() - .5) * amp * 2, y0 + y]);
  for (let x = w; x >= 0; x -= pas) p.push([x0 + x, y0 + h + (r() - .5) * amp * 2]);
  for (let y = h; y >= 0; y -= pas) p.push([x0 + (r() - .5) * amp * 2, y0 + y]);
  return p;
}
function poly(ctx, p) { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); }
function papierDechire(ctx, x, y, w, h, { fond = C.blanc, seed = 1, ombre = true, ame = true, amp = 5 } = {}) {
  ctx.save();
  if (ombre) { ctx.shadowColor = 'rgba(30,20,10,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 7; }
  if (ame) { poly(ctx, bordDechire(x - 4, y - 4, w + 8, h + 8, seed + 99, amp + 1)); ctx.fillStyle = C.blanc; ctx.fill(); ctx.shadowColor = 'transparent'; }
  poly(ctx, bordDechire(x, y, w, h, seed, amp)); ctx.fillStyle = fond; ctx.fill();
  ctx.restore();
}
// ---------- TRAME (demi-teinte) ----------
const _trames = {};
function trame(ctx, couleurFond = '#9a9a9a', couleurPoint = '#2a2a2a', pas = 9, rayon = 2.6) {
  const k = couleurFond + couleurPoint + pas + rayon; if (_trames[k]) return _trames[k];
  const c = mk(pas, pas), x = c.getContext('2d'); x.fillStyle = couleurFond; x.fillRect(0, 0, pas, pas); x.fillStyle = couleurPoint; x.beginPath(); x.arc(pas / 2, pas / 2, rayon, 0, 7); x.fill();
  return (_trames[k] = ctx.createPattern(c, 'repeat'));
}
// ---------- ÉTIQUETTE DYMO ----------
function dymo(ctx, texte, cx, y, taille = 40, seed = 3) {
  ctx.save(); ctx.font = `700 ${taille}px LS`; ctx.letterSpacing = `${taille * .14}px`;
  const tw = ctx.measureText(texte).width, w = tw + taille * 1.3, h = taille * 1.55, x = cx - w / 2;
  const r = rng(seed); ctx.translate(cx, y + h / 2); ctx.rotate((r() - .5) * .04); ctx.translate(-cx, -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#121212'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x, y + 4, w, 3);
  ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,.9)'; ctx.fillText(texte, x + taille * .65 + 1.5, y + h / 2 + 2.5);
  ctx.fillStyle = '#EDEDED'; ctx.fillText(texte, x + taille * .65, y + h / 2 + 1);
  ctx.restore(); return { w, h };
}
// ---------- ENCRE ----------
function encreTrace(ctx, pts, prog, { ep = 7, couleur = C.encre, seed = 5 } = {}) {
  if (prog <= 0) return; const r = rng(seed); const n = Math.max(2, Math.floor(pts.length * clamp(prog)));
  ctx.save(); ctx.strokeStyle = couleur; ctx.lineWidth = ep; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); for (let i = 0; i < n; i++) { const [px, py] = pts[i]; const j = (r() - .5) * 1.6; i ? ctx.lineTo(px + j, py + j) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
}
function cercleEncre(cx, cy, rx, ry, tours = 1.15, seed = 9) { const r = rng(seed), p = []; for (let a = 0; a <= Math.PI * 2 * tours; a += .06) { const k = 1 + (r() - .5) * .05; p.push([cx + Math.cos(a - 1.2) * rx * k, cy + Math.sin(a - 1.2) * ry * k]); } return p; }
function flecheEncre(x1, y1, x2, y2) { const p = []; for (let i = 0; i <= 30; i++) { const u = i / 30; p.push([x1 + (x2 - x1) * u, y1 + (y2 - y1) * u - Math.sin(u * Math.PI) * 60]); } const a = Math.atan2(y2 - p[28][1], x2 - p[28][0]); p.push([x2 - Math.cos(a - .5) * 34, y2 - Math.sin(a - .5) * 34]); p.push([x2, y2]); p.push([x2 - Math.cos(a + .5) * 34, y2 - Math.sin(a + .5) * 34]); return p; }
function annotation(ctx, texte, x, y, taille = 54, rot = -.04) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `400 ${taille}px RB`; ctx.fillStyle = C.encre; ctx.fillText(texte, 0, 0); ctx.restore(); }
// ---------- TEXTES ----------
function bandeTitre(ctx, lignes, x, y, { taille = 120, fond = C.blanc, encre = C.encre, seed = 21, police = 'LS', poids = 900, rot = -.015 } = {}) {
  ctx.save(); ctx.font = `${poids} ${taille}px ${police}`; ctx.letterSpacing = `${-taille * .03}px`;
  const lh = taille * .92, w = Math.max(...lignes.map(l => ctx.measureText(l).width)) + taille * .5, h = lh * lignes.length + taille * .32;
  ctx.translate(x, y); ctx.rotate(rot); papierDechire(ctx, 0, 0, w, h, { fond, seed });
  ctx.fillStyle = encre; ctx.textBaseline = 'alphabetic'; lignes.forEach((l, i) => ctx.fillText(l, taille * .25, taille * .2 + lh * (i + 1) - taille * .1));
  ctx.restore(); return { w, h };
}
function sousTitre(ctx, texte, seed = 40) {
  ctx.save(); ctx.font = `700 46px LS`; const max = 900; const mots = texte.split(' '); const lignes = []; let l = '';
  mots.forEach(m => { const e = l ? l + ' ' + m : m; if (ctx.measureText(e).width > max) { lignes.push(l); l = m; } else l = e; }); lignes.push(l);
  const h = 62 * lignes.length + 34, w = Math.max(...lignes.map(q => ctx.measureText(q).width)) + 60, x = (W - w) / 2, y = 1500 - h;
  papierDechire(ctx, x, y, w, h, { fond: C.blanc, seed, amp: 4 }); ctx.fillStyle = C.encre; lignes.forEach((q, i) => ctx.fillText(q, x + 30, y + 64 + i * 62));
  ctx.restore();
}
function tampon(ctx, texte, x, y, rot = -.1) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `400 40px SE`; const w = ctx.measureText(texte).width + 56; ctx.strokeStyle = 'rgba(20,20,20,.85)'; ctx.lineWidth = 4; ctx.strokeRect(-28, -48, w, 70); ctx.fillStyle = 'rgba(20,20,20,.88)'; ctx.fillText(texte, 0, 0); ctx.restore(); }
// ---------- PERSONNAGE EN PAPIER ARTICULÉ (fictif) ----------
// pose: {bD, bG (angles bras), tete, saut}
function personnage(ctx, cx, sol, t, pose = {}, { echelle = 1, maillot = C.bleu, seed = 11 } = {}) {
  const b = rng(boilSeed(t) * 7 + seed), j = () => (b() - .5) * 3, ja = () => (b() - .5) * .025;
  const s = echelle, gris = trame(ctx, '#8f8f8f', '#262626', 9, 2.7), clair = trame(ctx, '#bdbdbd', '#4a4a4a', 9, 2.2);
  ctx.save(); ctx.translate(cx + j(), sol - (pose.saut || 0) + j()); ctx.scale(s, s);
  const membre = (px, py, l, ep, ang, fill) => { ctx.save(); ctx.translate(px, py); ctx.rotate(ang + ja()); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5; ctx.fillStyle = C.blanc; ctx.beginPath(); ctx.roundRect(-ep / 2 - 3, -3, ep + 6, l + 6, ep / 2); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-ep / 2, 0, ep, l, ep / 2); ctx.fill(); ctx.restore(); };
  membre(-28, -250, 250, 50, .05, gris); membre(28, -250, 250, 50, -.05, gris);            // jambes
  ctx.fillStyle = '#111'; ctx.fillRect(-62, -12, 64, 20); ctx.fillRect(6, -12, 64, 20);     // chaussures
  membre(-78, -470, 200, 40, pose.bG ?? .25, clair); membre(78, -470, 200, 40, pose.bD ?? -.25, clair); // bras
  ctx.save(); ctx.rotate(ja()); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 7;
  poly(ctx, bordDechire(-92, -490, 184, 260, seed + 3, 3, 8)); ctx.fillStyle = C.blanc; ctx.fill(); ctx.shadowColor = 'transparent';
  poly(ctx, bordDechire(-86, -484, 172, 248, seed + 4, 2.5, 8)); ctx.fillStyle = maillot; ctx.fill();
  ctx.globalAlpha = .22; ctx.fillStyle = trame(ctx, 'rgba(0,0,0,0)', '#000', 9, 2.2); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
  ctx.save(); ctx.translate(0, -560); ctx.rotate((pose.tete || 0) + ja()); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.blanc; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = gris; ctx.beginPath(); ctx.arc(0, 0, 64, 0, 7); ctx.fill();
  ctx.fillStyle = '#151515'; ctx.beginPath(); ctx.arc(0, -18, 62, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); ctx.restore();
  ctx.restore();
}
// ---------- MAIN EN PAPIER (photo de ta main à remplacer en production) ----------
function main(ctx, x, y, ang = -.5, s = 1, seed = 13) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const peau = trame(ctx, '#a8a8a8', '#3a3a3a', 8, 2.3);
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 10;
  const forme = () => { ctx.beginPath(); ctx.roundRect(-70, 0, 150, 420, 50); ctx.roundRect(-78, -150, 36, 170, 18); ctx.roundRect(-38, -185, 36, 200, 18); ctx.roundRect(2, -175, 36, 190, 18); ctx.roundRect(42, -140, 34, 160, 17); ctx.ellipse(-75, 60, 26, 95, -.6, 0, 7); };
  ctx.fillStyle = C.blanc; ctx.save(); ctx.scale(1.04, 1.03); forme(); ctx.fill(); ctx.restore(); ctx.shadowColor = 'transparent'; ctx.fillStyle = peau; forme(); ctx.fill();
  ctx.restore();
}
// ---------- ROUTE (le Trait) + POINT BRAISE ----------
function route(ctx, pts, prog, { large = 46 } = {}) {
  const n = Math.max(2, Math.floor(pts.length * clamp(prog))); const p = pts.slice(0, n);
  const trace = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6; trace(large + 16, '#f6f3ec'); ctx.shadowColor = 'transparent'; trace(large, '#232323');
  ctx.globalAlpha = .55; ctx.strokeStyle = trame(ctx, 'rgba(0,0,0,0)', '#5a5a5a', 7, 1.6); ctx.lineWidth = large; ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.restore(); return p[p.length - 1];
}
function courbe(points, n = 160) { // Catmull-Rom → liste de points
  const out = []; for (let i = 0; i < points.length - 1; i++) { const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)]; const k = Math.ceil(n / (points.length - 1)); for (let s = 0; s < k; s++) { const u = s / k, u2 = u * u, u3 = u2 * u; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]); } } out.push(points[points.length - 1]); return out;
}
function pointBraise(ctx, x, y, t, r = 34) {
  const pulse = (Math.sin(t * 5) + 1) / 2; ctx.save();
  ctx.strokeStyle = `rgba(254,49,49,${.5 - pulse * .4})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r + 14 + pulse * 26, 0, 7); ctx.stroke();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, C.braise1); g.addColorStop(1, C.braise2);
  ctx.shadowColor = 'rgba(254,49,49,.45)'; ctx.shadowBlur = 24; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}
// Logo LEGAC'I (Livraison design 2, p.1) : LEGA en lettres pleines, « c'i » tracé d'un seul trait, point braise.
// (x, y) = coin bas-gauche de LEGA ; taille = hauteur des capitales de LEGA ; couleur = encre ou ivoire sur fond noir.
function logo(ctx, x, y, taille = 64, { couleur = C.encre, point = C.braise1 } = {}) {
  const u = taille / 112; ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
  ctx.fillStyle = couleur; ctx.font = '900 160px LS'; ctx.letterSpacing = '-3px'; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText('LEGA').width; ctx.save(); ctx.scale(418 / w, 1); ctx.fillText('LEGA', 0, 0); ctx.restore();
  const P = (a) => a.map(([px, py]) => [px - 71, py - 411]);
  ctx.strokeStyle = couleur; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const trait = pts => { ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); };
  trait(courbe(P([[581, 335], [560, 270], [535, 228], [508, 260], [500, 330], [515, 410], [550, 455], [585, 455], [620, 410], [637, 325]]), 60));
  trait(P([[650, 228], [648, 250], [644, 272]]));
  trait(P([[678, 310], [679, 380], [680, 452]]));
  ctx.fillStyle = point; ctx.beginPath(); ctx.arc(679 - 71, 263 - 411, 10.5, 0, 7); ctx.fill();
  ctx.restore();
}
// Filet de famille : trait de papier découpé, en haut d'une vignette ou d'une carte (Livraison design 2, p.11).
function filetFamille(ctx, famille, x, y, w, h = 16, seed = 5) {
  const col = C.familles[famille] || C.braise1;
  ctx.save(); poly(ctx, bordDechire(x, y, w, h, seed, 1.6, 7)); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
// Ligne de légende en machine à écrire (équivalent atelier de la mono de la charte)
function legende(ctx, texte, x, y, taille = 30, couleur = C.encre) { ctx.save(); ctx.font = `400 ${taille}px SE`; ctx.letterSpacing = `${taille * .08}px`; ctx.fillStyle = couleur; ctx.fillText(texte, x, y); ctx.restore(); }
async function polices(base) {
  const f = [['LS', 'league-spartan-latin-700-normal', '700'], ['LS', 'league-spartan-latin-800-normal', '800'], ['LS', 'league-spartan-latin-900-normal', '900'], ['BS', 'big-shoulders-display-latin-900-normal', '900'], ['RB', 'reenie-beanie-latin-400-normal', '400'], ['SE', 'special-elite-latin-400-normal', '400']];
  for (const [fam, file, w] of f) { const ff = new FontFace(fam, `url(${base}/${file}.woff2)`, { weight: w }); await ff.load(); document.fonts.add(ff); }
}
