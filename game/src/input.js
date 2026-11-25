// Input: keyboard movement and mouse click-to-move, plus the interact key.
// The chef walks toward a clicked floor point, or with WASD / arrow keys.
// Pressing E, Space, or clicking a station uses the nearest station; the
// game logic in main.js decides what that use does.

import { clampToFloor, stationForPoint } from './kitchen.js';

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    target: null, // {x, y} floor point the chef walks toward
    clickedStation: null,
    interactQueued: false,
    onKey: null, // (code) => void, set by main.js for P/M/R/Enter
    _handlers: [],
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  function onKeyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') input.interactQueued = true;
    if (input.onKey) input.onKey(event.code);
  }

  function onKeyUp(event) {
    input.keys.delete(event.code);
  }

  function onPointerDown(event) {
    const p = canvasPoint(event);
    const station = stationForPoint(p.x, p.y);
    if (station) {
      input.clickedStation = station;
      input.target = { x: p.x, y: Math.min(p.y, 540) };
    } else {
      input.target = clampToFloor(p);
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  input._handlers = [onPointerDown, onKeyDown, onKeyUp];
  return input;
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  const k = input.keys;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
  if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
  if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
  if (x !== 0 || y !== 0) {
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }
  return null;
}

export function consumeInteract(input) {
  const queued = input.interactQueued;
  input.interactQueued = false;
  return queued;
}

export function consumeClickedStation(input) {
  const s = input.clickedStation;
  input.clickedStation = null;
  return s;
}
