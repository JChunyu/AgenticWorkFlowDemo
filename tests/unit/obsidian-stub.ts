/**
 * Runtime stand-ins for the obsidian API surface the adapters touch in tests: the
 * npm package ships type definitions only (`"main": ""`), so vitest resolves the
 * `obsidian` specifier here. Constructors stay inert — the tests exercise plugin
 * logic, not Obsidian's own classes. Tests may still override a single export with
 * `vi.mock('obsidian', …)` when they need a behavior of their own.
 */
export class App {}
export class Plugin {}
export class PluginSettingTab {
  containerEl = document.createElement('div');
}
export class Setting {}
export class MarkdownView {}
export class TFile {}
export class Notice {
  constructor(_message?: string) {}
}
export function getLanguage(): string {
  return 'en';
}
