// All drawing for Sizzle & Serve: the warm warung kitchen, the order board
// with its tickets, the pantry bins, the chop board, stove and grill, the
// plate mid-assembly, the serving window, the chef, and the HUD with its
// timer, score, combo and hearts. Everything is drawn in code — no images.

import { INGREDIENTS, ingredientEmoji, ingredientColor, ingredientLabel } from './recipes.js';
import { STATIONS, stationCenter } from './kitchen.js';
import { plateReady } from './orders.js';

const W = 1280;
const H = 720;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawIngredientIcon(ctx, itemId, x, y, size) {
  const rawId = itemId.startsWith('cooked-') ? itemId.slice(7) : itemId;
  const ing = INGREDIENTS[rawId];
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = ing ? ing.color : '#ddd';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ing ? ing.dark : '#999';
  ctx.stroke();
  ctx.font = `${size * 0.62}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing ? ing.emoji : '🍽️', x, y + 1);
  if (itemId.startsWith('cooked-')) {
    ctx.fillStyle = '#2e7d32';
    ctx.font = `bold ${size * 0.3}px Verdana, sans-serif`;
    ctx.fillText('✓', x + size * 0.34, y - size * 0.3);
  }
  ctx.restore();
}

export function drawKitchen(ctx, state, chef) {
  // Wall and floor.
  ctx.fillStyle = '#f7e8c8';
  ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#e8b64c';
  ctx.fillRect(0, 200, W, 14);
  ctx.fillStyle = '#b5762e';
  for (let x = 0; x < W; x += 160) {
    ctx.fillRect(x + 8, 60, 144, 130);
    ctx.fillStyle = '#a86a28';
    ctx.fillRect(x + 8, 60, 144, 10);
    ctx.fillStyle = '#b5762e';
  }
  // Hanging lamps and a menu poster for warmth.
  for (const lx of [180, 640, 1100]) {
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 34); ctx.stroke();
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath(); ctx.arc(lx, 48, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(lx, 48, 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 1150, 30, 100, 130, 8); ctx.fill();
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'MENU', 1200, 52, 15, '#c0392b');
  text(ctx, '🍚🍜🍢', 1200, 82, 20, '#333');
  text(ctx, 'WARUNG', 1200, 112, 13, '#7a5230');
  text(ctx, 'SIZZLE', 1200, 134, 13, '#7a5230');

  // Floor tiles.
  ctx.fillStyle = '#e9d3a7';
  ctx.fillRect(0, 214, W, 340);
  ctx.strokeStyle = '#d9bf8a';
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 214); ctx.lineTo(x, 554); ctx.stroke(); }
  for (let y = 214; y <= 554; y += 68) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Bottom counter band.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 554, W, 166);
  ctx.fillStyle = '#a9713a';
  ctx.fillRect(0, 554, W, 12);
}

export function drawOrderBoard(ctx, state) {
  roundRect(ctx, 24, 8, 760, 148, 12);
  ctx.fillStyle = '#3d2b1f';
  ctx.fill();
  ctx.fillStyle = '#ffcf5c';
  roundRect(ctx, 24, 8, 760, 34, 12);
  ctx.fill();
  text(ctx, '📋  ORDER BOARD', 44, 26, 20, '#3d2b1f', 'left');
  text(ctx, state.rush ? '🔥 RUSH HOUR 🔥' : `LEVEL ${state.level}`, 764, 26, 18, state.rush ? '#c0392b' : '#3d2b1f', 'right');

  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 404, 100, 18, '#f3e2c2');
    return;
  }
  state.orders.forEach((order, i) => {
    const x = 40 + i * 246;
    const y = 50;
    const w = 232;
    const h = 96;
    const urgent = order.patience < order.patienceMax * 0.35;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = urgent ? '#fff0e0' : '#fff8e6';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = urgent ? '#e8442e' : '#d9bf8a';
    ctx.stroke();
    text(ctx, `#${i + 1}  ${order.name}`, x + 12, y + 18, 16, '#3d2b1f', 'left');
    order.needs.forEach((need, j) => {
      drawIngredientIcon(ctx, need, x + 30 + j * 56, y + 52, 38);
    });
    // Patience bar.
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#e0d0b0';
    roundRect(ctx, x + 12, y + 80, w - 24, 9, 4); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7dc242' : frac > 0.25 ? '#f7c948' : '#e8442e';
    if (frac > 0) { roundRect(ctx, x + 12, y + 80, (w - 24) * frac, 9, 4); ctx.fill(); }
    if (urgent) text(ctx, 'HURRY!', x + w - 14, y + 52, 13, '#e8442e', 'right');
  });
}

