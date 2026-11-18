import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** `.md` assets are bundled as text by esbuild; mirror that here. */
const markdownAsText = {
  name: 'markdown-as-text',
  enforce: 'pre' as const,
  load(id: string): string | null {
    if (!id.endsWith('.md')) {
      return null;
    }
    return `export default ${JSON.stringify(readFileSync(id, 'utf8'))}`;
  },
};

export default defineConfig({
  plugins: [markdownAsText],
  resolve: {
    /* The obsidian npm package ships types only ("main": ""), so the specifier is
     * unresolvable at runtime; tests run against a minimal API stub instead. */
    alias: {
      obsidian: fileURLToPath(new URL('./tests/unit/obsidian-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    /* The DOM helpers Obsidian adds to its windows (`createEl`, `instanceOf`, …). */
    setupFiles: ['tests/unit/setup-dom.ts'],
  },
});
