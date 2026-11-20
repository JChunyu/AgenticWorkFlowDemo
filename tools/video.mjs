#!/usr/bin/env node
/**
 * Renders the promo video: 1920x1080, 30 fps, one PNG per frame, encoded with the
 * ffmpeg already on the machine.
 *
 *   npm run video           # both languages
 *   npm run video -- en     # one
 *
 * Every frame is a real card drawn by the plugin's own pipeline, and the timeline
 * in `tools/video/stage.js` is a pure function of time — so a re-render is exact,
 * and a change to a demo shows up in the video without editing anything here.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { demos } from './demos.mjs';
import { expandAssets } from './build-examples.mjs';
import { CACHE, ROOT, buildHarness, composePage, launch } from './lib/pipeline.mjs';
import { inline } from './lib/prose.mjs';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 31;
const OUT = path.join(ROOT, 'docs/video');

const COPY = {
  en: {
    kicker: 'Obsidian plugin',
    headline: 'Paste HTML.<br>Get a card.',
    sub: 'A block that looks like the note it sits in — same theme, same width, same type.',
    tabCaption: '<b>Three radio buttons.</b> The panel switches; nothing else moves.',
    quizCaption: '<b>A card that answers back.</b> Built from :checked, not JavaScript.',
    galleryCaption: '<b>Photos live in the note</b> as data: URLs. Nothing is fetched.',
    themeCaption: '<b>The same block, unedited,</b> in both themes.',
    promisesCaption: '<b>No script runs. Nothing is fetched.</b> The file is never written.',
    endLead: 'No scripts. No network. Your note is never written to.',
    endUrl: 'github.com/JChunyu/h5-in-article-renderer',
  },
  zh: {
    kicker: 'Obsidian 插件',
    headline: '粘进一段 HTML，<br>得到一张卡片。',
    sub: '它和所在的那篇笔记长得一样——同主题、同栏宽、同字号。',
    tabCaption: '<b>三个 radio。</b> 切的是面板，别的地方一动不动。',
    quizCaption: '<b>会回应的卡片。</b> 靠 :checked 搭出来，不靠 JavaScript。',
    galleryCaption: '<b>照片就住在笔记里，</b>以 data: URL 的形式。不发一个请求。',
    themeCaption: '<b>同一个块，一个字没改，</b>两种主题。',
    promisesCaption: '<b>不执行脚本，不联网。</b> 文件也不会被写回。',
    endLead: '没有脚本，不联网，笔记一个字都不会被改。',
    endUrl: 'github.com/JChunyu/h5-in-article-renderer',
  },
};

const STAGE_CSS = `
  html, body { margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  #canvas { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden;
    background: var(--background-primary); color: var(--text-normal); }
  .scene { position: absolute; inset: 0; padding: 84px 132px; display: grid; align-content: center; }
  .note { width: 1420px; font-size: 23px; }
  /* Tab panels differ in height; anchoring this scene to the top keeps the
     heading still while the card grows and shrinks underneath it. */
  [data-scene="tabs"] { align-content: start; padding-top: 206px; }
  /* Tab panels differ in height; anchoring this scene to the top keeps the
     heading still while the card grows and shrinks underneath it. */
  [data-scene="tabs"] { align-content: start; padding-top: 206px; }
  /* The quiz is three short questions: a full-width column would leave the
     right half of the frame empty, so it gets a narrower, larger column. */
  [data-scene="quiz"] .note { width: 1180px; font-size: 20px; }
  .note h2 { margin: 0 0 0.28em; font-size: 1.6em; font-weight: 700; letter-spacing: -0.012em; line-height: 1.2; }
  .note .lede { margin: 0 0 1.25em; font-size: 1em; line-height: 1.6; color: var(--text-muted); max-width: 1180px; }
  .caption { position: absolute; left: 132px; bottom: 76px; width: 700px; padding-top: 14px;
    border-top: 1px solid var(--background-modifier-border); font-size: 17px; line-height: 1.5; color: var(--text-muted); }
  .caption b { display: block; margin-bottom: 2px; color: var(--text-normal); font-weight: 600; }

  .scene-title { grid-template-columns: 940px minmax(0, 1fr); align-content: center; align-items: center; gap: 40px; }
  .scene-title .intro { min-width: 0; }
  .scene-title .peek { min-width: 0; }
  .kicker { margin: 0 0 26px; font-size: 15px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-accent); }
  .scene-title h1 { margin: 0 0 26px; font-size: 92px; font-weight: 700; line-height: 1.03; letter-spacing: -0.035em; }
  .scene-title .sub { margin: 0; max-width: 820px; font-size: 25px; line-height: 1.5; color: var(--text-muted); }
  .scene-title .peek { font-size: 18px; }

  .scene-end { align-content: center; justify-items: start; }
  .scene-end h2 { margin: 0 0 20px; font-size: 74px; font-weight: 700; letter-spacing: -0.03em; }
  .scene-end .lead { margin: 0 0 34px; font-size: 26px; line-height: 1.55; color: var(--text-muted); max-width: 900px; }
  .scene-end .url { padding: 10px 18px; border: 1px solid var(--background-modifier-border);
    border-radius: 999px; font-family: var(--font-monospace); font-size: 18px; color: var(--text-normal); }

  .flip { position: absolute; inset: 0; }
  /* The pane owns its own theme, so it must set the colour too: an inherited
     colour would stay dark-theme grey on a light background. */
  .flip .pane { position: absolute; inset: 0; display: grid; align-content: center; padding: 84px 132px;
    background: var(--background-primary); color: var(--text-normal); }
  #flip-dark { opacity: 0; }

  #cursor { position: absolute; left: 0; top: 0; width: 22px; height: 22px; margin: -11px 0 0 -11px;
    border-radius: 50%; border: 2px solid var(--text-normal); background: transparent; opacity: 0;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--background-primary) 55%, transparent); }
