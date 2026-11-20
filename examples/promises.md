# Three promises, folded up

The plugin's own rules as a card: three `details` elements, a pseudo-element arrow, and nothing in it that could run.

```h5-renderer
<div class="promises">
  <style>
    .promises { display: grid; gap: 0; border-top: 1px solid var(--background-modifier-border); }
    .promises details { border-bottom: 1px solid var(--background-modifier-border); }
    .promises summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 11px 2px; font-size: 0.94em; color: var(--text-normal); cursor: pointer; list-style: none; }
    .promises summary::-webkit-details-marker { display: none; }
    .promises summary::after { content: "›"; font-size: 1.1em; color: var(--text-faint); transition: transform 140ms ease; }
    .promises details[open] summary::after { transform: rotate(90deg); }
    .promises summary:focus-visible { outline: 2px solid var(--text-accent); outline-offset: 2px; }
    .promises p { margin: 0; padding: 0 0 13px; font-size: 0.86em; line-height: 1.65; color: var(--text-muted); }
  </style>
  <details open>
    <summary>Nothing runs</summary>
    <p><code>&lt;script&gt;</code>, <code>on*</code> handlers and <code>javascript:</code> URLs are removed before a single pixel is drawn. What is left is markup that only reacts to CSS.</p>
  </details>
  <details>
    <summary>Nothing is fetched</summary>
    <p><code>&lt;link&gt;</code>, <code>@import</code>, remote fonts, frames and every fetching attribute come out. A <code>data:</code> URL or an inline SVG is the only way to show an image — which is what makes zero network requests something you can watch in devtools.</p>
  </details>
  <details>
    <summary>Your file never changes</summary>
    <p>Open a card, keep one block as source, scroll a screenful: the markdown is byte-identical afterwards and the undo history is untouched.</p>
  </details>
</div>
```

Open one while editing and the card stays a card — a `summary` owns its own click. The arrow is a character in `content`, so there is no icon font to load.
