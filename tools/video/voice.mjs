#!/usr/bin/env node
/**
 * Builds the spoken track for the promo video and muxes it into the mp4.
 *
 *   npm run voice           # both languages
 *   npm run voice -- zh     # one
 *   npm run voice -- check  # measure the lines, do not touch the video
 *
 * The voice is the system speech synthesiser — no sample library, no network —
 * so the track can be rebuilt on any Mac with the same result. Every line is
 * measured against its window in `copy.mjs`; a line that does not fit is an
 * error, because a promo whose narration trails into the next scene reads as a
 * mistake, not as a style.
 *
 * Video is copied, never re-encoded: the frames are already right, and only the
 * audio is new.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE, ROOT } from '../lib/pipeline.mjs';
import { DURATION, SCRIPT } from './copy.mjs';

const OUT = path.join(ROOT, 'docs/video');
const WORK = path.join(CACHE, 'vo');

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
};

const duration = (file) =>
  Number(
    run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim(),
  );

async function measure(lang) {
  const dir = path.join(WORK, lang);
  await mkdir(dir, { recursive: true });
  const lines = [];
  for (const [index, line] of SCRIPT[lang].lines.entries()) {
    const file = path.join(dir, `${index}.aiff`);
    run('say', ['-v', SCRIPT[lang].voice, '-r', String(SCRIPT[lang].rate), '-o', file, line.text]);
    lines.push({ ...line, file, length: duration(file) });
  }
  return lines;
}

function report(lang, lines) {
  let bad = 0;
  for (const line of lines) {
    const budget = line.to - line.from;
    const over = line.length - budget;
    if (over > 0) bad += 1;
    const status = over > 0 ? `OVER by ${over.toFixed(2)}s` : `ok (${(budget - line.length).toFixed(2)}s spare)`;
    console.info(
      `[voice] ${lang} ${line.scene.padEnd(9)} ${line.length.toFixed(2)}s / ${budget.toFixed(2)}s  ${status}`,
    );
  }
  return bad;
}

/** One track, gaps included, exactly as long as the film. */
async function track(lang, lines) {
  await mkdir(WORK, { recursive: true });
  const args = ['-y', '-loglevel', 'error'];
  const parts = [];
  let cursor = 0;

  const silence = (seconds) => {
    if (seconds < 0.01) return;
    args.push('-f', 'lavfi', '-t', seconds.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo');
    parts.push({ kind: 'silence', index: parts.length, seconds });
  };

  for (const line of lines) {
    silence(line.from - cursor);
    args.push('-i', line.file);
    parts.push({ kind: 'line', index: parts.length });
    cursor = line.from + line.length;
  }
  silence(DURATION - cursor);

  const filters = [];
  const labels = [];
  for (const part of parts) {
    const label = `${part.kind === 'line' ? 's' : 'g'}${part.index}`;
    filters.push(
      part.kind === 'line'
        ? `[${part.index}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,` +
            `highpass=f=85,asetpts=N/SR/TB[${label}]`
        : `[${part.index}:a]atrim=duration=${part.seconds.toFixed(3)},asetpts=N/SR/TB[${label}]`,
    );
    labels.push(`[${label}]`);
  }

  filters.push(
    `${labels.join('')}concat=n=${labels.length}:v=0:a=1,` +
      `apad=whole_dur=${DURATION},` +
      `loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]`,
  );

  const file = path.join(WORK, `vo-${lang}.m4a`);
  run('ffmpeg', [
    ...args,
    '-filter_complex', filters.join(';'),
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', String(DURATION),
    file,
  ]);
  return file;
}

/** Adds (or replaces) the audio on an already-rendered mp4. */
export async function addVoiceover(video, lang) {
  const lines = await measure(lang);
  if (report(lang, lines) > 0) {
    throw new Error(`[voice] ${lang}: a line overruns its window in tools/video/copy.mjs`);
  }
  const audio = await track(lang, lines);
  const temp = video.replace(/\.mp4$/, '.voiced.mp4');
  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', video, '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart',
    temp,
  ]);
  await rm(video, { force: true });
  await rename(temp, video);
  console.info(`[voice] ${path.relative(ROOT, video)} — ${lines.length} lines, ${DURATION}s`);
  return video;
}

/** Fails the build when a line no longer fits its window. */
export async function checkVoice(lang) {
  return report(lang, await measure(lang)) === 0;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const flag = process.argv[2];
  const only = flag === 'check' ? process.argv[3] : flag;
  const langs = only ? [only] : ['en', 'zh'];

  if (flag === 'check') {
    let ok = true;
    for (const code of langs) ok = (await checkVoice(code)) && ok;
    if (!ok) process.exit(1);
  } else {
    for (const code of langs) {
      await addVoiceover(path.join(OUT, `h5-card-renderer-${code}.mp4`), code);
    }
  }
}
