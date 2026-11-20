# Four steps, and what each one costs

The rail is CSS and the dots are spans — better than a screenshot because adding a step means adding one div, and the type scales with the note.

```h5-renderer
<div class="timeline">
  <style>
    .timeline { display: grid; }
    .timeline .row { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 10px; }
    .timeline .rail { display: flex; flex-direction: column; align-items: center; }
    .timeline .dot { width: 9px; height: 9px; margin-top: 6px; border-radius: 50%; border: 1.5px solid var(--text-accent); }
    .timeline .dot.filled { background: var(--text-accent); }
    .timeline .line { flex: 1; width: 1px; margin: 3px 0; background: var(--background-modifier-border); }
    .timeline .row:last-child .line { display: none; }
    .timeline .row:last-child .body { padding-bottom: 0; }
    .timeline .body { padding-bottom: 16px; }
    .timeline .head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
    .timeline .step { font-size: 0.92em; font-weight: 600; color: var(--text-normal); }
    .timeline .badge { padding: 1px 7px; border: 1px solid var(--background-modifier-border); border-radius: 999px; font-size: 0.7em; color: var(--text-muted); }
    .timeline .desc { margin: 4px 0 0; font-size: 0.84em; line-height: 1.6; color: var(--text-muted); }
  </style>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">01 Recognise</span><span class="badge">scan, never execute</span></div>
      <p class="desc">Only a fence at the start of a line is matched, and only <code>h5-renderer</code> is taken. Other fences are not even read.</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">02 Scrub</span><span class="badge">zero network requests</span></div>
      <p class="desc">Scripts, event handlers, remote fonts and images are removed before anything reaches the shadow root; whatever was removed shows up in a notice.</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">03 Render</span><span class="badge">50 ms / 500 ms</span></div>
      <p class="desc">Rendering is synchronous and timed. Past 50 ms the block degrades to source on its next render; past 500 ms it degrades on the spot.</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">04 Rebuild</span><span class="badge">zero bytes written</span></div>
      <p class="desc">A cursor inside the block returns it to source. It is rebuilt only when the cursor is out, the block is on screen, and the text actually changed.</p>
    </div>
  </div>
</div>
```

A `code` span works inside a card too, and it picks up the theme’s monospace. To make one step stand out, fill its dot in or switch the badge to `var(--text-accent)`.
