#!/usr/bin/env node
/**
 * Writes every PNG under `docs/screenshots/`.
 *
 *   npm run shots
 *
 * Each image is a real note: the heading and prose come from `tools/demos.mjs`,
 * and the card is produced by the plugin's own `scrub` + `render` running inside
 * headless Chrome (see `tools/harness/entry.ts`). Hover states and clicks are
 * driven with a real mouse, so what is captured is what a reader sees.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { LANGS, demos } from './demos.mjs';
import { expandAssets } from './build-examples.mjs';
import { ROOT, buildHarness, composePage, launch, settle } from './lib/pipeline.mjs';
import { inline } from './lib/prose.mjs';

const OUT = path.join(ROOT, 'docs/screenshots');

const NOTE_CSS = `
  .note { width: 700px; margin: 0 auto; padding: 38px 0 46px; }
  .note h1 { margin-bottom: 0.36em; }
  .split { display: grid; grid-template-columns: 1fr 1fr; }
  .split > section { padding: 30px 26px 34px; background: var(--background-primary); color: var(--text-normal); min-width: 0; }
  .split > section + section { border-left: 1px solid var(--background-modifier-border); }
  .split > section.pane-source { background: var(--background-secondary); }
  .split .note { width: auto; max-width: 616px; margin: 0; padding: 0; }
  .split h1 { font-size: 1.36em; }
  .split p { font-size: 0.94em; }
  .source { margin: 0; font-family: var(--font-monospace); font-size: 10.6px; line-height: 1.78;
    color: var(--text-muted); white-space: pre-wrap; overflow-wrap: anywhere; }
  .source .fence { color: var(--text-faint); }
  .label { margin: 0 0 10px; font-size: 0.7em; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-faint); }
`;

const demo = (slug) => {
  const found = demos.find((entry) => entry.slug === slug);
  if (!found) throw new Error(`unknown demo: ${slug}`);
  return found;
};

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function noteBody(slug, lang, { cards = 'all', title = true, intro = true } = {}) {
  const item = demo(slug);
  const copy = item.copy[lang];
  const indexes = cards === 'all' ? item.cards.map((_, index) => index) : cards;
  const parts = [];
  if (title) parts.push(`<h1>${item.title[lang]}</h1>`);
  if (intro) parts.push(`<p>${inline(item.intro[lang])}</p>`);
  for (const index of indexes) {
    parts.push(`<pre data-card="${escapeHtml(await expandAssets(item.cards[index].html(copy)))}"></pre>`);
  }
  return parts.join('\n');
}

/** The fenced source, shown as text, with the fence lines dimmed. */
async function sourceBody(slug, index, lang) {
  const item = demo(slug);
  const card = await expandAssets(item.cards[index].html(item.copy[lang]));
  const html = ['```h5-renderer', card, '```']
    .map((line) => (line.startsWith('```') ? `<span class="fence">${escapeHtml(line)}</span>` : escapeHtml(line)))
    .join('\n');
  return `<p class="label">markdown</p><pre class="source">${html}</pre>`;
}

