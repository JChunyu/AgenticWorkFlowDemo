# h5-in-article-renderer

Paste an AI-written HTML block into an Obsidian note and see it as a card that looks like
part of the note: same theme, same width, same typography — while you write, and in reading
view. Chinese version: [README.zh-CN.md](README.zh-CN.md).

**What this plugin never does:**

1. **It does not execute scripts.** `<script>`, `on*` handlers and `javascript:` URLs are removed before anything is displayed.
2. **It never goes online.** `<link>`, `@import`, remote fonts, CDN scripts, `<iframe>`/`<object>`/`<embed>`, non-`data:` CSS `url()` and every resource attribute that would fetch something (`src`, `srcset`, `poster`, `xlink:href`) are stripped, so a block renders with zero network requests. Plain hyperlinks (`<a href="https://…">`) stay: they only act when you click them.
3. **It never writes back to your notes.** Your Markdown file is byte-identical before and after; only what you see changes. Opening a card, keeping it as source, scrolling a screen of them — none of it touches the file or your undo history. (The *Insert sample note* command creates a new note when you ask for it, and your four preferences live in the plugin's own `data.json` — neither touches the note you are reading.)
4. **It recognizes exactly one fence: `h5-renderer`.** ```` ```html ```` and every other fence render exactly as they did before you installed the plugin — same code, same attributes, no console warnings. One deliberate exception: the first time you open a note containing a plain ```` ```html ```` block, a one-time inline hint at the top of the note points out the right fence. It never appears again after that.

**Correct:**

````markdown
```h5-renderer
<div class="card">
  <style>
    .card { display: grid; gap: 12px; color: var(--text-normal); }
  </style>
  <h3>Title</h3>
  <p>Body</p>
</div>
```
````

**Wrong** (renders as a plain code block, and that is intentional):

````markdown
```html
<div class="card"><h3>Title</h3></div>
```
````

**Preview while editing, and in reading view.** The card is there while you type: click it
and it opens as editable source at the line you clicked; click anywhere else and the card
comes back. In reading view the top-right toggle keeps one block as source for as long as
you like. Both behaviours are view state only — the file never changes. A card turns back
into source the moment your cursor sits inside its block, so typing is never interrupted.
Cards appear in print and in exported PDF too.

## Install

- **BRAT**: add this repository as a beta plugin, enable it, then enable *h5-in-article-renderer* in Community plugins.
- **Manual**: create `<vault>/.obsidian/plugins/h5-in-article-renderer/` and copy `main.js`, `manifest.json`, `styles.css` into it, then reload Obsidian and enable the plugin.

Requires Obsidian `1.12.7` or newer, on desktop. Mobile is not tested in v1, but nothing
here is designed to break there.

## Use

1. Run **Insert sample note** from the command palette to get a three-card example.
2. Run **Copy AI instructions** and paste it into any AI before asking for a card.
3. Paste the block it returns into a note — the card appears where you were typing, no view switch needed.
4. Click a card to open its source at the spot you clicked; click elsewhere to get the card back. In reading view, hover a card to reveal its toggle and click it to keep that block as source until you click again. No choice is ever written to disk.

The settings page has exactly four settings: enable rendering, default state for new
blocks (a choice between *Rendered* and *Source*), show the toggle button, show error
hints. Changes apply to notes that are already open, without a reload.

## Tutorial: one block, from paste to card

**1. Look at a finished one.** Run *Insert sample note* from the command palette. It creates
a note with three rendered cards — a three-column comparison, a feature matrix, and a flow
built from divs with inline SVG arrows. Open it in editing mode and click a card: it opens as source at the
line you clicked. Click anywhere else and the card comes back. The file itself never
changes.

**2. Write your own.** In any note, type a fence named `h5-renderer` and put HTML in it:

````markdown
```h5-renderer
<section class="status">
  <style>
    .status { display: grid; gap: 8px; color: var(--text-normal); }
    .status h3 { margin: 0; font-size: 1.05em; }
  </style>
  <h3>Weekly status</h3>
  <p>Three items shipped, one waiting on review.</p>
</section>
```
````

Move the cursor out of the block — press `Enter` after the closing fence — and the card
appears in place.

**3. If it stays a code block.** Check these in order:

- the fence is exactly `h5-renderer`: lowercase, with the hyphen. `html` never renders, and that is deliberate;
- the fence sits at the start of its line, indented less than four spaces, and is not inside a blockquote or a callout;
- both fences are present — an unclosed block is not a block.

**4. Edit it.** Click the card and you land inside the source at the line you clicked. Type.
Click outside and the card returns. While the cursor is inside the block the card stays
away, so nothing ever rebuilds under your cursor.

**5. Ask an AI for one.** Run *Copy AI instructions*, paste it into any model, then add your
request. Paste the answer into a note and it appears as a card. Rule 4 in that text is the
one that decides whether two cards on the same page collide: one wrapper class, no
selectors on `body`, `html`, `*` or `:root`.

**6. Keep a block open while you read.** In reading view, hover a card and click its
top-right toggle: that block stays source until you click again. The choice lives in the
view, so reopening the note starts from *Rendered* again (or from *Source*, if that is what
your settings say).

## Performance and degradation

Rendering is synchronous, and each block is measured against two fixed budgets: over
**50 ms** the block still finishes that render but degrades to its source on the next one;
over **500 ms** it degrades immediately. A degraded block shows its source plus a notice;
clicking **Preview** re-renders it once, bypassing the budget. The two constants are not
configurable, and there is no loading state by design.

The same budgets apply in the editor, with one addition that keeps typing smooth: a block is
only rebuilt when your cursor is outside it, it is at least partly on screen, and its text
actually changed. Blocks you scroll past release their output and rebuild when you come back.

## Data and privacy

There is no telemetry, no analytics and no network access. The plugin stores exactly two
kinds of data, both inside your vault:

- `.obsidian/plugins/h5-in-article-renderer/data.json` — your four settings plus three
  local flags (onboarding seen, sample note offered, sample note declined).
- Nothing else. Block state (card / source / kept as source) lives only in memory for the
  lifetime of the open view, and the editor and reading view keep separate state — opening a
  card in one never changes the other.

Removing the plugin directory deletes all of it.

## The AI constraint card

The card below is generated from `src/constraint-card.md` by `scripts/sync-docs.mjs`.
Do not edit it here — `scripts/verify-docs.mjs` fails the release if the copies drift.
The card is written in Chinese on purpose: it is an instruction to a model, and one
canonical wording is easier to keep consistent than two. If you want to read it before
sending it, rule 1 through rule 8 are short and self-contained.

<!-- constraint-card:start -->
````text
当你要为 Obsidian 笔记生成一段"可视展示块"时，请遵守以下约定：

1. 用代码块的 fence 名 h5-renderer，不要用 html：
   ```h5-renderer
   <div>...</div>
   ```

2. 只写静态内容：div / span / table / svg / style。
   不要写 <script>、不要写 on* 事件属性、不要写 javascript: 链接。

3. 不引用任何外部资源：不写 <link>、@import、远程字体、CDN 脚本、外部图片 URL。
   需要图形请用内联 <svg>。

4. 样式集中在一个 <style> 里，选择器收敛：
   不要把规则写到 body / html / * / :root 上；
   所有规则用一个统一的顶层容器类包裹（例如 .card），避免与其他块冲突。

5. 不写死尺寸：宽度用 100% 或 max-width，不要用 1200px 之类固定像素；
   高度同理，避免超出笔记栏或产生滚动条。

6. 颜色优先使用 Obsidian 的 CSS 变量，以便自动跟随浅色/深色主题：
   var(--text-normal)、var(--text-muted)、var(--background-primary)、
   var(--background-secondary)、var(--text-accent)、var(--background-modifier-border)。
   最外层容器不要设置不透明背景，保持透明以融入笔记。

7. 简单优先：优先用 flex / grid 做稳健布局，不追求炫技；
   单块代码尽量控制在 150 行以内。

8. 只输出这一个代码块，不要额外解释。
````
<!-- constraint-card:end -->

## Accessibility

Toggles are reachable with `Tab` and fire on `Enter`/`Space`, carry a localized
`aria-label`, and use the theme's own focus ring — the editor's toggle is the same control,
reached the same way. Notices are `role="status"` with `aria-live="polite"` (`assertive`
only when a block fails), are focusable so `Escape` can close them, and never steal focus.
There are no positive `tabindex` values, no focus traps and no custom keyboard shortcuts, and
opening or closing a card never moves focus.

The interface ships in Chinese and English only; other interface languages fall back to
English. Rendered cards live in a shadow root, so how a screen reader traverses their
content depends on the browser and theme.

The accessibility of the *card's own content* is determined by the HTML an AI wrote. The
plugin does not repair it, and cannot promise it.

## Troubleshooting

- **My block shows as a plain code block.** The fence must be exactly `h5-renderer`, lowercase, with the hyphen. `html`, `h5` and `H5-Renderer` are not recognized.
- **My block turns back into source while I type in it.** Expected: a card opens into source whenever your cursor is inside the block, so nothing rebuilds under your cursor. Move the cursor out and the card returns.
- **A block inside a callout or an indented list stays a code block in the editor.** Those positions fall back to plain code blocks when the editor cannot render them reliably; the same block still renders in reading view.
- **A card suddenly shows its source with a notice.** It exceeded the render budget; click *Preview* to render it once more, or split the card.
- **Images inside a card are missing.** Remote images are stripped so the zero-network promise holds. Inline them as `data:` URLs or use inline `<svg>`.
- **A notice says scripts were removed.** The block contained `<script>`, `on*` handlers or remote references; the rest of the card still renders.
- **I want the plugin to disappear.** Turn off *Enable rendering*: every block returns to a plain code block with no toggle, no notice and no host element left behind.

## Roadmap

- Editing-time (Live Preview) rendering: shipped in `0.1.1`, no longer a roadmap item.
- Mobile-specific adaptation: not scheduled; nothing in the design precludes it.

## Versioning

Versions follow semantic versioning. `manifest.json` is the single source of truth;
`versions.json` maps each release to the `minAppVersion` it was built against, and
`npm run verify-docs` fails unless `manifest.version`, `package.json.version` and the
`versions.json` entry agree (the git tag is checked by the release itself).

Breaking changes are limited to two kinds, and each ships with migration steps in the
generated release notes: renaming the recognized fence, and changing or removing a
setting. Nothing else in the public surface is intended to break within a major version.

## Before publishing a fork

`manifest.json` carries publisher identity that only a maintainer can supply. Replace
`author`, `authorUrl` and `id` (after checking the id is unique in the community
directory) before you ship your own build.

## License

MIT — see [LICENSE](LICENSE).
