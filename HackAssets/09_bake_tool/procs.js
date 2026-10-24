import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; return x; };
const rbox = (w, h, d, c, r = 0.02) => mesh(new RoundedBoxGeometry(w, h, d, 2, r), M(c));
const cyl = (rt, rb, h, c, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c));
const sph = (r, c) => mesh(new THREE.SphereGeometry(r, 32, 16), M(c));
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const group = (...xs) => { const g = new THREE.Group(); xs.forEach(x => g.add(x)); return g; };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function framed(w, h, frame, tex, depth = 0.05) {
  const f = rbox(w, h, depth, frame, 0.015);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.88), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  p.position.z = depth / 2 + 0.002; p.receiveShadow = true;
  return group(f, p);
}
const blob = (g, x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };

const posterArt = {
  atom: (g, w, h, s) => {
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    g.lineWidth = 10;
    ['#4fa3d9', '#e8642c', '#77c25b'].slice(0, Math.min(3, s)).forEach((c, i) => {
      g.strokeStyle = c; g.save(); g.translate(cx, cy); g.rotate(i * Math.PI / 3); g.beginPath(); g.ellipse(0, 0, w * 0.38, h * 0.13, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    });
    blob(g, cx, cy, 26, 26, '#e8642c');
    if (s >= 4) { g.fillStyle = '#2f5d84'; g.font = 'bold 48px sans-serif'; g.fillText('ATOM', 30, h - 30); }
  },
  periodic: (g, w, h, s) => {
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
    const cols = [6, 9, 12, 18][s - 1], cw = (w - 40) / cols, pal = ['#f6c744', '#77c25b', '#4fa3d9', '#e8642c', '#c58ad9'];
    for (let r = 0; r < 6; r++) for (let c = 0; c < cols; c++) {
      if (r === 0 && c > 0 && c < cols - 1) continue;
      if (r < 3 && c > 1 && c < cols - 6) continue;
      g.fillStyle = pal[(r + c) % 5]; g.fillRect(20 + c * cw, 40 + r * (cw + 4), cw - 4, cw - 2);
    }
  },
  map: (g, w, h, s) => {
    g.fillStyle = s > 1 ? '#bfe2f2' : '#f1e3bd'; g.fillRect(0, 0, w, h);
    const land = s > 1 ? '#8cc96b' : '#c9b48a';
    [[.25, .32, .16, .12], [.62, .28, .18, .14], [.68, .66, .1, .14], [.3, .7, .08, .14], [.88, .78, .06, .05]].forEach(([x, y, a, b]) => blob(g, w * x, h * y, w * a, h * b, land));
    if (s >= 3) [[.27, .33], [.6, .3], [.7, .64]].forEach(([x, y]) => blob(g, w * x, h * y, 12, 12, '#e8642c'));
    if (s >= 4) { g.strokeStyle = '#7fa7b8'; g.lineWidth = 3; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, h * i / 6); g.lineTo(w, h * i / 6); g.moveTo(w * i / 6, 0); g.lineTo(w * i / 6, h); g.stroke(); } }
  },
  words: (g, w, h, s) => {
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
    const pal = ['#e8642c', '#4fa3d9', '#77c25b', '#c58ad9', '#f6c744'];
    g.font = 'bold 54px sans-serif';
    ['as brave', 'as a lion', 'the moon', 'is a lamp', 'quiet as'].slice(0, s + 1).forEach((t, i) => { g.fillStyle = pal[i]; g.fillText(t, 30, 80 + i * 78); });
  },
  graph: (g, w, h, s) => {
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
    const n = [3, 4, 6, 8][s - 1], bw = (w - 80) / n, pal = ['#4fa3d9', '#77c25b', '#f6c744', '#e8642c'];
    for (let i = 0; i < n; i++) { const bh = (h - 120) * (0.3 + 0.7 * ((i * 53 + 17) % 10) / 10); g.fillStyle = pal[i % 4]; g.fillRect(50 + i * bw + 6, h - 50 - bh, bw - 12, bh); }
    g.strokeStyle = '#4a2828'; g.lineWidth = 6; g.beginPath(); g.moveTo(44, 30); g.lineTo(44, h - 44); g.lineTo(w - 20, h - 44); g.stroke();
  },
};

