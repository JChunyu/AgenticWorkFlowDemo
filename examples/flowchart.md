# One block, from paste to card

The main path runs down the middle; the dashed branch on the right is the only exit — the fence name does not match, so the plugin never sees it. Laid out as HTML rather than drawn as a picture, the words inside the nodes stay selectable and editable.

```h5-renderer
<div class="flow">
  <style>
    .flow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(130px, 0.55fr); gap: 18px; align-items: start; }
    .flow .main { display: grid; justify-items: center; }
    .flow .node { max-width: 100%; padding: 7px 14px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-secondary); color: var(--text-normal); font-size: 0.9em; text-align: center; }
    .flow .node small { display: block; margin-top: 2px; font-size: 0.84em; color: var(--text-muted); }
    .flow .gate { background: transparent; border-style: dashed; }
    .flow .arrow { color: var(--text-faint); line-height: 0; }
    .flow .side { display: grid; gap: 6px; justify-items: start; padding-top: 26px; }
    .flow .side .cap { font-size: 0.75em; color: var(--text-muted); }
    .flow .side .node { border-style: dashed; background: transparent; color: var(--text-muted); text-align: left; }
    @media (max-width: 480px) {
      .flow { grid-template-columns: 1fr; }
      .flow .side { padding-top: 0; }
    }
  </style>
  <div class="main">
    <div class="node">Write some HTML in a note<small>wrapped in h5-renderer</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node gate">Does the fence name match?<small>lowercase h5-renderer, nothing else</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">Scrub<small>scripts, on*, remote references removed</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">Render<small>into a shadow root, inheriting the note</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">You see a card<small>same theme, same width, same type</small></div>
  </div>
  <div class="side">
    <span class="cap">or take this exit</span>
    <div class="node">Left exactly as it was<small>a plain code block, as before the plugin</small></div>
  </div>
</div>
```

The same block has three possible endings, and the second card puts them side by side: a card, source plus a notice, or a plain code block the plugin never touched.

```h5-renderer
<div class="outcomes">
  <style>
    .outcomes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .outcomes .col { padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 10px; }
    .outcomes .tag { display: inline-block; margin-bottom: 6px; font-size: 0.72em; letter-spacing: 0.04em; color: var(--text-accent); }
    .outcomes h4 { margin: 0 0 6px; font-size: 0.95em; font-weight: 600; color: var(--text-normal); }
    .outcomes p { margin: 0; font-size: 0.84em; line-height: 1.55; color: var(--text-muted); }
    @media (max-width: 520px) { .outcomes { grid-template-columns: 1fr; } }
  </style>
  <div class="col">
    <span class="tag">In budget</span>
    <h4>A card</h4>
    <p>Rendered inside 50 ms, the code block is replaced on the spot.</p>
  </div>
  <div class="col">
    <span class="tag">Over budget</span>
    <h4>Source and a notice</h4>
    <p>Past 500 ms it degrades immediately; Preview renders it once more.</p>
  </div>
  <div class="col">
    <span class="tag">Wrong fence</span>
    <h4>A plain code block</h4>
    <p>Untouched by the plugin, with not one extra console warning.</p>
  </div>
</div>
```

Only the first ending is the common one. The other two are quiet on purpose — a note should never fail loudly because a block did.
