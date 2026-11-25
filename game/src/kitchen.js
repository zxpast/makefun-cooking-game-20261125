// Kitchen layout: where every station sits on the 1280x720 floor, and the
// rules for walking up to one and using it. The counter runs along the
// bottom, the order board hangs at the top, and the chef walks the open
// floor between them — planning the route is half the game.

import { INGREDIENTS } from './recipes.js';

export const FLOOR = { x: 40, y: 218, w: 1200, h: 330 };

export const STATIONS = [
  { id: 'bin-rice',    kind: 'bin',   item: 'rice',    x: 70,  y: 560, w: 104, h: 96, label: 'Rice' },
  { id: 'bin-noodle',  kind: 'bin',   item: 'noodle',  x: 186, y: 560, w: 104, h: 96, label: 'Noodle' },
  { id: 'bin-egg',     kind: 'bin',   item: 'egg',     x: 302, y: 560, w: 104, h: 96, label: 'Egg' },
  { id: 'bin-chilli',  kind: 'bin',   item: 'chilli',  x: 418, y: 560, w: 104, h: 96, label: 'Chilli' },
  { id: 'bin-veg',     kind: 'bin',   item: 'veg',     x: 534, y: 560, w: 104, h: 96, label: 'Veg' },
  { id: 'bin-skewer',  kind: 'bin',   item: 'skewer',  x: 650, y: 560, w: 104, h: 96, label: 'Skewer' },
  { id: 'chop',        kind: 'chop',  x: 790, y: 560, w: 130, h: 96, label: 'CHOP' },
  { id: 'stove',       kind: 'stove', x: 932, y: 560, w: 130, h: 96, label: 'STOVE' },
  { id: 'grill',       kind: 'grill', x: 1074, y: 560, w: 130, h: 96, label: 'GRILL' },
  { id: 'plate',       kind: 'plate', x: 880, y: 300, w: 150, h: 110, label: 'PLATE' },
  { id: 'serve',       kind: 'serve', x: 1070, y: 300, w: 150, h: 110, label: 'SERVE' },
  { id: 'trash',       kind: 'trash', x: 70,  y: 300, w: 96,  h: 96, label: 'TRASH' },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) ?? null;
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function stationForPoint(px, py) {
  for (const s of STATIONS) {
    if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return s;
  }
  return null;
}

// The chef can use a station when standing close to its front edge.
export function nearStation(chef, station) {
  const c = stationCenter(station);
  const dx = Math.max(Math.abs(chef.x - c.x) - station.w / 2, 0);
  const dy = Math.max(Math.abs(chef.y - c.y) - station.h / 2, 0);
  return Math.hypot(dx, dy) < 78;
}

export function nearestUsableStation(chef) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    if (!nearStation(chef, s)) continue;
    const c = stationCenter(s);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function binIngredients() {
  return Object.values(INGREDIENTS);
}

export function clampToFloor(p) {
  return {
    x: Math.min(Math.max(p.x, FLOOR.x + 18), FLOOR.x + FLOOR.w - 18),
    y: Math.min(Math.max(p.y, FLOOR.y + 18), FLOOR.y + FLOOR.h - 18),
  };
}
