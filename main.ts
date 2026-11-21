// Leonida Trophy Atlas — the hand-in program for gta6-trophy-guide-01 (Node 22,
// standard library only). The guide itself is the static web app in app/: plain
// files, no build step, working with the network off, its trophy data in
// app/data/trophies.json. This program copies app/ and screenshots/ into the
// output directory and writes dossier.json there with buildDossier from the
// vendored make.fun library — the file the judge reads. The vendor copy stays
// byte for byte the kit's: the scorer rebuilds the dossier with its own copy
// and compares the two.
//
// Before copying, the program checks the two things an entrant can most easily
// break by hand: that the trophy data still names all 55 official trophies with
// a guide each, and that the screenshots sit inside the gate's size limits.
// A failed check stops the hand-in with the problem named, instead of handing
// in an entry the gate would refuse.
//
// Run it the way the grader does, or locally with an output directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const EXPECTED_TROPHIES = 55;
const SCREENSHOT_MAX_BYTES = 262144;

function checkTrophyData(): void {
  const file = join(here, 'app', 'data', 'trophies.json');
  const doc = JSON.parse(readFileSync(file, 'utf8')) as { trophies?: unknown };
  if (!Array.isArray(doc.trophies)) throw new Error('app/data/trophies.json holds no "trophies" array');
  if (doc.trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`app/data/trophies.json names ${doc.trophies.length} trophies, not ${EXPECTED_TROPHIES}`);
  }
  for (const trophy of doc.trophies as Array<{ name?: unknown; guide?: unknown }>) {
    if (typeof trophy.name !== 'string' || typeof trophy.guide !== 'string' || !trophy.guide.trim()) {
      throw new Error('a trophy in app/data/trophies.json is missing its name or its guide');
    }
  }
}

function checkScreenshots(): void {
  const dir = join(here, 'screenshots');
  if (!existsSync(dir)) throw new Error('screenshots/ is missing: the entry needs 3 or 4 screenshots');
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ holds ${shots.length} files, not 3 or 4`);
  }
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > SCREENSHOT_MAX_BYTES) {
      throw new Error(`screenshots/${name} is ${size} bytes, over the ${SCREENSHOT_MAX_BYTES}-byte cap`);
    }
  }
}

checkTrophyData();
checkScreenshots();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps, passed to the library exactly as the gate states them:
// the dossier text at most 163,840 bytes; at most 4 screenshots of at most
// 256 KiB; app/ at most 993 entries and 48 MiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`handed in: app/ and screenshots/ copied to ${out}, dossier.json written`);
