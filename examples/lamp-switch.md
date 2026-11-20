# A switch, two states

One card explains the difference between on and off: switch up, circuit broken; switch down, lamp lit. Both columns are the same SVG drawing, so the picture can never disagree with the text.

```h5-renderer
<div class="lamp">
  <style>
    .lamp { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .lamp .panel { display: grid; justify-items: center; gap: 6px; padding: 16px 12px; border: 1px solid var(--background-modifier-border); border-radius: 10px; }
    .lamp .panel h4 { margin: 0; font-size: 0.95em; font-weight: 600; color: var(--text-normal); }
    .lamp .panel p { margin: 0; font-size: 0.82em; line-height: 1.5; text-align: center; color: var(--text-muted); }
    .lamp .state { font-size: 0.7em; letter-spacing: 0.1em; color: var(--text-faint); }
    .lamp svg { display: block; width: 100%; max-width: 140px; height: auto; }
    .lamp .off svg { color: var(--text-faint); }
    .lamp .on { border-color: var(--text-warning); }
    .lamp .on svg { color: var(--text-warning); }
    .lamp .on .state { color: var(--text-warning); }
    @media (max-width: 420px) { .lamp { grid-template-columns: 1fr; } }
  </style>
  <div class="panel off">
    <span class="state">OFF</span>
    <svg viewBox="0 0 120 124" role="img" aria-label="Switch raised, lamp off">
      <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M42 40h36l10 30H32z"/>
        <path d="M60 70v30"/>
        <path d="M44 104h32"/>
        <circle cx="60" cy="80" r="5.5"/>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.5">
        <path d="M10 18h6"/>
        <circle cx="18" cy="18" r="2"/>
        <path d="M18 18 30 11"/>
        <circle cx="32" cy="18" r="2"/>
      </g>
    </svg>
    <h4>Switch up</h4>
    <p>The circuit is broken here; no current reaches the filament.</p>
  </div>
  <div class="panel on">
    <span class="state">ON</span>
    <svg viewBox="0 0 120 124" role="img" aria-label="Switch lowered, lamp on">
      <path d="M32 70h56l14 44H18z" fill="currentColor" opacity="0.12"/>
      <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M42 40h36l10 30H32z"/>
        <path d="M60 70v30"/>
        <path d="M44 104h32"/>
        <circle cx="60" cy="80" r="6" fill="currentColor"/>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
        <path d="M10 18h6"/>
        <circle cx="18" cy="18" r="2"/>
        <path d="M18 18h14"/>
        <circle cx="32" cy="18" r="2"/>
      </g>
    </svg>
    <h4>Switch down</h4>
    <p>The loop closes, current flows, and the lamp lights.</p>
  </div>
</div>
```

This card is plain static HTML: it looks like a switch, but it cannot be flicked. A card that reacts has to react through CSS — there is no script in here, and that is deliberate.
