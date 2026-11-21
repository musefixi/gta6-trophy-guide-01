// The Save & settings page: export the progress to a file, import it back, load the
// demo playthrough, wipe the slate, and the page that says where every fact in the
// atlas came from. Export and import move the whole state — earned ticks, counters,
// notes and settings — as one small JSON file the reader owns.

import { demoProgress, emptyProgress, exportProgress, importProgress } from './store.js';
import { esc } from './html.js';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export function renderSettings(data, state, actions) {
  const root = document.getElementById('view-save');
  const counts = GRADES.map((grade) => {
    const all = data.trophies.filter((t) => t.grade === grade);
    const done = all.filter((t) => state.earned.includes(t.id)).length;
    return `<tr><th>${esc(grade)}</th><td>${done} of ${all.length} earned</td></tr>`;
  }).join('');

  root.innerHTML = `
    <h2 class="viewtitle">Save &amp; settings</h2>
    <p class="lede">Progress is saved in this browser (localStorage) as you tick, count and write.
    Export it to a file to keep it or move it to another browser; import restores it whole.</p>
    <div class="savegrid">
      <div class="savecard">
        <h3>Your progress</h3>
        <table class="counts">${counts}</table>
        <p>${state.earned.length} of ${data.trophies.length} trophies earned.</p>
        <button type="button" class="action" id="export-btn">Export progress to a file</button>
        <label class="action ghost" style="display:inline-block; cursor:pointer">Import progress…
          <input type="file" id="import-file" accept="application/json" hidden>
        </label>
        <p class="statusline" id="import-status"></p>
      </div>
      <div class="savecard">
        <h3>Display</h3>
        <p><label class="checkline"><input type="checkbox" id="settings-spoilers" ${state.settings.spoilers ? 'checked' : ''}>
        Spoiler shield — hide story trophies' names and descriptions until earned</label></p>
        <p><label class="checkline"><input type="checkbox" id="settings-hide-earned" ${state.settings.hideEarned ? 'checked' : ''}>
        Hide earned trophies in the checklist</label></p>
        <h3 style="margin-top:18px">Start over / look around</h3>
        <button type="button" class="action ghost" id="demo-btn">Load the demo playthrough</button>
        <button type="button" class="action danger" id="reset-btn">Erase all progress</button>
        <p class="statusline" id="reset-status"></p>
      </div>
      <div class="savecard">
        <h3>About this atlas &amp; its sources</h3>
        <p>The list is the official PlayStation 5 list for Grand Theft Auto VI: 55 trophies — 1 platinum,
        2 gold, 6 silver, 46 bronze — 28 of them hidden on PlayStation until earned, frozen on 2026-11-18.</p>
        <p>Names, descriptions, grades and hidden flags: <a href="https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/" target="_blank" rel="noopener">Exophase's trophy list</a>.
        The progress targets PlayStation tracks: <a href="https://psnprofiles.com/trophies/43531-grand-theft-auto-vi" target="_blank" rel="noopener">PSNProfiles' trophy page</a>.
        The two listings agree on every name, description and grade.</p>
        <p>Every guide, the roadmap and the missable flags are this atlas's own work, written from those
        official descriptions; where a description does not pin a fact down, the guide says so instead of
        inventing one. Nothing here is copied from another guide, and no Rockstar artwork is used.
        Links open only when you follow them — the app itself fetches nothing.</p>
      </div>
    </div>`;

  root.querySelector('#export-btn').addEventListener('click', () => {
    const blob = new Blob([exportProgress(state)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leonida-trophy-atlas-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  const status = root.querySelector('#import-status');
  root.querySelector('#import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      actions.replaceState(importProgress(await file.text()));
      status.textContent = 'Progress imported.';
    } catch {
      status.textContent = 'That file could not be read as progress — nothing was changed.';
    }
  });

  root.querySelector('#settings-spoilers').addEventListener('change', (event) => {
    actions.setSetting('spoilers', event.target.checked);
  });
  root.querySelector('#settings-hide-earned').addEventListener('change', (event) => {
    actions.setSetting('hideEarned', event.target.checked);
  });
  root.querySelector('#demo-btn').addEventListener('click', () => {
    actions.replaceState(demoProgress());
    status.textContent = 'Demo playthrough loaded: 13 earned, counters part way.';
  });
  root.querySelector('#reset-btn').addEventListener('click', () => {
    actions.replaceState(emptyProgress());
    root.querySelector('#reset-status').textContent = 'Progress erased. A clean slate for a new legend.';
  });
}
