// Sizzle & Serve — Warung Rush: game loop and interaction rules.
// The chef carries one thing at a time. Raw ingredients come from the bins,
// must be finished at their station (chop / stove / grill), then go on the
// plate. When the plate matches an order exactly it is ready, and serving
// it at the red window pays out. Wrong moves buzz and cost nothing but time.

import { INGREDIENTS, finishedId, ingredientLabel } from './recipes.js';
import { STATIONS, stationById, nearestUsableStation, clampToFloor } from './kitchen.js';
import {
  createShift, spawnOrder, matchingOrder, plateReady, serveOrder, loseOrder,
  tickShift, clearPlate, endShift,
} from './orders.js';
import { createInput, moveVector, consumeInteract, consumeClickedStation } from './input.js';
import { sfx, setMuted } from './audio.js';
import {
  drawKitchen, drawOrderBoard, drawHud, drawStations, drawChef,
  drawMessage, drawTitle, drawGameOver, drawPaused,
} from './render.js';
import { applyShotState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const state = createShift();
const chef = { x: 640, y: 380, target: null, speed: 300 };
const input = createInput(canvas);
let highlightStation = null;
let lastTickSecond = -1;

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function startShift() {
  const fresh = createShift();
  Object.assign(state, fresh);
  state.phase = 'playing';
  state.seed = 7;
  chef.x = 640;
  chef.y = 380;
  chef.target = null;
  spawnOrder(state, 'nasi-goreng');
  spawnOrder(state, 'mie-goreng');
  setStatus('Shift started. Serve the orders on the board.');
  sfx.click();
}

function stationAction(station) {
  if (state.phase !== 'playing') return false;
  // While something is cooking, a station use waits instead of failing:
  // the caller retries once the pan is free.
  if (state.processing) {
    state.message = 'Still cooking — one moment…';
    state.messageTimer = 1.0;
    return 'busy';
  }
  const kind = station.kind;
  if (kind === 'bin') {
    if (state.carry) {
      state.message = 'Hands full! Finish or drop what you carry first.';
      state.messageTimer = 1.4;
      sfx.error();
      return false;
    }
    state.carry = station.item;
    state.message = `Picked up ${INGREDIENTS[station.item].name} — take it to the ${INGREDIENTS[station.item].station}.`;
    state.messageTimer = 1.6;
    sfx.pickup();
    return true;
  }
  if (kind === 'chop' || kind === 'stove' || kind === 'grill') {
    if (!state.carry) {
      state.message = 'Bring an ingredient here first.';
      state.messageTimer = 1.4;
      sfx.error();
      return false;
    }
    const ing = INGREDIENTS[state.carry];
    if (!ing || state.carry.startsWith('cooked-')) {
      state.message = 'That is already cooked — take it to the plate.';
      state.messageTimer = 1.4;
      sfx.error();
      return false;
    }
    if (ing.station !== kind) {
      state.message = `${ing.name} goes to the ${ing.station.toUpperCase()}, not the ${kind.toUpperCase()}.`;
      state.messageTimer = 1.8;
      sfx.error();
      return false;
    }
    state.processing = {
      stationId: station.id,
      item: finishedId(state.carry),
      itemName: ing.name,
      total: ing.cookSecs,
      left: ing.cookSecs,
    };
    state.carry = null;
    if (kind === 'chop') sfx.chop();
    else sfx.sizzle();
    return true;
  }
  if (kind === 'plate') {
    if (!state.carry) {
      state.message = 'The plate is waiting for a finished ingredient.';
      state.messageTimer = 1.4;
      sfx.error();
      return false;
    }
    if (!state.carry.startsWith('cooked-')) {
      state.message = 'Cook it first! Raw food never goes on the plate.';
      state.messageTimer = 1.8;
      sfx.error();
      return false;
    }
    if (state.plate.includes(state.carry)) {
      state.message = 'That is already on the plate.';
      state.messageTimer = 1.4;
      sfx.error();
      return false;
    }
    state.plate.push(state.carry);
    state.carry = null;
    sfx.drop();
    if (plateReady(state)) {
      state.message = 'Dish complete! Serve it at the red window! 🛎️';
      state.messageTimer = 2.4;
      sfx.ready();
    } else {
      state.message = `On the plate: ${state.plate.map(ingredientLabel).join(', ')}`;
      state.messageTimer = 1.6;
    }
    return true;
  }
  if (kind === 'serve') {
    const served = serveOrder(state);
    if (served) {
      sfx.serve();
      setStatus(`Served ${served.order.name} for ${served.earned} points.`);
      return true;
    }
    state.message = plateReady(state)
      ? 'Serve it at the window!'
      : 'No dish is ready — the plate must match an order exactly.';
    state.messageTimer = 1.8;
    sfx.error();
    return false;
  }
  if (kind === 'trash') {
    if (state.carry) {
      state.message = `Threw away ${ingredientLabel(state.carry)}.`;
      state.messageTimer = 1.2;
      state.carry = null;
      sfx.drop();
    } else if (state.plate.length > 0) {
      clearPlate(state);
      sfx.drop();
    } else {
      state.message = 'Nothing to throw away.';
      state.messageTimer = 1.2;
    }
    return true;
  }
  return false;
}

// Use a clicked station, retrying while the kitchen is busy: a click on the
// plate a moment before the pan finishes now lands instead of being lost.
function usePendingStation(st) {
  const result = stationAction(st);
  if (result === 'busy') {
    input._retryAt = performance.now() + 400;
    return;
  }
  input._pendingStation = null;
}

function update(dt) {
  // Keyboard shortcuts that work in any phase.
  if (input.onKey === null) {
    input.onKey = (code) => {
      if (code === 'Enter' && (state.phase === 'title' || state.phase === 'over')) startShift();
      else if (code === 'KeyR' && (state.phase === 'over' || state.phase === 'playing')) startShift();
      else if (code === 'KeyP' && state.phase === 'playing') { state.phase = 'paused'; setStatus('Paused.'); }
      else if (code === 'KeyP' && state.phase === 'paused') { state.phase = 'playing'; setStatus('Cooking resumed.'); }
      else if (code === 'KeyM') { state.muted = !state.muted; setMuted(state.muted); state.message = state.muted ? 'Sound off.' : 'Sound on.'; state.messageTimer = 1.2; }
      else if (code === 'KeyT' && state.phase === 'playing') stationAction(stationById('trash'));
    };
  }

  const clicked = consumeClickedStation(input);
  if (clicked) {
    if (state.phase === 'title' || state.phase === 'over') { startShift(); return; }
    if (state.phase === 'playing') {
      // Clicking a station walks the chef close, then uses it.
      chef.target = { x: clicked.x + clicked.w / 2, y: Math.min(clicked.y - 4, 540) };
      input._pendingStation = clicked;
    }
  }
  if (consumeInteract(input) && state.phase === 'playing') {
    const near = nearestUsableStation(chef);
    if (near) stationAction(near);
    else { state.message = 'Walk up to a station first.'; state.messageTimer = 1.2; }
  }

  if (state.phase !== 'playing') return;

  // Movement: keys win over click-to-move.
  const vec = moveVector(input);
  if (vec) {
    chef.target = null;
    chef.x += vec.x * chef.speed * dt;
    chef.y += vec.y * chef.speed * dt;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      chef.target = null;
    } else {
      const step = Math.min(dist, chef.speed * dt);
      chef.x += (dx / dist) * step;
      chef.y += (dy / dist) * step;
    }
  }
  const clamped = clampToFloor(chef);
  chef.x = clamped.x;
  chef.y = clamped.y;

  // Arrived at a clicked station: use it (retrying while the pan is busy).
  if (input._pendingStation && !chef.target) {
    if (!input._retryAt || performance.now() >= input._retryAt) {
      input._retryAt = 0;
      usePendingStation(input._pendingStation);
    }
  } else if (input._pendingStation) {
    const st = input._pendingStation;
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2;
    if (Math.hypot(chef.x - cx, chef.y - cy) < 110) {
      chef.target = null;
      if (!input._retryAt || performance.now() >= input._retryAt) {
        input._retryAt = 0;
        usePendingStation(st);
      }
    }
  }

  highlightStation = nearestUsableStation(chef);
  const before = state.hearts;
  tickShift(state, dt);
  if (state.hearts < before) sfx.lose();
  const sec = Math.ceil(state.timeLeft);
  if (sec !== lastTickSecond) {
    lastTickSecond = sec;
    if (sec <= 10 && sec > 0) sfx.tick();
  }
  if (state.phase === 'over') setStatus(`Shift over. Final score ${state.score}. Press R to cook again.`);
}

function render() {
  ctx.clearRect(0, 0, 1280, 720);
  drawKitchen(ctx, state, chef);
  drawStations(ctx, state, chef, highlightStation);
  drawChef(ctx, chef, state);
  drawOrderBoard(ctx, state);
  drawHud(ctx, state);
  drawMessage(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'over') drawGameOver(ctx, state);
  else if (state.phase === 'paused') drawPaused(ctx);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// Screenshot states: ?shot=start|play|serve|rush&seed=N freezes a staged
// mid-game scene so the maker can capture real renders of the game.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShotState(state, chef, shot, Number(params.get('seed') || 1));
  render();
} else {
  requestAnimationFrame(frame);
}
