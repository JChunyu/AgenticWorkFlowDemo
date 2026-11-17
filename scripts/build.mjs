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

/** AD-16: CodeMirror is reached only through the one editor adapter. */
const CODEMIRROR_IMPORT = new RegExp(
  [
    /from\s+['"]@codemirror\//.source,
    /require\(\s*['"]@codemirror\//.source,
    /import\s+['"]@codemirror\//.source,
    /import\(\s*['"]@codemirror\//.source,
  ].join('|'),
);
const EDITOR_ADAPTER = 'src/adapters/editor-ext.ts';

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

  /*
   * AD-16 is a runtime promise — `view/` and `pipeline/` never learn CodeMirror
   * exists — and until now only prose enforced it. A type-only import leaks just as
   * badly as a value import, so the pattern covers both shapes.
   */
  for await (const file of walkDirectories(path.join(ROOT, 'src'))) {
    if (!file.endsWith('.ts')) continue;
    const relative = path.relative(ROOT, file);
    /* `path.relative` uses `\` on Windows: compare on POSIX separators. */
    if (relative.split(path.sep).join('/') === EDITOR_ADAPTER) continue;
    const text = await readFile(file, 'utf8');
    if (CODEMIRROR_IMPORT.test(text)) {
      offenders.push(`${relative} imports @codemirror (AD-16: only ${EDITOR_ADAPTER} may)`);
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
  /*
   * CodeMirror ships inside Obsidian and is taken from the host at runtime
   * (AD-2 / AD-16). `external` guarantees no copy of it can ever be bundled next to
   * the host's, and the adapter loads it lazily so the export-shape probe below can
   * still require the bundle in plain Node. The two imports are type-only today, so
   * nothing resolves at build time either way — the entry is the belt to that brace.
   */
  external: ['obsidian', '@codemirror/*'],
  format: 'cjs',
  target: 'es2018',
  platform: 'browser',
  charset: 'utf8',
  loader: { '.md': 'text' },
  logLevel: 'info',
  sourcemap: WATCH ? 'inline' : false,
  /*
   * Obsidian instantiates whatever `module.exports` is. esbuild's CJS output would
   * hand over `{ default: Plugin }`, which older Obsidian builds do not unwrap — the
   * plugin then installs silently and never appears. Export the class itself and keep
   * `default` pointing at it, so either loader shape works.
   */
  footer: {
    js: 'module.exports = module.exports.default;\nmodule.exports.default = module.exports;',
  },
};

/** Obsidian's API surface, stubbed so the bundle can be loaded outside Obsidian. */
const OBSIDIAN_STUB = `const stub = new Proxy(function () {}, {
  get: (_target, key) => (key === '__esModule' ? false : stub),
  construct: () => stub,
  apply: () => stub,
});
module.exports = stub;`;

/**
 * `external` is a promise the bundle has to keep: the host's CodeMirror must be
 * required at runtime, and no copy of it may be inlined next to the host's.
 */
async function assertHostModulesExternal() {
  const fsPromises = await import('node:fs/promises');
  const bundle = await fsPromises.readFile(options.outfile, 'utf8');

  for (const specifier of ['@codemirror/view', '@codemirror/state']) {
    if (!bundle.includes(`"${specifier}"`)) {
      console.error(`[build] ${specifier} is not required at runtime any more`);
      process.exit(1);
    }
  }

  /* A string that only exists inside @codemirror/view: its presence means a copy was bundled. */
  if (bundle.includes('Block decorations may not be specified via plugins')) {
    console.error('[build] @codemirror/view was inlined; it must come from the host');
    process.exit(1);
  }

  console.info('[build] host modules ok: CodeMirror is required, not bundled');
}

async function assertExportShape() {
  const { createRequire } = await import('node:module');
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');

  const sandbox = await mkdtemp(path.join(tmpdir(), 'h5r-load-'));
  const stubDir = path.join(sandbox, 'node_modules', 'obsidian');
  /* `.cjs` keeps Node from re-reading this package's `"type": "module"` during the probe. */
  const bundleCopy = path.join(sandbox, 'plugin.cjs');
  try {
    const fsPromises = await import('node:fs/promises');
    await fsPromises.mkdir(stubDir, { recursive: true });
    await writeFile(path.join(stubDir, 'index.js'), OBSIDIAN_STUB, 'utf8');
    await fsPromises.copyFile(options.outfile, bundleCopy);

    const probe = path.join(sandbox, 'probe.cjs');
    await writeFile(
      probe,
      `const loaded = require(${JSON.stringify(bundleCopy)});
if (typeof loaded !== 'function') {
  console.error('[build] module.exports is ' + typeof loaded + ', Obsidian cannot instantiate it');
  process.exit(1);
}
if (loaded.default !== loaded) {
  console.error('[build] module.exports.default does not point back at the plugin class');
  process.exit(1);
}
console.log('[build] export shape ok: module.exports is a plugin class');
`,
      'utf8',
    );

    const { execFile } = await import('node:child_process');
    await new Promise((resolve, reject) => {
      execFile(process.execPath, [probe], { env: { ...process.env, NODE_PATH: path.join(sandbox, 'node_modules') } }, (error, stdout, stderr) => {
        if (error) {
          console.error(stderr.trim() || error.message);
          reject(new Error('bundle cannot be loaded the way Obsidian loads it'));
          return;
        }
        console.info(stdout.trim());
        resolve(undefined);
      });
    });
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}

await assertLayerBoundaries();

if (WATCH) {
  const context = await esbuild.context(options);
  await context.watch();
  console.info('[build] watching…');
} else {
  await esbuild.build(options);
  await assertHostModulesExternal();
  await assertExportShape();
  console.info('[build] main.js written');
}
