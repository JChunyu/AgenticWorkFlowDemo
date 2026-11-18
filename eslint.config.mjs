import obsidianmd from 'eslint-plugin-obsidianmd';

/**
 * Obsidian's community-plugin review runs this rule set (its own `obsidianmd/*`
 * rules plus type-aware TypeScript, `no-unsanitized` and the SDL DOM rules), so
 * running it here is the same gate, earlier. Two exclusions:
 *
 *   - `main.js` is the build artifact, never edited;
 *   - `tests/` runs in a bare DOM without Obsidian's helpers or `styles.css`, so the
 *     rules that describe the app — not the tests — would only produce noise there.
 */
export default [
  { ignores: ['main.js', 'tests/**', 'examples/**'] },
  ...obsidianmd.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
