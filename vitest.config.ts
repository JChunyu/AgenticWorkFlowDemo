import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

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
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