`;

const demo = (slug) => demos.find((entry) => entry.slug === slug);

async function cardMarkup(slug, index, lang) {
  const item = demo(slug);
  const html = await expandAssets(item.cards[index].html(item.copy[lang]));
  return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

async function noteBlock(slug, lang, cards = [0]) {
  const item = demo(slug);
  const markup = [];
  for (const index of cards) {
    markup.push(`<pre data-card="${await cardMarkup(slug, index, lang)}"></pre>`);
  }
  return `<div class="note"><h2>${item.title[lang]}</h2><p class="lede">${inline(item.intro[lang])}</p>${markup.join('')}</div>`;
}

async function stageHtml(lang) {
  const copy = COPY[lang];

  const content = `<div id="canvas">
    <section class="scene scene-title" data-scene="title">
      <div class="intro">
        <p class="kicker">${copy.kicker}</p>
        <h1>${copy.headline}</h1>
        <p class="sub">${copy.sub}</p>
      </div>
      <div class="peek"><pre data-card="${await cardMarkup('lamp-switch', 0, lang)}"></pre></div>
    </section>

    <section class="scene" data-scene="tabs">
      ${await noteBlock('tabs', lang)}
      <p class="caption">${copy.tabCaption}</p>
    </section>

    <section class="scene" data-scene="quiz">
      ${await noteBlock('quiz', lang)}
      <p class="caption">${copy.quizCaption}</p>
    </section>

    <section class="scene" data-scene="gallery">
      ${await noteBlock('gallery', lang)}
      <p class="caption">${copy.galleryCaption}</p>
    </section>

    <section class="scene" data-scene="themes" style="padding:0">
      <div class="flip">
        <div class="pane theme-light">
          ${await noteBlock('kpi-board', lang, [0, 1])}
          <p class="caption">${copy.themeCaption}</p>
        </div>
        <div class="pane theme-dark" id="flip-dark">
          ${await noteBlock('kpi-board', lang, [0, 1])}
          <p class="caption">${copy.themeCaption}</p>
        </div>
      </div>
    </section>

    <section class="scene" data-scene="promises">
      ${await noteBlock('promises', lang)}
      <p class="caption">${copy.promisesCaption}</p>
    </section>

    <section class="scene scene-end" data-scene="end">
      <h2>H5 Card Renderer</h2>
      <p class="lead">${copy.endLead}</p>
      <p class="url" id="end-url" style="opacity:0">${copy.endUrl}</p>
    </section>

    <div id="cursor"></div>
  </div>`;

  return composePage({
    theme: 'dark',
    lang,
    css: STAGE_CSS,
    content,
    after: await readFile(path.join(ROOT, 'tools/video/stage.js'), 'utf8'),
  });
}

async function encode(framesDir, output) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-y', '-loglevel', 'error',
      '-framerate', String(FPS),
      '-i', path.join(framesDir, '%05d.png'),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-g', '60', '-movflags', '+faststart',
      '-r', String(FPS),
      output,
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error(`ffmpeg failed with status ${result.status}`);
}

async function render(lang) {
  const frames = path.join(CACHE, `frames-${lang}`);
  await rm(frames, { recursive: true, force: true });
  await mkdir(frames, { recursive: true });

  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.setContent(await stageHtml(lang), { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
      ),
    );
  });

  const total = Math.round(DURATION * FPS);
  for (let index = 0; index < total; index += 1) {
    await page.evaluate((t) => window.__seek(t), index / FPS);
    await page.screenshot({ path: path.join(frames, `${String(index).padStart(5, '0')}.png`) });
    if (index % 90 === 0) process.stdout.write(`  ${lang} ${index}/${total}\r`);
  }

  await mkdir(OUT, { recursive: true });
  await page.evaluate((t) => window.__seek(t), 1.7);
  await page.screenshot({ path: path.join(OUT, `poster-${lang}.png`) });
  await browser.close();

  const output = path.join(OUT, `h5-card-renderer-${lang}.mp4`);
  await encode(frames, output);
  const size = (await readdir(frames)).length;
  await rm(frames, { recursive: true, force: true });
  console.info(`[video] ${path.relative(ROOT, output)} — ${size} frames`);
  return output;
}

const only = process.argv[2];
await buildHarness({ force: true });

/* `npm run video -- probe` renders a handful of stills instead of 930 frames:
 * enough to check layout and timing without waiting for an encode. */
if (only === 'probe') {
  const times = [1.6, 6.4, 8.2, 11.4, 16.2, 21.2, 25.6, 29];
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.setContent(await stageHtml('en'), { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true');
  await mkdir(path.join(CACHE, 'probe'), { recursive: true });
  for (const time of times) {
    await page.evaluate((t) => window.__seek(t), time);
    await page.screenshot({ path: path.join(CACHE, 'probe', `t${String(time).replace('.', '-')}.png`) });
  }
  const heights = await page.evaluate(() =>
    Object.fromEntries(
      Array.from(document.querySelectorAll('[data-scene]')).map((scene) => [
        scene.dataset.scene,
        Math.round(scene.querySelector('.note')?.getBoundingClientRect().height ?? 0),
      ]),
    ),
  );
  console.info('[video] note heights', heights);
  await browser.close();
  console.info(`[video] probe stills in ${path.relative(ROOT, path.join(CACHE, 'probe'))}`);
} else {
  const langs = only ? [only] : ['en', 'zh'];
  for (const lang of langs) {
    await render(lang);
  }
}