export function drawHud(ctx, state) {
  // Top-right HUD panel: timer, score, coins, combo, hearts.
  roundRect(ctx, 800, 8, 456, 148, 12);
  ctx.fillStyle = 'rgba(61, 43, 31, 0.92)';
  ctx.fill();
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  const lowTime = state.timeLeft < 30;
  text(ctx, `⏱ ${mm}:${ss}`, 824, 40, 30, lowTime ? '#ff6b5e' : '#ffcf5c', 'left');
  text(ctx, `SCORE ${state.score}`, 824, 76, 18, '#f3e2c2', 'left');
  text(ctx, `🪙 ${state.coins}`, 1050, 76, 18, '#f3e2c2', 'left');
  text(ctx, state.combo > 1 ? `🔥 COMBO x${state.combo}` : 'Combo —', 824, 108, 18, state.combo > 1 ? '#ff9f43' : '#cbbf9a', 'left');
  const hearts = '❤️'.repeat(Math.max(0, state.hearts)) + '🤍'.repeat(Math.max(0, 3 - state.hearts));
  text(ctx, hearts, 1050, 108, 18, '#fff', 'left');
  text(ctx, `Served: ${state.served}   Lost: ${state.lost}`, 824, 136, 14, '#cbbf9a', 'left');
  // Shift timer bar.
  ctx.fillStyle = '#2b1d12';
  roundRect(ctx, 800, 148, 456, 8, 4); ctx.fill();
  ctx.fillStyle = lowTime ? '#e8442e' : '#7dc242';
  const frac = Math.max(0, state.timeLeft / 180);
  if (frac > 0) { roundRect(ctx, 800, 148, 456 * frac, 8, 4); ctx.fill(); }
}

