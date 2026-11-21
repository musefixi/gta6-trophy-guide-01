// The tracker state: which trophies are earned, the per-trophy counters for the
// targets PlayStation tracks, the reader's own notes, and the settings. It lives in
// localStorage, is exported to a JSON file and imported back on the Save page, and is
// never sent anywhere — this module has no network in it at all.

const STORAGE_KEY = 'leonida-trophy-atlas/v1';

export function emptyProgress() {
  return {
    earned: [],
    counters: {},
    notes: {},
    settings: { spoilers: false, hideEarned: false },
  };
}

// A plausible first-days playthrough, offered on the Save page and used by the
// entry's screenshots: 13 earned, the counted trophies part way.
export function demoProgress() {
  const state = emptyProgress();
  state.earned = [2, 3, 8, 10, 16, 20, 21, 29, 36, 39, 41, 44, 46];
  state.counters = {
    14: 34, 15: 87, 17: 19, 18: 6, 19: 8, 25: 3, 28: 7, 30: 1,
    31: 23, 32: 21, 35: 41, 42: 18, 43: 4, 48: 120, 52: 64000, 53: 27500, 55: 6,
  };
  state.notes = {
    43: 'Gangs done: the dock crew, the beach gang, the bikers, the airport crew. Five to go.',
    17: 'Pistols and SMGs all gold. Rifles: 5 of 9. Shotguns still rough.',
  };
  return state;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normaliseProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Accepts whatever an import (or an older save) holds and returns a clean state:
// unknown shapes fall back to empty, and every field is type-checked on the way in.
export function normaliseProgress(value) {
  const state = emptyProgress();
  if (!value || typeof value !== 'object') return state;
  if (Array.isArray(value.earned)) {
    state.earned = [...new Set(value.earned.filter((id) => Number.isInteger(id)))];
  }
  if (value.counters && typeof value.counters === 'object') {
    for (const [id, n] of Object.entries(value.counters)) {
      if (Number.isFinite(n) && n >= 0) state.counters[id] = Math.floor(n);
    }
  }
  if (value.notes && typeof value.notes === 'object') {
    for (const [id, text] of Object.entries(value.notes)) {
      if (typeof text === 'string' && text.trim()) state.notes[id] = text;
    }
  }
  if (value.settings && typeof value.settings === 'object') {
    state.settings.spoilers = value.settings.spoilers === true;
    state.settings.hideEarned = value.settings.hideEarned === true;
  }
  return state;
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  state.earned = isEarned(state, id)
    ? state.earned.filter((x) => x !== id)
    : [...state.earned, id];
}

export function counterOf(state, trophy) {
  return state.counters[trophy.id] ?? 0;
}

export function setCounter(state, trophy, value) {
  const clean = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  state.counters[trophy.id] = typeof trophy.target === 'number'
    ? Math.min(clean, trophy.target)
    : clean;
}

export function counterStep(trophy) {
  if (typeof trophy.target === 'number' && trophy.target >= 100000) return 5000;
  if (typeof trophy.target === 'number' && trophy.target >= 1000) return 10;
  return 1;
}

export function exportProgress(state) {
  return JSON.stringify({ app: 'leonida-trophy-atlas', version: 1, ...state }, null, 2);
}

export function importProgress(text) {
  return normaliseProgress(JSON.parse(text));
}
