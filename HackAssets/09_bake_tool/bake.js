import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PROCS } from './procs.js';

const MODELS = await (await fetch('/bake/models.json')).json();
const PPU = 64, DPR = 2, WALL_H = 2.8, T = 0.22;
const cache = new Map();
const gltf = new GLTFLoader();

async function loadModel(key) {
  if (!cache.has(key)) cache.set(key, (async () => {
    const url = MODELS[key];
    if (!url) throw new Error('missing model ' + key);
    if (url.endsWith('.obj')) {
      const base = url.slice(0, url.lastIndexOf('/') + 1), name = url.slice(url.lastIndexOf('/') + 1, -4);
      const m = await new MTLLoader().setPath(base).loadAsync(name + '.mtl'); m.preload();
      return new OBJLoader().setMaterials(m).loadAsync(url);
    }
    return (await gltf.loadAsync(url)).scene;
  })());
  return (await cache.get(key)).clone(true);
}

export function parsePart(s) {
  const [model, ...flags] = s.trim().split(/\s+/);
  const p = { model, pos: 'base', dx: 0, dz: 0, y: null, r: 0 };
  for (const f of flags) {
    if (['base', 'on', 'top', 'L', 'R', 'F', 'B'].includes(f)) p.pos = f;
    else if (f[0] === '@') { const [x, z] = f.slice(1).split(',').map(Number); p.at = [x, z]; }
    else { const k = f[0], v = Number(f.slice(1)); ({ h: () => p.h = v, w: () => p.w = v, s: () => p.s = v, x: () => p.dx = v, z: () => p.dz = v, y: () => p.y = v, r: () => p.r = v })[k]?.(); }
  }
  return p;
}

async function makeObject(p, stage) {
  let obj;
  if (p.model.startsWith('P:')) {
    const [name, arg] = p.model.slice(2).split('#');
    const fixed = /^\d$/.test(arg || '') ? Number(arg) : null;
    obj = PROCS[name](fixed ?? stage, fixed ? undefined : arg);
  } else obj = await loadModel(p.model);
  obj.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; const ms = Array.isArray(m.material) ? m.material : [m.material]; ms.forEach(x => { if (!x) return; if ('roughness' in x) x.roughness = Math.max(0.55, x.roughness); if (!x.map || x.opacity < 1) { x.transparent = false; x.opacity = 1; x.alphaTest = 0; x.depthWrite = true; } }); } });
  const wrap = new THREE.Group(); wrap.add(obj);
  const b = new THREE.Box3().setFromObject(obj), sz = new THREE.Vector3(); b.getSize(sz);
  const k = p.h ? p.h / sz.y : p.w ? p.w / Math.max(sz.x, sz.z) : (p.s || 1);
  obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj), c = new THREE.Vector3(); b2.getCenter(c);
  obj.position.sub(new THREE.Vector3(c.x, b2.min.y, c.z));
  return wrap;
}

function extentAlong(obj, axis) {
  const b = new THREE.Box3().setFromObject(obj), pts = [];
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new THREE.Vector3(x, y, z).dot(axis));
  return [Math.min(...pts), Math.max(...pts)];
}

export function frameFor(slot, n) {
  const k = n / 8;
  const S = {
    r1: { x: 2.2, z: 0.55, r: 0 }, r2: { x: 5.7, z: 0.55, r: 0 }, l1: { x: 0.55, z: 2.4, r: 90 }, l2: { x: 0.55, z: 5.8, r: 90 },
    c: { x: 4.4, z: 4.6, r: 45 }, wr: { x: 3.9, z: 0.0, r: 0, wall: 1.6 }, wl: { x: 0.0, z: 3.8, r: 90, wall: 1.6 },
  }[slot];
  return { ...S, x: S.x > 1 ? S.x * k : S.x, z: S.z > 1 ? S.z * k : S.z };
}

