# Three cards

All three cards below are laid out in HTML. Mermaid stops at flowcharts, sequence diagrams and gantt charts — side-by-side comparison, feature matrices and free-form layout are out of its reach.

## Comparison

This card is HTML layout: three equal columns separated by hairline rules. Mermaid cannot do it.

```h5-renderer
<div class="compare">
  <style>
    .compare { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .compare .col { padding: 0 16px; border-left: 1px solid var(--background-modifier-border); }
    .compare .col:first-child { padding-left: 0; border-left: none; }
    .compare h3 { margin: 0 0 8px; font-size: 1.05em; font-weight: 600; color: var(--text-normal); }
    .compare p { margin: 0; line-height: 1.6; color: var(--text-muted); }
    .compare .tag { display: inline-block; margin-bottom: 8px; font-size: 0.85em; color: var(--text-accent); }
    @media (max-width: 360px) {
      .compare { grid-template-columns: 1fr; }
      .compare .col { padding: 0 0 16px; border-left: none; }
    }
  </style>
  <div class="col">
    <span class="tag">Option A</span>
    <h3>Screenshot</h3>
    <p>Paste and move on, but the text is frozen, the theme never follows, and your note turns into an image store.</p>
  </div>
  <div class="col">
    <span class="tag">Option B</span>
    <h3>Mermaid</h3>
    <p>Great for flows, but its grammar only covers processes and sequences — not comparison or free layout.</p>
  </div>
  <div class="col">
    <span class="tag">Option C</span>
    <h3>This block</h3>
    <p>Plain HTML that follows your theme, where changing a line is just changing a line.</p>
  </div>
</div>
```

## Feature matrix

A table with inline SVG ticks — dense information that still reads.

```h5-renderer
<div class="matrix">
  <style>
    .matrix { width: 100%; border-collapse: collapse; }
    .matrix th, .matrix td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--background-modifier-border); }
    .matrix thead th { background: var(--background-secondary); font-weight: 600; color: var(--text-normal); }
    .matrix tbody tr:nth-child(even) { background: var(--background-secondary); }
    .matrix td { color: var(--text-muted); }
    .matrix .mark { color: var(--text-normal); }
    .matrix svg { vertical-align: -2px; }
  </style>
  <table>
    <thead>
      <tr><th>Capability</th><th>Screenshot</th><th>Mermaid</th><th>This block</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="mark">Follows the theme</td>
        <td>No</td><td>Yes</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">Edit one word</td>
        <td>Redo the image</td><td>Edit the syntax</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">Side-by-side layout</td>
        <td>Yes</td><td>No</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">Regenerable content</td>
        <td>No</td><td>Yes</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
    </tbody>
  </table>
</div>
```

## Flow

Stroke-only nodes and 1.5px arrows — lighter than Mermaid's defaults.

```h5-renderer
<div class="flow">
  <style>
    .flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .flow .node { padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; color: var(--text-normal); }
    .flow .node small { display: block; color: var(--text-muted); }
    .flow .arrow { flex: 0 0 auto; color: var(--text-muted); }
    .flow svg { display: block; }
  </style>
  <div class="node">Write some HTML<small>paste it into a note</small></div>
  <span class="arrow"><svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5H34" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M33 1.5 38 5l-5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <div class="node">Switch to reading view<small>the plugin takes over</small></div>
  <span class="arrow"><svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5H34" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M33 1.5 38 5l-5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <div class="node">See the card<small>in your note's theme</small></div>
</div>
```

Want to write your own? Run "Copy AI instructions" from the command palette and paste it into any AI.
