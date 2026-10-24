import { open } from './drive.mjs';
import fs from 'fs';
const C = JSON.parse(fs.readFileSync('catalog.json'));
const GEO = { 1: [1, 0], 2: [1, 1], 3: [1, 2], 4: [2, 2], 5: [2, 3], 7: [3, 3], 10: [4, 3] };
const parts = (item, lv) => { const [s, a] = GEO[lv]; return { parts: [...item.stages[s - 1], ...item.addons.slice(0, a)], slot: item.slot, stage: s }; };
const [, , filter = '', onlyRoom = ''] = process.argv;
const t0 = Date.now(), budget = 520e3, OUT = 'out/';
const d = await open();
const jobs = [];
for (const t of Object.keys(C.rooms)) for (const k of C.order) {
  if (filter && !`${t}/${k}`.startsWith(filter)) continue;
  const room = { ...C.rooms[t][k], slab: C.tiers[t].slab }, n = C.tiers[t].n, dir = `${OUT}t${t}/${k}`;
  fs.mkdirSync(dir, { recursive: true });
  jobs.push([`${dir}/room_L10.png`, { mode: 'room', n, room, items: room.items.map(i => parts(i, 10)) }]);
  if (onlyRoom) continue;
  jobs.push([`${dir}/room_L1.png`, { mode: 'room', n, room, items: room.items.map(i => parts(i, 1)) }]);
  jobs.push([`${dir}/shell.png`, { mode: 'shell', n, room, items: [] }]);
  for (const i of room.items) for (const lv of Object.keys(GEO)) jobs.push([`${dir}/${i.id}_g${String(lv).padStart(2, '0')}.png`, { mode: 'item', n, room, items: [parts(i, Number(lv))] }]);
}
let done = 0, left = 0;
for (const [path, job] of jobs) {
  if (fs.existsSync(path)) continue;
  if (Date.now() - t0 > budget) { left++; continue; }
  const info = await d.shoot(job, path); done++;
  if (done === 1) fs.writeFileSync(OUT + 'canvas.json', JSON.stringify(info));
}
console.log('rendered', done, 'left', left, 'secs', ((Date.now() - t0) / 1000) | 0);
await d.close();
