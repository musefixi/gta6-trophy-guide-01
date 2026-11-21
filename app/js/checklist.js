// The checklist view: the filterable list of all 55 trophies on the left and the
// open trophy's full guide on the right. The guide pane is where the entry makes
// its promises — the official name, description and grade, the guide in our own
// words with its steps, the missable note, the sources, the counter for the
// targets PlayStation tracks, and the reader's own notes.

import { resolveSources, stageOf } from './data.js';
import { counterOf, counterStep, isEarned } from './store.js';
import { displayDescription, displayName, filterTrophies, formatCount, isSpoilerHidden } from './filters.js';
import { esc } from './html.js';

export function medalHtml(grade) {
  return `<span class="medal ${esc(grade)}" aria-hidden="true"></span>`;
}

function rowHtml(data, state, trophy, selectedId) {
  const earned = isEarned(state, trophy.id);
  const masked = isSpoilerHidden(trophy, state);
  const counter = typeof trophy.target === 'number'
    ? `<span class="counter-chip">${formatCount(counterOf(state, trophy))} / ${formatCount(trophy.target)}</span>`
    : '';
  const flag = trophy.missable ? '<div class="flag">⚠ missable</div>' : '';
  return `<li class="trophy-row${earned ? ' earned' : ''}${trophy.id === selectedId ? ' selected' : ''}" data-id="${trophy.id}">
    <input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(masked ? 'hidden trophy' : trophy.name)} earned">
    <div class="who">
      <div class="name">${medalHtml(trophy.grade)}${esc(displayName(trophy, state))}</div>
      <div class="desc">${esc(displayDescription(trophy, state))}</div>
    </div>
    <div class="side"><span class="grade-name">${esc(trophy.grade)}</span>${counter}${flag}</div>
  </li>`;
}

export function renderChecklist(data, state, ui, actions) {
  const list = document.getElementById('trophy-list');
  const visible = filterTrophies(data, state, ui);
  list.innerHTML = visible.length
    ? visible.map((t) => rowHtml(data, state, t, ui.selectedId)).join('')
    : `<li class="empty-note">${emptyMessage(data, ui)}</li>`;
  document.getElementById('result-count').textContent =
    `${visible.length} of ${data.trophies.length} shown`;

  list.querySelectorAll('.trophy-row').forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.matches('input[type="checkbox"]')) return;
      actions.select(Number(row.dataset.id));
    });
  });
  list.querySelectorAll('input[data-earn]').forEach((box) => {
    box.addEventListener('change', () => actions.toggleEarned(Number(box.dataset.earn)));
  });

  renderGuidePane(data, state, ui, actions);
}

function emptyMessage(data, ui) {
  if (ui.kind === 'online') {
    return 'The official PlayStation 5 list has no online trophies — all 55 can be earned offline, in single player. That is a fact of the list, not a gap in this guide.';
  }
  return 'No trophy matches that filter and search. Loosen one of them and the list comes back.';
}

function sourcesHtml(data, trophy) {
  const items = resolveSources(data, trophy).map((source) => {
    const name = source.url
      ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)}</a>`
      : esc(source.name);
    return `<li>${name} — ${esc(source.covers)}</li>`;
  });
  return `<h3>Sources</h3><ul class="sources">${items.join('')}</ul>`;
}

function counterHtml(state, trophy) {
  if (typeof trophy.target !== 'number') return '';
  const value = counterOf(state, trophy);
  const step = counterStep(trophy);
  return `<div class="counter" aria-label="Progress counter">
    <button type="button" data-count="-1" aria-label="Decrease">−</button>
    <input type="number" id="counter-input" min="0" max="${trophy.target}" step="${step}" value="${value}">
    <button type="button" data-count="1" aria-label="Increase">+</button>
    <span class="unit">of ${formatCount(trophy.target)} ${esc(trophy.unit)} — the target PlayStation tracks</span>
  </div>`;
}

export function renderGuidePane(data, state, ui, actions) {
  const pane = document.getElementById('guide-pane');
  const trophy = data.byId.get(ui.selectedId) ?? data.trophies[0];
  const earned = isEarned(state, trophy.id);
  const masked = isSpoilerHidden(trophy, state);
  const stage = stageOf(data, trophy);
  const badges = [
    ...trophy.kinds.map((k) => `<span class="tag">${esc(k)}</span>`),
    trophy.missable ? '<span class="tag missable">⚠ missable</span>' : '',
    trophy.hidden ? '<span class="tag hidden-tag">hidden on PSN</span>' : '',
    stage ? `<span class="tag">roadmap stage ${stage.stage}</span>` : '',
  ].join('');

  if (masked) {
    pane.innerHTML = `
      <p class="muted">Roadmap stage ${stage ? stage.stage : '—'} · ${esc(trophy.grade)}</p>
      <h2>Hidden trophy</h2>
      <p class="official">The spoiler shield is on: this story trophy's name and description stay
      hidden until you earn it, so the story cannot spoil itself.</p>
      <div class="earnline">
        <label class="big-check"><input type="checkbox" id="pane-earn" ${earned ? 'checked' : ''}> Earned it</label>
        ${counterHtml(state, trophy)}
      </div>
      <p>Turn the spoiler shield off in the header if you would rather plan with everything visible.</p>`;
  } else {
    pane.innerHTML = `
      <p class="muted">${medalHtml(trophy.grade)}<span class="grade-name">${esc(trophy.grade)}</span> · trophy ${trophy.id} of 55</p>
      <h2>${esc(trophy.name)}</h2>
      <p class="official"><strong>Official description:</strong> “${esc(trophy.description)}”</p>
      <div class="badges">${badges}</div>
      <div class="earnline">
        <label class="big-check"><input type="checkbox" id="pane-earn" ${earned ? 'checked' : ''}> Earned</label>
        ${counterHtml(state, trophy)}
      </div>
      <h3>Guide — in our own words</h3>
      <p>${esc(trophy.guide)}</p>
      <h3>Steps</h3>
      <ol>${trophy.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="missbox${trophy.missable ? ' danger' : ''}">
        <h3>Can it be missed?</h3>
        <p>${esc(trophy.missableNote)}</p>
      </div>
      ${sourcesHtml(data, trophy)}
      <h3>Your notes</h3>
      <textarea class="notes" id="note-input" placeholder="Your own notes for this trophy — saved in this browser only.">${esc(state.notes[trophy.id] ?? '')}</textarea>`;
  }

  pane.querySelector('#pane-earn').addEventListener('change', () => actions.toggleEarned(trophy.id));
  const input = pane.querySelector('#counter-input');
  if (input) {
    input.addEventListener('change', () => actions.setCounter(trophy, Number(input.value)));
    pane.querySelectorAll('button[data-count]').forEach((button) => {
      button.addEventListener('click', () => {
        actions.setCounter(trophy, counterOf(state, trophy) + Number(button.dataset.count) * counterStep(trophy));
      });
    });
  }
  const note = pane.querySelector('#note-input');
  if (note) {
    note.addEventListener('input', () => actions.setNote(trophy.id, note.value));
  }
}
