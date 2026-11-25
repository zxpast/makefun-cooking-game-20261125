// Deterministic staged scenes for screenshots. Each shot builds a real
// game state through the same state the live game uses — orders on the
// board, a dish mid-assembly on the plate, a timer, a plate ready to serve
// — then the page renders it once and holds still for the capture.

import { spawnOrder } from './orders.js';

export function applyShotState(state, chef, shot, seed) {
  state.seed = seed || 1;
  state.phase = 'playing';
  state.muted = true;
  if (shot === 'start') {
    state.phase = 'title';
    return;
  }
  if (shot === 'play') {
    state.timeLeft = 152;
    state.score = 340;
    state.coins = 340;
    state.combo = 2;
    state.bestCombo = 2;
    state.serves = 3;
    state.served = 3;
    state.level = 2;
    spawnOrder(state, 'nasi-goreng');
    spawnOrder(state, 'mie-goreng');
    spawnOrder(state, 'sate-plate');
    // One dish mid-assembly: rice and egg on the plate, chilli still raw
    // in the chef's hands on the way to the chopping board.
    state.plate = ['cooked-rice', 'cooked-egg'];
    state.carry = 'chilli';
    chef.x = 560;
    chef.y = 470;
    state.message = 'Chop the chilli, then finish the Nasi Goreng!';
    state.messageTimer = 99;
    return;
  }
  if (shot === 'serve') {
    state.timeLeft = 128;
    state.score = 890;
    state.coins = 890;
    state.combo = 4;
    state.bestCombo = 4;
    state.serves = 6;
    state.served = 6;
    state.level = 3;
    spawnOrder(state, 'nasi-goreng');
    spawnOrder(state, 'mie-goreng');
    spawnOrder(state, 'sate-plate');
    // A complete Nasi Goreng sits on the plate, ready to serve, and the
    // chef is already at the red window with the bell.
    state.plate = ['cooked-rice', 'cooked-egg', 'cooked-chilli'];
    chef.x = 1140;
    chef.y = 468;
    state.message = 'Dish complete! Serve it at the red window! 🛎️';
    state.messageTimer = 99;
    return;
  }
  if (shot === 'rush') {
    state.timeLeft = 41;
    state.score = 1640;
    state.coins = 1640;
    state.combo = 6;
    state.bestCombo = 6;
    state.serves = 11;
    state.served = 11;
    state.level = 4;
    state.rush = true;
    state.rushTimer = 9;
    spawnOrder(state, 'spicy-noodle');
    spawnOrder(state, 'sate-plate');
    spawnOrder(state, 'veggie-rice');
    // Rush hour: three tickets, one nearly out of patience, the chef
    // carrying a cooked skewer toward the plate.
    state.orders[0].patience = 6;
    state.orders[0].patienceMax = 40;
    state.orders[1].patience = 18;
    state.plate = ['cooked-noodle', 'cooked-chilli'];
    state.carry = 'cooked-skewer';
    chef.x = 1010;
    chef.y = 492;
    state.message = 'RUSH HOUR! Level 4 — orders come faster!';
    state.messageTimer = 99;
    return;
  }
  // Unknown shot name: show the title screen.
  state.phase = 'title';
}
