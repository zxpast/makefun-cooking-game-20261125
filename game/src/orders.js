// Orders, scoring and the shift clock. New tickets arrive on a timer that
// shortens as the shift goes on; each ticket's patience bar drains, and a
// ticket that runs out costs a heart and breaks the combo. Serving a dish
// whose plate matches a ticket exactly pays its price plus a patience bonus
// and a combo bonus, and every fourth serve starts a RUSH.

import { RECIPES, recipeById, finishedId } from './recipes.js';

export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;

export function createShift() {
  return {
    phase: 'title', // title | playing | paused | over
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    serves: 0,
    served: 0,
    lost: 0,
    hearts: MAX_HEARTS,
    level: 1,
    rush: false,
    rushTimer: 0,
    orders: [],
    spawnTimer: 4,
    plate: [],
    carry: null,
    processing: null, // { stationId, item, total, left }
    message: '',
    messageTimer: 0,
    flash: 0,
    elapsed: 0,
    seed: 1,
    muted: false,
    overReason: '',
  };
}

function rand(state) {
  // Small deterministic PRNG so screenshot states reproduce exactly.
  state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
  return state.seed / 0x7fffffff;
}

export function spawnOrder(state, forcedRecipeId) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const pool = RECIPES.filter((r) => !state.orders.some((o) => o.recipeId === r.id));
  const recipe = forcedRecipeId
    ? recipeById(forcedRecipeId)
    : pool[Math.floor(rand(state) * pool.length)];
  if (!recipe) return null;
  const patience = Math.max(26, 48 - state.level * 2);
  const order = {
    id: `order-${state.elapsed.toFixed(0)}-${state.orders.length}-${Math.floor(rand(state) * 1000)}`,
    recipeId: recipe.id,
    name: recipe.name,
    needs: recipe.needs.map((n) => finishedId(n)),
    patience,
    patienceMax: patience,
    bornAt: state.elapsed,
  };
  state.orders.push(order);
  return order;
}

export function matchingOrder(state) {
  const plate = [...state.plate].sort().join('|');
  return state.orders.find((o) => [...o.needs].sort().join('|') === plate) ?? null;
}

export function plateReady(state) {
  return matchingOrder(state) !== null;
}

export function serveOrder(state) {
  const order = matchingOrder(state);
  if (!order) return null;
  const recipe = recipeById(order.recipeId);
  const patienceBonus = Math.round(60 * (order.patience / order.patienceMax));
  const comboBonus = state.combo * 15;
  const earned = recipe.price + patienceBonus + comboBonus;
  state.score += earned;
  state.coins += earned;
  state.serves += 1;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o !== order);
  state.plate = [];
  state.flash = 1;
  state.message = `Served ${recipe.name}! +${earned}`;
  state.messageTimer = 2.2;
  if (state.serves % 4 === 0) {
    state.level += 1;
    state.rush = true;
    state.rushTimer = 12;
    state.message = `RUSH HOUR! Level ${state.level} — orders come faster!`;
    state.messageTimer = 3;
  }
  return { order, earned };
}

export function loseOrder(state, order) {
  state.orders = state.orders.filter((o) => o !== order);
  state.lost += 1;
  state.hearts -= 1;
  state.combo = 0;
  state.message = `${order.name} walked out! -1 heart`;
  state.messageTimer = 2.2;
  state.flash = 1;
  if (state.hearts <= 0) endShift(state, 'Out of hearts — the crowd went home hungry.');
}

export function endShift(state, reason) {
  state.phase = 'over';
  state.overReason = reason;
}

export function tickShift(state, dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.rushTimer > 0) {
    state.rushTimer -= dt;
    if (state.rushTimer <= 0) state.rush = false;
  }
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift(state, 'Shift over! The warung closes its shutters.');
    return;
  }
  // Orders arrive faster as the level rises and during a rush.
  const interval = Math.max(7, (state.rush ? 8 : 15) - state.level);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = interval;
  }
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) loseOrder(state, order);
  }
  if (state.processing) {
    state.processing.left -= dt;
    if (state.processing.left <= 0) {
      state.carry = state.processing.item;
      state.message = `${state.processing.itemName} is ready!`;
      state.messageTimer = 1.4;
      state.processing = null;
    }
  }
}

export function clearPlate(state) {
  state.plate = [];
  state.message = 'Plate cleared.';
  state.messageTimer = 1.2;
}
