// The "Next up" planner: given the reader's actual progress, what to do next.
// It walks the roadmap in order for the next unearned trophies (missable windows
// called out), then ranks the counted trophies by how close they are, so a
// session can be planned at a glance: one story step, one grind nearly done.

import { countedTrophies, roadmapRank, stageOf } from './data.js';
import { counterOf, isEarned } from './store.js';
import { displayName, formatCount } from './filters.js';
import { medalHtml } from './checklist.js';
import { esc } from './html.js';

export function renderPlanner(data, state, actions) {
  const root = document.getElementById('view-planner');
  const unearned = data.trophies
    .filter((t) => !isEarned(state, t.id))
    .sort((a, b) => roadmapRank(data, a) - roadmapRank(data, b));
  const next = unearned.slice(0, 7);

  const rows = next.map((trophy) => {
    const stage = stageOf(data, trophy);
    const why = trophy.missable
      ? '⚠ missable window — take it while it is open'
      : trophy.id === 1
        ? 'pops on its own when the other 54 are earned'
        : `roadmap stage ${stage ? stage.stage : '—'}: ${stage ? stage.title : ''}`;
    return `<div class="planrow">
      <span class="stage-tag">Stage ${stage ? stage.stage : '—'}</span>
      <span>${medalHtml(trophy.grade)}<button type="button" class="linkish" data-open="${trophy.id}">${esc(displayName(trophy, state))}</button></span>
      <span class="why">${esc(why)}</span>
    </div>`;
  });

  const close = countedTrophies(data)
    .filter((t) => !isEarned(state, t.id) && counterOf(state, t) > 0)
    .map((t) => ({ t, pct: counterOf(state, t) / t.target }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  const closeRows = close.length
    ? close.map(({ t, pct }) => `
      <div class="planrow">
        <span class="stage-tag">${Math.round(pct * 100)}% there</span>
        <span>${medalHtml(t.grade)}<button type="button" class="linkish" data-open="${t.id}">${esc(t.name)}</button></span>
        <span class="why">${formatCount(counterOf(state, t))} of ${formatCount(t.target)} ${esc(t.unit)}</span>
      </div>`).join('')
    : '<p class="muted">No counters started yet — the counted trophies (stunts, range golds, WAiNK spots…) will rank here once you log progress in their guide panes.</p>';

  const left = unearned.length;
  root.innerHTML = `
    <h2 class="viewtitle">Next up</h2>
    <p class="lede">${left === 0
      ? 'Everything is earned — the platinum is yours. Leonida Legend status: confirmed by the list above.'
      : `${left} trophies to go. In roadmap order, these are the next ones your run meets — missable windows first among equals, because they do not wait.`}</p>
    ${rows.join('')}
    <h2 class="viewtitle" style="margin-top:26px">Closest counters</h2>
    <p class="lede">The counted trophies nearest their PlayStation target — the cheapest wins on the board.</p>
    ${closeRows}`;
  root.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => actions.openTrophy(Number(button.dataset.open)));
  });
}