export const PROCS = {
  window: () => framed(1.1, 1.25, '#9cbf5a', canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fdcf0'); gr.addColorStop(1, '#e0f6fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9cbf5a'; g.fillRect(w / 2 - 6, 0, 12, h); g.fillRect(0, h / 2 - 6, w, 12);
  }), 0.08),
  note: (s, arg) => { const c = { y: '#f6e27a', b: '#9fd0f0', p: '#f3a6c6', g: '#a8dc8c' }[arg || 'y']; return rbox(0.22, 0.22, 0.01, c, 0.004); },
  poster: (s, kind = 'atom') => {
    const [w, h] = [[0.6, 0.75], [0.75, 0.95], [0.9, 1.1], [1.05, 1.25]][s - 1];
    const frame = ['#f5f0e6', '#a0703c', '#8b5a2b', '#d9a92e'][s - 1];
    return framed(w, h, frame, canvasTex(512, 640, (g, W, H) => posterArt[kind](g, W, H, s)));
  },
  chalkboard: s => {
    const [w, h] = [[0.8, 0.55], [1.15, 0.75], [1.5, 0.9], [1.75, 1.0]][s - 1];
    const lines = [['2 + 3 = 5'], ['7 × 8 = 56', '½ + ¼'], ['7 × 8 = 56', 'A = l × w', '¾ > ½'], ['y = 2x + 1', '45°', 'π ≈ 3.14']][s - 1];
    const board = s === 4 ? '#1f3f6b' : '#2f5d46';
    const b = framed(w, h, s === 4 ? '#3a3f45' : '#a0703c', canvasTex(1024, 640, (g, W, H) => {
      g.fillStyle = board; g.fillRect(0, 0, W, H); g.fillStyle = s === 4 ? '#bfe7ff' : '#eef3e6'; g.font = '86px sans-serif';
      lines.forEach((t, i) => g.fillText(t, 50, 130 + i * 150));
      if (s === 4) { g.strokeStyle = '#bfe7ff'; g.lineWidth = 8; g.beginPath(); g.arc(W - 170, 200, 90, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(W - 300, H - 60); g.lineTo(W - 170, H - 260); g.lineTo(W - 40, H - 60); g.closePath(); g.stroke(); }
    }));
    if (s >= 3) b.add(at(rbox(w * 0.9, 0.04, 0.08, '#c8a26a', 0.01), 0, -h / 2 + 0.02, 0.05));
    return b;
  },
  clock: s => {
    const r = [0.22, 0.28, 0.32, 0.36][s - 1], rim = ['#8b5a2b', '#4fa3d9', '#8b5a2b', '#d9a92e'][s - 1];
    const face = cyl(r, r, 0.06, rim, 40); face.rotation.x = Math.PI / 2;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 40), M('#fffdf5'));
    dial.position.z = 0.032;
    const hand1 = at(rbox(0.02, r * 0.6, 0.01, '#4a2828', 0.004), 0, r * 0.28, 0.04);
    const hand2 = at(rbox(r * 0.45, 0.02, 0.01, '#4a2828', 0.004), r * 0.2, 0, 0.04);
    const g = group(face, dial, hand1, hand2);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.add(at(rbox(0.025, 0.025, 0.01, '#4a2828', 0.004), Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, 0.035)); }
    if (s >= 3) { g.add(at(rbox(0.16, 0.5, 0.06, rim, 0.02), 0, -r - 0.25, 0)); g.add(at(sph(0.06, '#f6c744'), 0, -r - 0.45, 0.05)); }
    return g;
  },
  timeline: s => {
    const n = [2, 4, 6, 7][s - 1], w = 0.42 * n + 0.2, g = group(at(rbox(w, 0.05, 0.05, '#8b5a2b'), 0, 0.3, 0));
    const pal = ['#f1e3bd', '#e6c8a0', '#d9e8c8', '#cfe0f7'];
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.2 + i * 0.42 + 0.11;
      g.add(at(rbox(0.32, 0.42, 0.02, pal[i % 4], 0.01), x, 0, 0.02));
      g.add(at(rbox(0.22, 0.08, 0.01, '#b9875a', 0.004), x, 0.08, 0.035));
      if (s === 4) g.add(at(sph(0.035, '#f6c744'), x, 0.3, 0.04));
    }
    return g;
  },
  microscope: () => group(at(rbox(0.22, 0.04, 0.18, '#3a3f45'), 0, 0.02, 0), at(rbox(0.05, 0.3, 0.05, '#3a3f45'), 0, 0.17, -0.06),
    at(rbox(0.16, 0.02, 0.12, '#9aa4ad'), 0, 0.12, 0.01), (() => { const t = cyl(0.03, 0.035, 0.22, '#e8eef2'); t.rotation.x = 0.35; t.position.set(0, 0.3, 0); return t; })()),
  calculator: () => group(at(rbox(0.16, 0.025, 0.22, '#3a3f45', 0.01), 0, 0.012, 0), at(rbox(0.12, 0.005, 0.06, '#bfe7c8', 0.003), 0, 0.027, -0.06)),
  globe: s => {
    const r = [0.16, 0.2, 0.26, 0.3][s - 1], stand = ['#8b5a2b', '#8b5a2b', '#b07a3a', '#d9a92e'][s - 1];
    const tex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#4fa3d9'; g.fillRect(0, 0, w, h);
      [[.2, .35, .1, .12], [.25, .65, .05, .15], [.5, .3, .07, .1], [.55, .6, .06, .14], [.72, .35, .12, .12], [.85, .7, .05, .06]].forEach(([x, y, a, b]) => blob(g, w * x, h * y, w * a, h * b, '#77c25b')); });
    const ball = mesh(new THREE.SphereGeometry(r, 40, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    ball.position.y = r + 0.18; ball.rotation.z = 0.4;
    const g = group(at(cyl(0.12 + r * 0.3, 0.14 + r * 0.3, 0.04, stand), 0, 0.02, 0), at(cyl(0.02, 0.02, 0.18, stand), 0, 0.11, 0), ball);
    if (s >= 2) { const m = mesh(new THREE.TorusGeometry(r + 0.04, 0.012, 8, 48, Math.PI * 1.2), M(stand)); m.position.y = r + 0.18; m.rotation.z = 0.4 - Math.PI * 0.1; g.add(m); }
    if (s >= 4) { const ring = mesh(new THREE.TorusGeometry(r + 0.08, 0.012, 8, 64), M('#f2c94c', { metalness: 0.4 })); ring.position.y = r + 0.18; ring.rotation.x = Math.PI / 2.4; g.add(ring); }
    return g;
  },
  telescope: s => {
    const len = [0.5, 0.65, 0.8, 0.95][s - 1], body = ['#9aa4ad', '#d9b44a', '#c98a3a', '#e6c04f'][s - 1];
    const g = group();
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, l = cyl(0.015, 0.015, 0.7, '#6b4a2b', 8); l.position.set(Math.cos(a) * 0.14, 0.33, Math.sin(a) * 0.14); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(l); }
    const t = cyl(0.045 + s * 0.008, 0.035 + s * 0.006, len, body, 20); t.rotation.z = Math.PI / 2 - 0.5; t.position.set(0.05, 0.75, 0); g.add(t);
    if (s >= 3) { const lens = cyl(0.06 + s * 0.008, 0.06 + s * 0.008, 0.03, '#bfe7f2'); lens.rotation.z = Math.PI / 2 - 0.5; lens.position.set(0.05 + Math.cos(0.5 - Math.PI / 2 + Math.PI) * 0, 0.75, 0); }
    if (s === 4) g.add(at(rbox(0.1, 0.06, 0.06, '#7a5a1a'), 0.0, 0.66, 0));
    return g;
  },
  weather: s => {
    const hgt = [0.9, 1.1, 1.25, 1.4][s - 1], g = group(at(cyl(0.02, 0.025, hgt, '#8a8f96', 10), 0, hgt / 2, 0), at(cyl(0.12, 0.14, 0.04, '#6b6f75'), 0, 0.02, 0));
    const vane = at(rbox(0.22, 0.08, 0.01, '#e8642c'), 0.08, hgt, 0); g.add(vane);
    if (s >= 2) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; g.add(at(rbox(0.16, 0.012, 0.012, '#4a2828'), Math.cos(a) * 0.08, hgt - 0.15, Math.sin(a) * 0.08)); g.add(at(sph(0.035, '#f2f2f2'), Math.cos(a) * 0.16, hgt - 0.15, Math.sin(a) * 0.16)); }
    if (s >= 3) g.add(at(rbox(0.24, 0.2, 0.14, '#f5f0e6'), 0, hgt * 0.5, 0.06));
    if (s === 4) g.add(at(rbox(0.3, 0.02, 0.2, '#2f5d84'), 0, hgt * 0.75, 0));
    return g;
  },
  solar: s => {
    const n = [3, 5, 6, 8][s - 1], g = group(at(cyl(0.12, 0.14, 0.04, '#8b5a2b'), 0, 0.02, 0), at(cyl(0.012, 0.012, 0.35, '#6b6f75', 8), 0, 0.2, 0), at(sph(0.08, '#f6c744'), 0, 0.4, 0));
    const cols = ['#c9c4b8', '#e8a75b', '#4fa3d9', '#d9643a', '#e3c27a', '#e8d39a', '#9fd3e0', '#4f6fd9'];
    for (let i = 0; i < n; i++) {
      const rr = 0.13 + i * 0.045, a = 0.6 + i * 1.3;
      const ring = mesh(new THREE.TorusGeometry(rr, 0.003, 4, 64), M('#bcb3a2')); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; g.add(ring);
      g.add(at(sph(0.015 + (i === 4 ? 0.02 : i === 5 ? 0.015 : 0.008), cols[i]), Math.cos(a) * rr, 0.4, Math.sin(a) * rr));
    }
    return g;
  },
};