export function drawStations(ctx, state, chef, highlightStation) {
  for (const s of STATIONS) {
    const near = highlightStation && highlightStation.id === s.id;
    const c = stationCenter(s);
    ctx.save();
    if (s.kind === 'bin') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fillStyle = near ? '#ffe9a8' : '#fff8e6';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2;
      ctx.strokeStyle = near ? '#e8442e' : '#b5762e';
      ctx.stroke();
      drawIngredientIcon(ctx, s.item, c.x, c.y - 14, 46);
      text(ctx, s.label, c.x, s.y + s.h - 16, 14, '#3d2b1f');
    } else if (s.kind === 'chop') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fillStyle = near ? '#ffe9a8' : '#d9a066';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2; ctx.strokeStyle = '#7a5230'; ctx.stroke();
      text(ctx, '🔪', c.x, c.y - 16, 34, '#333');
      text(ctx, 'CHOP', c.x, s.y + s.h - 16, 15, '#3d2b1f');
    } else if (s.kind === 'stove') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fillStyle = near ? '#ffe9a8' : '#5b5b6e';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2; ctx.strokeStyle = '#333'; ctx.stroke();
      for (const bx of [c.x - 28, c.x + 28]) {
        ctx.beginPath(); ctx.arc(bx, c.y - 12, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#2b2b38'; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, c.y - 12, 13, 0, Math.PI * 2);
        ctx.fillStyle = state.processing && state.processing.stationId === 'stove' ? '#ff7b2e' : '#ff9f43'; ctx.fill();
      }
      text(ctx, 'STOVE', c.x, s.y + s.h - 16, 15, '#fff');
    } else if (s.kind === 'grill') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fillStyle = near ? '#ffe9a8' : '#4a3a3a';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2; ctx.strokeStyle = '#2b1d12'; ctx.stroke();
      ctx.strokeStyle = '#cbbf9a'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s.x + 14, c.y - 26 + i * 12); ctx.lineTo(s.x + s.w - 14, c.y - 26 + i * 12); ctx.stroke(); }
      text(ctx, 'GRILL', c.x, s.y + s.h - 16, 15, '#fff');
    } else if (s.kind === 'plate') {
      const ready = plateReady(state);
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.fillStyle = ready ? '#d8f7c0' : '#fff8e6';
      ctx.fill();
      ctx.lineWidth = ready ? 5 : 3;
      ctx.strokeStyle = ready ? '#2e7d32' : '#b5762e';
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(c.x, c.y - 6, 56, 34, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#d9bf8a'; ctx.lineWidth = 3; ctx.stroke();
      state.plate.forEach((item, j) => {
        drawIngredientIcon(ctx, item, c.x - 36 + j * 36, c.y - 6, 34);
      });
      if (state.plate.length === 0) text(ctx, 'empty plate', c.x, c.y - 6, 13, '#b09a70');
      text(ctx, ready ? '✅ READY TO SERVE!' : 'PLATE', c.x, s.y + s.h - 12, ready ? 14 : 15, ready ? '#2e7d32' : '#3d2b1f');
    } else if (s.kind === 'serve') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.fillStyle = near ? '#ffe9a8' : '#c0392b';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2; ctx.strokeStyle = '#7a1f14'; ctx.stroke();
      text(ctx, '🛎️', c.x, c.y - 14, 34, '#fff');
      text(ctx, 'SERVE', c.x, s.y + s.h - 16, 16, '#fff');
    } else if (s.kind === 'trash') {
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.fillStyle = near ? '#ffe9a8' : '#8a8f98';
      ctx.fill();
      ctx.lineWidth = near ? 4 : 2; ctx.strokeStyle = '#555'; ctx.stroke();
      text(ctx, '🗑️', c.x, c.y - 12, 32, '#fff');
      text(ctx, 'TRASH', c.x, s.y + s.h - 14, 13, '#fff');
    }
    ctx.restore();
  }

  // Processing progress ring above the active station.
  if (state.processing) {
    const st = STATIONS.find((s) => s.id === state.processing.stationId);
    if (st) {
      const c = stationCenter(st);
      const frac = 1 - state.processing.left / state.processing.total;
      ctx.save();
      ctx.beginPath(); ctx.arc(c.x, c.y - 62, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#e0d0b0';
      ctx.beginPath(); ctx.arc(c.x, c.y - 62, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#e8442e';
      ctx.beginPath(); ctx.arc(c.x, c.y - 62, 20, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      text(ctx, state.processing.stationId === 'chop' ? '🔪' : state.processing.stationId === 'grill' ? '🔥' : '🍳', c.x, c.y - 62, 20, '#333');
      ctx.restore();
    }
  }
}

export function drawChef(ctx, chef, state) {
  // Shadow.
  ctx.beginPath(); ctx.ellipse(chef.x, chef.y + 26, 26, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  // Body (apron) and head.
  ctx.beginPath(); ctx.arc(chef.x, chef.y + 8, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f0dc'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#c0392b'; ctx.stroke();
  ctx.beginPath(); ctx.arc(chef.x, chef.y - 16, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c89b'; ctx.fill(); ctx.stroke();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, chef.x - 15, chef.y - 38, 30, 14, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.x - 8, chef.y - 36, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.x + 8, chef.y - 36, 8, 0, Math.PI * 2); ctx.fill();
  // Face.
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(chef.x - 5, chef.y - 16, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(chef.x + 5, chef.y - 16, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(chef.x, chef.y - 12, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Carried item floating above the hat.
  if (state.carry) {
    drawIngredientIcon(ctx, state.carry, chef.x, chef.y - 56, 34);
    text(ctx, ingredientLabel(state.carry), chef.x, chef.y - 78, 12, '#3d2b1f');
  }
  // Walk target marker.
  if (chef.target) {
    ctx.strokeStyle = 'rgba(61,43,31,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(chef.target.x, chef.target.y, 8, 0, Math.PI * 2); ctx.stroke();
  }
}

export function drawMessage(ctx, state) {
  if (state.messageTimer > 0 && state.message) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.messageTimer);
    roundRect(ctx, 340, 168, 600, 40, 20);
    ctx.fillStyle = 'rgba(61,43,31,0.92)'; ctx.fill();
    text(ctx, state.message, 640, 189, 19, '#ffcf5c');
    ctx.restore();
  }
}

export function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(36, 26, 18, 0.72)';
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 240, 90, 800, 460, 20);
  ctx.fillStyle = '#fff8e6'; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = '#e8b64c'; ctx.stroke();
  text(ctx, '🍳  SIZZLE & SERVE  🍳', 640, 150, 44, '#c0392b');
  text(ctx, 'WARUNG RUSH', 640, 200, 30, '#3d2b1f');
  text(ctx, 'The lunch crowd is coming. Chop, cook, grill,', 640, 258, 20, '#5a4632');
  text(ctx, 'plate the dishes and serve them before patience runs out!', 640, 288, 20, '#5a4632');
  text(ctx, '🍚 Rice   🍜 Noodle   🥚 Egg   🌶️ Chilli   🥬 Veg   🍢 Skewer', 640, 336, 20, '#333');
  text(ctx, 'Nasi Goreng · Mie Goreng · Sate Plate · Veggie Rice · Spicy Noodle', 640, 372, 17, '#7a5230');
  text(ctx, 'Move: WASD / arrows / click  •  Use station: E / Space / click', 640, 414, 17, '#5a4632');
  text(ctx, 'Serve the ready plate at the red SERVE window. 3 hearts. 3-minute shift.', 640, 442, 17, '#5a4632');
  roundRect(ctx, 490, 470, 300, 54, 12);
  ctx.fillStyle = '#e8442e'; ctx.fill();
  text(ctx, '▶  START COOKING', 640, 498, 22, '#fff');
  text(ctx, 'Press ENTER or click anywhere to start', 640, 536, 15, '#b09a70');
}

export function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(36, 26, 18, 0.78)';
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 290, 130, 700, 420, 20);
  ctx.fillStyle = '#fff8e6'; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = '#e8b64c'; ctx.stroke();
  text(ctx, '🏁  SHIFT OVER  🏁', 640, 190, 40, '#c0392b');
  text(ctx, state.overReason, 640, 240, 19, '#5a4632');
  text(ctx, `FINAL SCORE  ${state.score}`, 640, 300, 30, '#3d2b1f');
  text(ctx, `Dishes served: ${state.served}    Best combo: x${state.bestCombo}    Orders lost: ${state.lost}`, 640, 348, 18, '#7a5230');
  const verdict = state.score >= 1500 ? '🌟 Master Chef! The warung sings your name.'
    : state.score >= 900 ? '👨‍🍳 Great shift! The regulars will be back.'
    : state.score >= 400 ? '🍳 A solid shift — keep the pans hot!'
    : '🌱 Every chef burns the first rice. Cook again!';
  text(ctx, verdict, 640, 392, 19, '#2e7d32');
  roundRect(ctx, 490, 430, 300, 54, 12);
  ctx.fillStyle = '#e8442e'; ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', 640, 458, 22, '#fff');
  text(ctx, 'Press R or click to restart', 640, 516, 15, '#b09a70');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(36, 26, 18, 0.6)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '⏸  PAUSED', 640, 340, 48, '#ffcf5c');
  text(ctx, 'Press P to keep cooking', 640, 400, 20, '#f3e2c2');
}
