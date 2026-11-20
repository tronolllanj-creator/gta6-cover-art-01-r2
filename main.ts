// NEON COAST COVER LAB — entry program for gta6-cover-art-01 (round 2).
// Hands the app in: copies app/ and screenshots/ from beside this file
// into the output directory, then writes /output/dossier.json with the
// kit's dossier builder. Runs on Node 22; outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output, e.g.
//   MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output directory: create it, then copy the two handed-in folders.
mkdirSync(outDir, { recursive: true, mode: 0o755 });
for (const folder of ['app', 'screenshots']) {
  const from = resolve(root, folder);
  if (!existsSync(from)) continue;
  cpSync(from, join(outDir, folder), { recursive: true, force: true });
}

// Refuse to hand in an empty app: the gate would fail it anyway, and a
// loud local failure beats a silent zero.
const shotCount = existsSync(join(outDir, 'screenshots'))
  ? readdirSync(join(outDir, 'screenshots')).filter((n) => !n.startsWith('.')).length
  : 0;
if (!existsSync(join(outDir, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`handed in ${shotCount} screenshots; dossier is ${dossier.length} bytes`);
