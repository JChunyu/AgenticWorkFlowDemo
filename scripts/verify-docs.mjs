#!/usr/bin/env node
/**
 * Release gate: the constraint card exists once, and every copy of it is in sync.
 * Exits non-zero and names the exact mismatch, so a drifted copy cannot ship.
 */
import path from 'node:path';
import process from 'node:process';
import {
  README_PATHS,
  SKILL_PATH,
  BLOCK_END,
  BLOCK_START,
  ROOT,
  readCard,
  readIfExists,
  readmeBlock,
  replaceBlock,
  skillDocument,
} from './docs-shared.mjs';

/** Markers that must appear in the built bundle when the card was imported at build time. */
const BUNDLE_MARKERS = ['1. 用代码块的 fence 名 h5-renderer', '8. 只输出这一个代码块'];

const problems = [];
const warnings = [];
const card = await readCard();

const skillOnDisk = await readIfExists(SKILL_PATH);
if (skillOnDisk === null) {
  problems.push(`missing generated file: ${path.relative(process.cwd(), SKILL_PATH)}`);
} else if (skillOnDisk !== skillDocument(card)) {
  problems.push(
    `${path.relative(process.cwd(), SKILL_PATH)} is out of date — run: node scripts/sync-docs.mjs`,
  );
}

for (const readmePath of README_PATHS) {
  const relative = path.relative(process.cwd(), readmePath);
  const current = await readIfExists(readmePath);
  if (current === null) {
    problems.push(`missing ${relative}`);
    continue;
  }
  if (!current.includes(BLOCK_START) || !current.includes(BLOCK_END)) {
    problems.push(`${relative} is missing the ${BLOCK_START} … ${BLOCK_END} markers`);
    continue;
  }
  if (replaceBlock(current, readmeBlock(card)) !== current) {
    problems.push(`${relative} has a stale constraint-card block — run: node scripts/sync-docs.mjs`);
  }
}

/* The built bundle must carry the card by build-time import, not a hand copy. */
const bundle = await readIfExists(path.join(ROOT, 'main.js'));
if (bundle === null) {
  warnings.push('main.js is absent, so the embedded constraint card was not checked — run: npm run build');
} else {
  for (const marker of BUNDLE_MARKERS) {
    if (!bundle.includes(marker)) {
      problems.push(`main.js does not embed the constraint card (missing "${marker}") — run: npm run build`);
    }
  }
}

for (const warning of warnings) {
  console.warn(`[verify-docs] warning: ${warning}`);
}

if (problems.length > 0) {
  console.error('[verify-docs] failed:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

console.info('[verify-docs] constraint card is in sync in all generated locations');
