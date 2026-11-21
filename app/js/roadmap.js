// The roadmap view and the missables view. The roadmap is built from the official
// descriptions — which story chapters and missions, which collectibles and which
// counts, in the order a first playthrough meets them — and each stage shows its
// own progress. The missables page gathers the flags in one place and says plainly
// how they were decided: from the official words, never from invented detail.

import { missableTrophies } from './data.js';
import { isEarned } from './store.js';
import { displayName } from './filters.js';
import { medalHtml } from './checklist.js';
import { esc } from './html.js';

function chipHtml(data, state, trophy) {
  const earned = isEarned(state, trophy.id);
  return `<button type="button" class="tchip${earned ? ' earned' : ''}" data-open="${trophy.id}">
    ${medalHtml(trophy.grade)}${esc(displayName(trophy, state))}${trophy.missable ? ' ⚠' : ''}
  </button>`;
}

export function renderRoadmap(data, state, actions) {
  const root = document.getElementById('view-roadmap');
  const stages = data.roadmap.map((stage) => {
    const trophies = stage.ids.map((id) => data.byId.get(id));
    const done = trophies.filter((t) => isEarned(state, t.id)).length;
    const pct = Math.round((done / trophies.length) * 100);
    return `<div class="stage">
      <div class="stage-head">
        <span class="n">Stage ${stage.stage}</span>
        <h3>${esc(stage.title)}</h3>
        <span class="stage-progress">${done} of ${trophies.length} earned</span>
      </div>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <p>${esc(stage.summary)}</p>
      <div class="tchips">${trophies.map((t) => chipHtml(data, state, t)).join('')}</div>
    </div>`;
  });
  root.innerHTML = `
    <h2 class="viewtitle">Roadmap to the platinum</h2>
    <p class="lede">The order to earn all 55 in, built from the official descriptions: the story chapters and
    missions first (with the one airport feat taken while the story is at VCIA), then the stranger strands,
    the activities and their counts, the collectibles, the scores, and the money tail — so nothing counted
    is left until it hurts. Click any trophy to open its guide.</p>
    ${stages.join('')}`;
  root.querySelectorAll('[data-open]').forEach((chip) => {
    chip.addEventListener('click', () => actions.openTrophy(Number(chip.dataset.open)));
  });
}

export function renderMissables(data, state, actions) {
  const root = document.getElementById('view-missables');
  const flagged = missableTrophies(data);
  const cards = flagged.map((trophy) => `
    <div class="misscard">
      <h3>${medalHtml(trophy.grade)}${esc(trophy.name)} <span class="grade-name">${esc(trophy.grade)}</span></h3>
      <p class="official">“${esc(trophy.description)}”</p>
      <p>${esc(trophy.missableNote)}</p>
      <button type="button" class="linkish" data-open="${trophy.id}">Open the full guide →</button>
    </div>`);
  root.innerHTML = `
    <h2 class="viewtitle">Missables — the ${flagged.length} to plan around</h2>
    <p class="lede">Every other trophy on the list is repeatable, finishable in free roam, or pops for a
    completion the story cannot skip — each guide says why, under “Can it be missed?”. These ${flagged.length}
    are the exceptions, flagged from the official descriptions alone: a feat tied to one story location, a
    name that points at the game's opening, a fail-first mechanic, a count built on one-time story choices,
    and a strange event that may only happen once. The game is a day old and no flag here pretends to be
    confirmed in play; they are the cautious reading of the official words, and the roadmap is ordered so
    each one is taken while its window is open.</p>
    ${cards.join('')}`;
  root.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => actions.openTrophy(Number(button.dataset.open)));
  });
}
