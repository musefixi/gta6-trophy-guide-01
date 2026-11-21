// Leonida Trophy Atlas — boot and wiring. Loads the data, restores the reader's
// progress, renders the five views (checklist, roadmap, missables, planner, save),
// and owns the small pieces of UI state the views share: the current view, the
// checklist's filters and the open trophy. Every change saves and re-renders.
//
// The page also answers a few URL parameters, used by the entry's screenshot
// script and handy for deep links: ?view=roadmap, ?open=<trophy id>,
// ?kind=missable, ?grade=silver, ?spoilers=1, ?seed=1 (load the demo progress
// when no save exists yet).

import { loadGuideData, missableTrophies } from './data.js';
import {
  demoProgress, isEarned, loadProgress, saveProgress, setCounter, toggleEarned,
} from './store.js';
import { renderChecklist } from './checklist.js';
import { renderMissables, renderRoadmap } from './roadmap.js';
import { renderPlanner } from './planner.js';
import { renderSettings } from './settings.js';

const params = new URLSearchParams(location.search);
const data = await loadGuideData();

let state = loadProgress();
if (params.get('seed') === '1' && state.earned.length === 0 && Object.keys(state.counters).length === 0) {
  state = demoProgress();
  saveProgress(state);
}
if (params.get('spoilers') === '1') state.settings.spoilers = true;

const ui = {
  view: ['checklist', 'roadmap', 'missables', 'planner', 'save'].includes(params.get('view'))
    ? params.get('view') : 'checklist',
  kind: params.get('kind') ?? 'all',
  grade: params.get('grade') ?? 'all',
  text: '',
  hideEarned: state.settings.hideEarned,
  selectedId: Number(params.get('open')) || 17,
};

const actions = {
  select(id) {
    ui.selectedId = id;
    render();
  },
  openTrophy(id) {
    ui.selectedId = id;
    ui.view = 'checklist';
    ui.kind = 'all';
    ui.grade = 'all';
    ui.text = '';
    document.getElementById('search').value = '';
    syncControls();
    render();
  },
  toggleEarned(id) {
    toggleEarned(state, id);
    saveProgress(state);
    render();
  },
  setCounter(trophy, value) {
    setCounter(state, trophy, value);
    saveProgress(state);
    render();
  },
  setNote(id, text) {
    if (text.trim()) state.notes[id] = text;
    else delete state.notes[id];
    saveProgress(state);
  },
  setSetting(name, value) {
    state.settings[name] = value;
    if (name === 'hideEarned') ui.hideEarned = value;
    saveProgress(state);
    syncControls();
    render();
  },
  replaceState(next) {
    state = next;
    saveProgress(state);
    syncControls();
    render();
  },
};

function renderScoreboard() {
  const earned = state.earned.length;
  document.getElementById('earned-count').textContent = String(earned);
  document.getElementById('earned-bar').style.width = `${(earned / data.trophies.length) * 100}%`;
  document.getElementById('earned-note').textContent =
    `Platinum progress: ${Math.round((earned / data.trophies.length) * 100)}% · ` +
    `${data.trophies.filter((t) => t.grade === 'silver' && isEarned(state, t.id)).length} of 6 silvers · ` +
    `${missableTrophies(data).filter((t) => isEarned(state, t.id)).length} of ${missableTrophies(data).length} missables safe`;
  document.getElementById('missable-count').textContent = String(missableTrophies(data).length);
}

function render() {
  renderScoreboard();
  document.querySelectorAll('#tabs button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === ui.view);
  });
  for (const name of ['checklist', 'roadmap', 'missables', 'planner', 'save']) {
    document.getElementById(`view-${name}`).hidden = name !== ui.view;
  }
  if (ui.view === 'checklist') renderChecklist(data, state, ui, actions);
  if (ui.view === 'roadmap') renderRoadmap(data, state, actions);
  if (ui.view === 'missables') renderMissables(data, state, actions);
  if (ui.view === 'planner') renderPlanner(data, state, actions);
  if (ui.view === 'save') renderSettings(data, state, actions);
}

function syncControls() {
  document.getElementById('spoiler-toggle').checked = state.settings.spoilers;
  document.getElementById('hide-earned').checked = ui.hideEarned;
  document.getElementById('grade-filter').value = ui.grade;
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === ui.kind);
  });
}

document.querySelectorAll('#tabs button').forEach((button) => {
  button.addEventListener('click', () => { ui.view = button.dataset.view; render(); });
});
document.querySelectorAll('#kind-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => { ui.kind = chip.dataset.kind; syncControls(); render(); });
});
document.getElementById('grade-filter').addEventListener('change', (event) => {
  ui.grade = event.target.value; render();
});
document.getElementById('hide-earned').addEventListener('change', (event) => {
  ui.hideEarned = event.target.checked;
  state.settings.hideEarned = ui.hideEarned;
  saveProgress(state);
  render();
});
document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
  state.settings.spoilers = event.target.checked;
  saveProgress(state);
  render();
});
document.getElementById('search').addEventListener('input', (event) => {
  ui.text = event.target.value;
  renderChecklist(data, state, ui, actions);
});

document.addEventListener('keydown', (event) => {
  const typing = event.target.matches('input, textarea, select');
  if (event.key === '/' && !typing) {
    event.preventDefault();
    ui.view = 'checklist';
    render();
    document.getElementById('search').focus();
    return;
  }
  if (typing) return;
  const views = ['checklist', 'roadmap', 'missables', 'planner', 'save'];
  if (['1', '2', '3', '4', '5'].includes(event.key)) {
    ui.view = views[Number(event.key) - 1];
    render();
  } else if (event.key === 's') {
    state.settings.spoilers = !state.settings.spoilers;
    saveProgress(state);
    syncControls();
    render();
  } else if (event.key === 'x') {
    actions.toggleEarned(ui.selectedId);
  }
});

syncControls();
render();
