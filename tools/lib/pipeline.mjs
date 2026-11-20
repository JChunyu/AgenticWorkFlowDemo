/**
 * Shared plumbing for the docs tooling: bundle the plugin's render stages for the
 * browser, compose an Obsidian-shaped page, and drive Chrome.
 *
 * Nothing here is imported by the plugin itself — this is how `docs/` gets filled.
 */
import { existsSync } from 'node:fs';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const CACHE = path.join(ROOT, 'tools/.cache');
export const BUNDLE = path.join(CACHE, 'harness.js');
export const THEME_CSS = path.join(ROOT, 'tools/harness/theme.css');

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function chromePath() {
  for (const candidate of CHROME_PATHS) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('No Chrome found. Install Chrome, or point CHROME_PATH at a Chromium binary.');
}

/** esbuild is already a dev dependency; reuse it rather than adding a bundler. */
export async function buildHarness({ force = false } = {}) {
  const entry = path.join(ROOT, 'tools/harness/entry.ts');
  const newest = Math.max((await stat(entry)).mtimeMs, (await stat(THEME_CSS)).mtimeMs);
  if (!force && (await exists(BUNDLE)) && (await stat(BUNDLE)).mtimeMs >= newest) {
    return BUNDLE;
  }
  const esbuild = await import('esbuild');
  await mkdir(CACHE, { recursive: true });
  await esbuild.build({
    entryPoints: [entry],
    outfile: BUNDLE,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    logLevel: 'warning',
  });
  return BUNDLE;
}

export async function launch(options = {}) {
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH || chromePath(),
    headless: true,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--allow-file-access-from-files'],
    ...options,
  });
}

/**
 * A page shaped like the reading view: one column, one note, cards inline where
 * the fenced block would have been. `content` carries `<pre data-card="…">`
 * markers that the bundled pipeline replaces on load.
 */
export async function composePage({ theme = 'dark', lang = 'en', css = '', content = '', after = '' }) {
  const [themeCss, bundle] = await Promise.all([readFile(THEME_CSS, 'utf8'), readFile(BUNDLE, 'utf8')]);
  return `<!doctype html>
<html lang="${lang}" class="theme-${theme}">
<head>
<meta charset="utf-8">
<style>${themeCss}</style>
<style>${css}</style>
</head>
<body class="theme-${theme}">
${content}
<script>${bundle}</script>
<script>window.h5r.paint(document);</script>
<script>${after}</script>
</body>
</html>`;
}

/** Waits for layout to settle (fonts, images, cards painted). */
export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
      ),
    );
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

export async function writeFileSafe(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}
