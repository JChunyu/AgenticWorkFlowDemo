#!/usr/bin/env node
/**
 * Writes `examples/*.md` (English) and `examples/zh/*.md` (Chinese) from
 * `tools/demos.mjs`, inlining `{{img:name}}` as `data:` URLs.
 *
 *   npm run examples
 *
 * The two languages are generated from one source on purpose: the note, its
 * screenshot and its translation can never describe different cards.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { LANGS, demos } from './demos.mjs';
import { ROOT } from './lib/pipeline.mjs';

const IMAGES = path.join(ROOT, 'tools/assets/img');
const uriCache = new Map();

async function dataUri(name) {
  if (!uriCache.has(name)) {
    const bytes = await readFile(path.join(IMAGES, `${name}.webp`));
    uriCache.set(name, `data:image/webp;base64,${bytes.toString('base64')}`);
  }
  return uriCache.get(name);
}

/** Exported so the screenshot and video tooling expand the same markup. */
export async function expandAssets(html) {
  const names = [...html.matchAll(/\{\{img:([\w-]+)\}\}/g)].map((match) => match[1]);
  let out = html;
  for (const name of new Set(names)) {
    out = out.split(`{{img:${name}}}`).join(await dataUri(name));
  }
  return out;
}

export async function buildNote(demo, lang) {
  const copy = demo.copy[lang];
  const between = demo.between?.[lang];
  const parts = [`# ${demo.title[lang]}`, '', demo.intro[lang]];

  for (const [index, card] of demo.cards.entries()) {
    if (index > 0 && between) {
      parts.push('', between);
    }
    parts.push('', '```h5-renderer', await expandAssets(card.html(copy)), '```');
  }

  parts.push('', demo.outro[lang], '');
  return parts.join('\n');
}

export async function buildAll({ silent = false } = {}) {
  const written = [];
  for (const demo of demos) {
    for (const lang of LANGS) {
      const dir = lang === 'en' ? path.join(ROOT, 'examples') : path.join(ROOT, 'examples', lang);
      const file = path.join(dir, `${demo.slug}.md`);
      await mkdir(dir, { recursive: true });
      await writeFile(file, await buildNote(demo, lang), 'utf8');
      written.push(path.relative(ROOT, file));
    }
  }
  if (!silent) {
    console.info(`[examples] wrote ${written.length} note(s)`);
    for (const file of written) console.info(`  ${file}`);
  }
  return written;
}

if (process.argv[1] && process.argv[1].endsWith('build-examples.mjs')) {
  await buildAll();
}
