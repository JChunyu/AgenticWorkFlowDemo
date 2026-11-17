#!/usr/bin/env node
/**
 * Bundles the plugin into a single `main.js` and refuses to build if the layer
 * boundaries in the architecture spine have been violated.
 */
import esbuild from 'esbuild';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const WATCH = process.argv.includes('--watch');

/** AD-2: only `src/main.ts` and `src/adapters/**` may touch the Obsidian API. */
const CORE_DIRS = ['src/core', 'src/pipeline', 'src/view'];
const OBSIDIAN_IMPORT = new RegExp(
  [
    /from\s+['"]obsidian['"]/.source,
    /require\(\s*['"]obsidian['"]\s*\)/.source,
    /import\s+['"]obsidian['"]/.source,
    /import\(\s*['"]obsidian['"]\s*\)/.source,
  ].join('|'),
);

/** AD-2 dependency direction: adapters → view → pipeline → core, never backwards. */
const LAYER_RULES = [
  { dir: 'src/core', forbidden: ['pipeline', 'view', 'adapters'] },
  { dir: 'src/pipeline', forbidden: ['view', 'adapters'] },
  { dir: 'src/view', forbidden: ['adapters'] },
];

/** AD-1: pipeline stages never import each other. */
const STAGES = ['detect', 'scrub', 'render'];

async function* walkDirectories(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkDirectories(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function assertLayerBoundaries() {
  const offenders = [];

  for (const relative of CORE_DIRS) {
    for await (const file of walkDirectories(path.join(ROOT, relative))) {
      if (!file.endsWith('.ts')) continue;
      const text = await readFile(file, 'utf8');
      if (OBSIDIAN_IMPORT.test(text)) {
        offenders.push(`${path.relative(ROOT, file)} imports 'obsidian'`);
      }
    }
  }

  for (const stage of STAGES) {
    const stageDir = path.join(ROOT, 'src/pipeline', stage);
    const forbiddenStages = STAGES.filter((other) => other !== stage).map(
      (other) => new RegExp(`from\\s+['"][^'"]*pipeline/${other}`),
    );
    for await (const file of walkDirectories(stageDir)) {
      if (!file.endsWith('.ts')) continue;
      const text = await readFile(file, 'utf8');
      for (const pattern of forbiddenStages) {
        if (pattern.test(text)) {
          offenders.push(`${path.relative(ROOT, file)} imports a sibling pipeline stage`);
          break;
        }
      }
    }
  }

  for (const rule of LAYER_RULES) {
    const patterns = rule.forbidden.map((layer) => new RegExp(`from\\s+['"][^'"]*/${layer}/`));
    for await (const file of walkDirectories(path.join(ROOT, rule.dir))) {
      if (!file.endsWith('.ts')) continue;
      const text = await readFile(file, 'utf8');
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          offenders.push(`${path.relative(ROOT, file)} imports a layer above ${rule.dir}`);
          break;
        }
      }
    }
  }

  if (offenders.length > 0) {
    console.error('[build] layer boundary violated:');
    for (const offender of offenders) {
      console.error(`  - ${offender}`);
    }
    process.exit(1);
  }
}

const options = {
  entryPoints: [path.join(ROOT, 'src/main.ts')],
  outfile: path.join(ROOT, 'main.js'),
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2018',
  platform: 'browser',
  charset: 'utf8',
  loader: { '.md': 'text' },
  logLevel: 'info',
  sourcemap: WATCH ? 'inline' : false,
};

await assertLayerBoundaries();

if (WATCH) {
  const context = await esbuild.context(options);
  await context.watch();
  console.info('[build] watching…');
} else {
  await esbuild.build(options);
  console.info('[build] main.js written');
}
