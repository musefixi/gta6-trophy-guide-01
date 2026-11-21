// Loads app/data/trophies.json (the official list plus this guide's own text) and hands the
// rest of the app small, read-only lookups over it. Nothing here touches the network beyond
// that one file of the app's own, and nothing here mutates the document it loaded.

export async function loadGuideData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json answered ${response.status}`);
  const doc = await response.json();
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  const stageById = new Map();
  for (const stage of doc.roadmap) {
    stage.ids.forEach((id, position) => stageById.set(id, { stage, position }));
  }
  return { doc, trophies: doc.trophies, byId, roadmap: doc.roadmap, stageById };
}

export function trophyById(data, id) {
  return data.byId.get(id);
}

export function stageOf(data, trophy) {
  const found = data.stageById.get(trophy.id);
  return found ? found.stage : null;
}

// The order the roadmap earns trophies in: stage by stage, then the position the
// roadmap lists inside the stage. The planner and the "next up" list sort by this.
export function roadmapRank(data, trophy) {
  const found = data.stageById.get(trophy.id);
  if (!found) return 9999;
  return found.stage.stage * 100 + found.position;
}

// A trophy's sources, resolved from the keys it carries to the shared source
// entries at the head of the data file: [{ key, name, url|null, covers }].
export function resolveSources(data, trophy) {
  return trophy.sources.map((key) => ({ key, ...data.doc.sources[key] }));
}

export function countedTrophies(data) {
  return data.trophies.filter((t) => typeof t.target === 'number');
}

export function missableTrophies(data) {
  return data.trophies.filter((t) => t.missable);
}