/** Where a node inside a card's shadow root sits on screen. */
async function shadowBox(page, cardIndex, selector) {
  return page.evaluate(
    (index, sel) => {
      const host = document.querySelectorAll('.h5r-rendered-host')[index];
      const el = host?.shadowRoot?.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    },
    cardIndex,
    selector,
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function act(page, actions = []) {
  for (const action of actions) {
    const selector = action.hover ?? action.click;
    const box = await shadowBox(page, action.card ?? 0, selector);
    if (!box) throw new Error(`not found inside card ${action.card ?? 0}: ${selector}`);
    await page.mouse.move(box.x, box.y);
    await sleep(140);
    if (action.click) {
      await page.mouse.down();
      await page.mouse.up();
      await sleep(220);
    } else {
      await sleep(280);
    }
  }
}

/* ------------------------------------------------------------------ shots */

const SHOTS = [
  // The same block, both themes, one image.
  ...LANGS.map((lang) => ({
    name: `hero-${lang}`,
    lang,
    theme: 'dark',
    width: 1320,
    build: async () => {
      const light = lang === 'en' ? 'Light theme' : '浅色主题';
      const dark = lang === 'en' ? 'Dark theme' : '深色主题';
      const card = await noteBody('tabs', lang, { title: false, intro: false });
      return `<div class="split">
        <section class="theme-light"><p class="label">${light}</p><div class="note">${card}</div></section>
        <section class="theme-dark"><p class="label">${dark}</p><div class="note">${card}</div></section>
      </div>`;
    },
  })),

  // Paste on the left, card on the right.
  ...LANGS.map((lang) => ({
    name: `source-to-card-${lang}`,
    lang,
    theme: 'dark',
    width: 1320,
    build: async () => `<div class="split">
      <section class="pane-source">${await sourceBody('kpi-board', 0, lang)}</section>
      <section>${await noteBody('kpi-board', lang, { cards: [0], title: false, intro: false })}</section>
    </div>`,
  })),

  // The interactive cards, in both themes where the theme matters.
  ...LANGS.map((lang) => ({
    name: `tabs-${lang}-dark`,
    lang,
    theme: 'dark',
    width: 860,
    actions: [{ card: 0, click: 'label[for="tab-route"]' }],
    build: async () => `<div class="note">${await noteBody('tabs', lang)}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `gallery-${lang}`,
    lang,
    theme: 'dark',
    width: 860,
    actions: [{ card: 0, hover: 'figure:nth-of-type(2) img' }],
    build: async () => `<div class="note">${await noteBody('gallery', lang)}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `quiz-${lang}`,
    lang,
    theme: 'dark',
    width: 860,
    actions: [
      { card: 0, click: 'label[for="q1-b"]' },
      { card: 0, click: 'label[for="q2-a"]' },
    ],
    build: async () => `<div class="note">${await noteBody('quiz', lang)}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `promises-${lang}`,
    lang,
    theme: 'dark',
    width: 860,
    build: async () => `<div class="note">${await noteBody('promises', lang)}</div>`,
  })),

  /* The lamp reads better in the light theme: the ON border and glow have to
   * hold up against white. */
  ...LANGS.map((lang) => ({
    name: `lamp-${lang}-light`,
    lang,
    theme: 'light',
    width: 860,
    build: async () => `<div class="note">${await noteBody('lamp-switch', lang)}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `board-${lang}-dark`,
    lang,
    theme: 'dark',
    width: 860,
    build: async () => `<div class="note">${await noteBody('kpi-board', lang, { cards: [1], title: false, intro: false })}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `timeline-${lang}-dark`,
    lang,
    theme: 'dark',
    width: 860,
    build: async () => `<div class="note">${await noteBody('timeline', lang)}</div>`,
  })),

  ...LANGS.map((lang) => ({
    name: `flow-${lang}-dark`,
    lang,
    theme: 'dark',
    width: 860,
    build: async () => `<div class="note">${await noteBody('flowchart', lang, { cards: [0] })}</div>`,
  })),

];

async function main() {
  await buildHarness({ force: true });
  await mkdir(OUT, { recursive: true });
  const browser = await launch();
  let count = 0;
  for (const shot of SHOTS) {
    const html = await composePage({ theme: shot.theme, lang: shot.lang, css: NOTE_CSS, content: await shot.build() });
    const page = await browser.newPage();
    await page.setViewport({ width: shot.width, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    await settle(page);
    await act(page, shot.actions);
    await settle(page);
    const file = path.join(OUT, `${shot.name}.png`);
    /* Clip to the content: a 900px viewport would otherwise pad every shot with
     * a band of empty background. */
    const height = await page.evaluate(() => Math.ceil(document.documentElement.getBoundingClientRect().height));
    await page.screenshot({
      path: file,
      clip: { x: 0, y: 0, width: shot.width, height },
      captureBeyondViewport: true,
    });
    await page.close();
    count += 1;
    console.info(`  ${path.relative(ROOT, file)}`);
  }
  await browser.close();
  console.info(`[shots] wrote ${count} image(s)`);
}

await main();
