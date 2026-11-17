#!/usr/bin/env node
/**
 * Generates every derivative of `src/constraint-card.md`: the repo `SKILL.md` and the
 * constraint-card block inside both READMEs. Idempotent — running it twice changes
 * nothing the second time.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  README_PATHS,
  SKILL_PATH,
  BLOCK_END,
  BLOCK_START,
  readCard,
  readIfExists,
  readmeBlock,
  replaceBlock,
  skillDocument,
} from './docs-shared.mjs';

const card = await readCard();
const block = readmeBlock(card);

/* Validate every target first: a half-synced tree is worse than no sync at all. */
const readmeUpdates = [];
for (const readmePath of README_PATHS) {
  const current = await readIfExists(readmePath);
  if (current === null) {
    console.warn(`[sync-docs] skipped missing ${path.relative(process.cwd(), readmePath)}`);
    continue;
  }
  const next = replaceBlock(current, block);
  if (next === null) {
    console.error(
      `[sync-docs] ${path.relative(process.cwd(), readmePath)} is missing the ` +
        `${BLOCK_START} … ${BLOCK_END} markers — nothing was written`,
    );
    process.exit(1);
  }
  if (next !== current) {
    readmeUpdates.push({ readmePath, next });
  }
}

let changed = 0;

await mkdir(path.dirname(SKILL_PATH), { recursive: true });
const skill = skillDocument(card);
if ((await readIfExists(SKILL_PATH)) !== skill) {
  await writeFile(SKILL_PATH, skill, 'utf8');
  changed += 1;
  console.info(`[sync-docs] wrote ${path.relative(process.cwd(), SKILL_PATH)}`);
}

for (const { readmePath, next } of readmeUpdates) {
  await writeFile(readmePath, next, 'utf8');
  changed += 1;
  console.info(`[sync-docs] updated ${path.relative(process.cwd(), readmePath)}`);
}

console.info(changed === 0 ? '[sync-docs] already in sync' : `[sync-docs] ${changed} file(s) updated`);