export async function buildItem(parts, slot, n, stage) {
  const f = frameFor(slot, n), rot = f.r * Math.PI / 180;
  const fwd = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)), side = new THREE.Vector3(Math.cos(rot), 0, -Math.sin(rot));
  const root = new THREE.Group();
  const ps = parts.map(parsePart);
  const objs = await Promise.all(ps.map(p => makeObject(p, stage)));
  const base = objs[0], wall = f.wall !== undefined;
  base.rotation.y = rot + ps[0].r * Math.PI / 180;
  base.position.set(f.x, wall ? f.wall - 0 : 0, f.z);
  if (wall) { base.position.y = f.wall; base.position.addScaledVector(fwd, 0.03); }
  root.add(base); base.updateMatrixWorld(true);
  if (wall) {
    const b0 = new THREE.Box3().setFromObject(base), [q0, q1] = extentAlong(base, fwd);
    base.position.y -= (b0.max.y - b0.min.y) / 2;
    base.position.addScaledVector(fwd, (q1 - q0) / 2 - 0.03);
    base.updateMatrixWorld(true);
  }
  const bb = new THREE.Box3().setFromObject(base);
  const [s0, s1] = extentAlong(base, side), [f0, f1] = extentAlong(base, fwd);
  const center = new THREE.Vector3(f.x, 0, f.z);
  const ons = ps.map((p, i) => i && p.pos === 'on' ? i : -1).filter(i => i > 0);
  const tops = ps.map((p, i) => i && p.pos === 'top' ? i : -1).filter(i => i > 0);
  for (let i = 1; i < ps.length; i++) {
    const p = ps[i], o = objs[i];
    o.rotation.y = rot + p.r * Math.PI / 180; o.updateMatrixWorld(true);
    const [o0, o1] = extentAlong(o, side), [g0, g1] = extentAlong(o, fwd);
    const pos = center.clone(); let y = 0;
    const sc = center.dot(side), fc = center.dot(fwd);
    if (p.pos === 'on' || p.pos === 'top') {
      const grp = p.pos === 'on' ? ons : tops, j = grp.indexOf(i), span = (s1 - s0) * (p.pos === 'on' ? 0.66 : 0.5);
      const t = grp.length === 1 ? 0 : (j / (grp.length - 1) - 0.5);
      pos.addScaledVector(side, (s0 + s1) / 2 - sc + t * span);
      pos.addScaledVector(fwd, (f0 + f1) / 2 - fc);
      y = wall ? 0 : bb.max.y + (p.pos === 'top' ? 0.55 : 0);
      if (wall) { y = bb.min.y + (bb.max.y - bb.min.y) * (p.pos === 'top' ? 0.95 : 0.78) - (o1 - o0) * 0; pos.addScaledVector(fwd, f1 - (f0 + f1) / 2 + 0.01); }
    } else if (p.pos === 'L' || p.pos === 'R') {
      const sgn = p.pos === 'R' ? 1 : -1;
      pos.addScaledVector(side, sgn > 0 ? s1 - sc + (o1 - o0) / 2 + 0.04 : s0 - sc - (o1 - o0) / 2 - 0.04);
      if (wall) { y = bb.min.y + 0.1; pos.addScaledVector(fwd, f1 - (f0 + f1) / 2 + 0.01); }
    } else if (p.pos === 'F') pos.addScaledVector(fwd, f1 - fc + (g1 - g0) / 2 - 0.15);
    else if (p.pos === 'B') pos.addScaledVector(fwd, f0 - fc - (g1 - g0) / 2 + 0.05);
    pos.addScaledVector(side, p.dx); pos.addScaledVector(fwd, p.dz);
    o.position.set(pos.x, p.y !== null ? p.y : y, pos.z);
    if (wall && p.pos !== 'base') o.position.y = p.y !== null ? f.wall + p.y : y;
    root.add(o);
  }
  return root;
}

export async function buildAbsolute(partStr, n) {
  const p = parsePart(partStr), o = await makeObject(p, 1), k = n / 8;
  let [x, z] = p.at; if (x < 0.1) x = x / k; if (z < 0.1) z = z / k;
  o.rotation.y = p.r * Math.PI / 180;
  o.position.set(x * k, p.y ?? 0, z * k);
  return o;
}

