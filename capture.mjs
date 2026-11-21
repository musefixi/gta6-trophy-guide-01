// Takes the entry's screenshots: serves app/ locally, points the headless Chromium
// shell at each scene listed in shots.json, and JPEG-encodes the captures into
// screenshots/ inside the gate's limits (long side at most 1280, short side at
// least 480, at most 256 KiB each). Scenes are plain URLs of the app itself — the
// app's ?seed, ?view, ?open and ?spoilers parameters set up what each shot shows.
// Run: node capture.mjs
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const rawDir = join(here, 'screenshots-raw');
mkdirSync(rawDir, { recursive: true });
mkdirSync(join(here, 'screenshots'), { recursive: true });

function findChromium() {
  const base = join(homedir(), '.cache', 'ms-playwright');
  for (const dir of readdirSync(base)) {
    if (!dir.startsWith('chromium')) continue;
    for (const sub of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux64/chrome']) {
      const candidate = join(base, dir, sub);
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error('no chromium under ~/.cache/ms-playwright');
}

const port = 8141;
const server = spawn('node', [join(here, 'serve.ts'), '--port', String(port)], { stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await wait(900);

try {
  const chromium = findChromium();
  for (const shot of shots) {
    const raw = join(rawDir, shot.file.replace(/\.jpg$/, '.png'));
    execFileSync(chromium, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      `--window-size=${shot.w},${shot.h}`,
      '--virtual-time-budget=20000',
      `--screenshot=${raw}`,
      `http://localhost:${port}/${shot.query}`,
    ], { stdio: 'inherit' });
    execFileSync('python3', ['-c', `
from PIL import Image
import os
im = Image.open(${JSON.stringify(raw)}).convert('RGB')
out = ${JSON.stringify(join(here, 'screenshots', shot.file))}
for q in (88, 84, 80, 76, 72, 68, 64, 60):
    im.save(out, quality=q)
    if os.path.getsize(out) <= 258000:
        break
print('wrote', ${JSON.stringify(shot.file)}, im.size, os.path.getsize(out), 'bytes at q', q)
`], { stdio: 'inherit' });
  }
} finally {
  server.kill('SIGTERM');
}
