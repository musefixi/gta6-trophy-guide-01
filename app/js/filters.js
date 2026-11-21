// The filtering rules of the checklist: the kind chips, the grade select, the search
// box, "hide earned", and the spoiler shield. Pure functions of (data, progress, query)
// so the checklist, the roadmap and the planner all mask and match the same way.

import { isEarned } from './store.js';

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

// The spoiler shield hides a story trophy's name and description until it is earned:
// the story is the spoiler. It masks the story trophies PlayStation itself hides (the
// platinum, which PSN shows openly, is never masked, and neither is a story-side feat
// like the VCIA departure, which the reader came here to plan around).
export function isSpoilerHidden(trophy, state) {
  return state.settings.spoilers
    && trophy.hidden
    && trophy.kinds.includes('story')
    && !isEarned(state, trophy.id);
}

export function displayName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  if (isSpoilerHidden(trophy, state)) {
    return 'A story trophy, hidden by the spoiler shield until you earn it.';
  }
  return trophy.description;
}

export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable;
  return trophy.kinds.includes(kind);
}

export function matchesSearch(trophy, text) {
  if (!text) return true;
  const haystack = [
    trophy.name, trophy.description, trophy.guide, trophy.grade,
    ...trophy.kinds, ...(trophy.steps ?? []),
  ].join(' ').toLowerCase();
  return text.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

// query: { kind, grade, text, hideEarned }
export function filterTrophies(data, state, query) {
  return data.trophies.filter((trophy) => {
    if (!matchesKind(trophy, query.kind)) return false;
    if (query.grade !== 'all' && trophy.grade !== query.grade) return false;
    if (query.hideEarned && isEarned(state, trophy.id)) return false;
    return matchesSearch(trophy, query.text);
  });
}

export function formatCount(n) {
  return n.toLocaleString('en-US');
}