export function setup(n, opts = {}) {
  const scene = new THREE.Scene();
  const corners = [];
  for (const x of [-T - 0.1, n + 0.1]) for (const y of [-0.3, WALL_H + 0.1]) for (const z of [-T - 0.1, n + 0.1]) corners.push(new THREE.Vector3(x, y, z));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  cam.position.set(n / 2 + 40, 40 * 0.8165 + 1, n / 2 + 40); cam.lookAt(n / 2, 1, n / 2); cam.updateMatrixWorld(true);
  const inv = cam.matrixWorldInverse;
  const ps = corners.map(c => c.clone().applyMatrix4(inv));
  const pad = 0.35;
  const L = Math.min(...ps.map(p => p.x)) - pad, R = Math.max(...ps.map(p => p.x)) + pad, B = Math.min(...ps.map(p => p.y)) - pad, Tp = Math.max(...ps.map(p => p.y)) + pad;
  Object.assign(cam, { left: L, right: R, top: Tp, bottom: B }); cam.updateProjectionMatrix();
  const W = Math.round((R - L) * PPU), H = Math.round((Tp - B) * PPU);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(DPR); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.innerHTML = ''; document.body.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0xb8a890, 2.0), new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.0);
  sun.position.set(n + 4, 14, n + 8); sun.target.position.set(n / 2, 0, n / 2);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -n, right: n, top: n, bottom: -n, near: 1, far: 60 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  return { scene, cam, renderer, W, H };
}

const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
function box(scene, w, h, d, c, x, y, z, round = 0.03) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, round), mat(c));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}

export function shell(scene, n, room) {
  box(scene, n + T, 0.3, n + T, room.slab, n / 2 - T / 2, -0.15, n / 2 - T / 2, 0.06);
  box(scene, n, 0.06, n, room.floor, n / 2, 0.03, n / 2, 0.01);
  const plank = new THREE.Color(room.floor).multiplyScalar(0.86).getStyle();
  for (let i = 1; i < n * 2; i++) box(scene, n, 0.004, 0.018, plank, n / 2, 0.061, i / 2, 0);
  box(scene, T, WALL_H, n + T, room.wallL, -T / 2, WALL_H / 2, n / 2 - T / 2, 0.03);
  box(scene, n, WALL_H, T, room.wallR, n / 2, WALL_H / 2, -T / 2, 0.03);
  box(scene, 0.04, 0.2, n, '#ffffff', 0.02, 0.1, n / 2, 0.01);
  box(scene, n, 0.2, 0.04, '#ffffff', n / 2, 0.1, 0.02, 0.01);
  box(scene, T + 0.02, 0.06, n + T, room.slab, -T / 2, WALL_H + 0.03, n / 2 - T / 2, 0.02);
  box(scene, n, 0.06, T + 0.02, room.slab, n / 2, WALL_H + 0.03, -T / 2, 0.02);
}

export function shadowCatchers(scene, n) {
  const m = new THREE.ShadowMaterial({ opacity: 0.22 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(n, n), m); floor.rotation.x = -Math.PI / 2; floor.position.set(n / 2, 0.061, n / 2); floor.receiveShadow = true;
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(n, WALL_H), m); wl.rotation.y = Math.PI / 2; wl.position.set(0.001, WALL_H / 2, n / 2); wl.receiveShadow = true;
  const wr = new THREE.Mesh(new THREE.PlaneGeometry(n, WALL_H), m); wr.position.set(n / 2, WALL_H / 2, 0.001); wr.receiveShadow = true;
  scene.add(floor, wl, wr);
}

export async function gallery(keys, cols = 6, cell = 220) {
  const rows = Math.ceil(keys.length / cols);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(cols * cell, rows * (cell + 24));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setScissorTest(true);
  document.body.innerHTML = ''; document.body.appendChild(renderer.domElement);
  for (let i = 0; i < keys.length; i++) {
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x999999, 2.2));
    const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(3, 5, 4); scene.add(d);
    let o; try { o = await makeObject(parsePart(keys[i] + ' h1'), 4); } catch (e) { continue; }
    scene.add(o);
    const b = new THREE.Box3().setFromObject(o), s = new THREE.Vector3(); b.getSize(s); const c = new THREE.Vector3(); b.getCenter(c);
    const r = Math.max(s.x, s.y, s.z) * 0.85;
    const cam = new THREE.OrthographicCamera(-r, r, r, -r, 0.1, 100); cam.position.set(c.x + 10, c.y + 8, c.z + 10); cam.lookAt(c);
    const x = (i % cols) * cell, y = (rows - 1 - Math.floor(i / cols)) * (cell + 24) + 24;
    renderer.setViewport(x, y, cell, cell); renderer.setScissor(x, y, cell, cell);
    renderer.render(scene, cam);
  }
}
