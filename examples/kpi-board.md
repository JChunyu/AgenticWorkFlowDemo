# Numbers and a board

Figures line up with `tabular-nums`, so they do not shuffle as you scan down. Between cells there is nothing but CSS grid, and it reflows by itself when the column narrows.

```h5-renderer
<div class="kpi">
  <style>
    .kpi { display: grid; gap: 12px; }
    .kpi .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 10px; }
    .kpi .cell { padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 10px; }
    .kpi .num { font-size: 1.5em; font-weight: 600; line-height: 1.1; color: var(--text-normal); font-variant-numeric: tabular-nums; }
    .kpi .num em { margin-left: 3px; font-size: 0.55em; font-style: normal; font-weight: 500; color: var(--text-muted); }
    .kpi .label { margin-top: 5px; font-size: 0.78em; color: var(--text-muted); }
    .kpi .foot { margin: 0; font-size: 0.76em; color: var(--text-faint); }
  </style>
  <div class="grid">
    <div class="cell"><div class="num">0</div><div class="label">network requests</div></div>
    <div class="cell"><div class="num">0</div><div class="label">scripts executed</div></div>
    <div class="cell"><div class="num">0</div><div class="label">bytes written back</div></div>
    <div class="cell"><div class="num">50<em>ms</em></div><div class="label">render budget, per block</div></div>
  </div>
  <p class="foot">The first three are promises. The last one is a limit you can watch: cross it and the block degrades to source.</p>
</div>
```

The board is three grid columns, each with a status dot at the top. Column widths use `minmax(0, 1fr)`, so a long title wraps instead of stretching the card wider than the note.

```h5-renderer
<div class="board">
  <style>
    .board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .board .lane { display: grid; gap: 8px; align-content: start; }
    .board .lane > .title { display: flex; align-items: center; gap: 6px; font-size: 0.76em; letter-spacing: 0.04em; color: var(--text-muted); }
    .board .lane > .title .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-faint); }
    .board .lane.doing > .title .dot { background: var(--text-warning); }
    .board .lane.done > .title .dot { background: var(--text-success); }
    .board .ticket { padding: 9px 11px; border: 1px solid var(--background-modifier-border); border-radius: 8px; }
    .board .ticket b { display: block; font-size: 0.86em; font-weight: 600; color: var(--text-normal); }
    .board .ticket span { display: block; margin-top: 3px; font-size: 0.76em; color: var(--text-muted); }
    .board .lane.done .ticket b { color: var(--text-muted); }
    @media (max-width: 520px) { .board { grid-template-columns: 1fr; } }
  </style>
  <div class="lane">
    <div class="title"><span class="dot"></span>Todo</div>
    <div class="ticket"><b>Touch targets on mobile</b><span>32px minimum</span></div>
    <div class="ticket"><b>PDF page breaks</b><span>never mid-sentence</span></div>
  </div>
  <div class="lane doing">
    <div class="title"><span class="dot"></span>Doing</div>
    <div class="ticket"><b>Rebuild gate while typing</b><span>skip when the cursor is inside</span></div>
  </div>
  <div class="lane done">
    <div class="title"><span class="dot"></span>Done</div>
    <div class="ticket"><b>Card in reading view</b><span>0.1.0</span></div>
    <div class="ticket"><b>Live preview rendering</b><span>0.1.1</span></div>
  </div>
</div>
```

Two cards, one note, and neither knows the other exists: a separate shadow root each, so the class names may repeat.
