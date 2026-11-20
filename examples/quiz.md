# A card you can answer

Three questions about this plugin, answerable in reading view. Every answer is a radio button; the tick, the cross and the explanation are sibling selectors. No score is kept, because keeping score would need a script.

```h5-renderer
<div class="quiz">
  <style>
    .quiz { display: grid; gap: 18px; }
    .quiz .q { display: grid; gap: 7px; }
    .quiz .q > p { margin: 0 0 2px; font-size: 0.94em; line-height: 1.55; color: var(--text-normal); }
    .quiz .opt { display: grid; }
    .quiz input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; }
    .quiz label { display: grid; grid-template-columns: 1.4em minmax(0, 1fr); gap: 6px; padding: 6px 8px; border: 1px solid transparent; border-radius: 7px; font-size: 0.86em; line-height: 1.5; color: var(--text-muted); cursor: pointer; }
    .quiz label::before { content: ""; justify-self: center; width: 0.62em; height: 0.62em; margin-top: 0.42em; border: 1.4px solid var(--text-faint); border-radius: 50%; }
    .quiz label:hover { background: var(--background-modifier-hover); }
    .quiz input:focus-visible + label { outline: 2px solid var(--text-accent); outline-offset: 1px; }
    .quiz input:checked + label { border-color: var(--background-modifier-border); color: var(--text-normal); }
    .quiz input:checked + label::before { border-color: var(--text-accent); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-accent); }
    .quiz .right input:checked + label { border-color: var(--text-success); color: var(--text-success); }
    .quiz .right input:checked + label::before { border-color: var(--text-success); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-success); }
    .quiz .wrong input:checked + label { border-color: var(--text-error); color: var(--text-error); }
    .quiz .wrong input:checked + label::before { border-color: var(--text-error); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-error); }
    .quiz .why { margin: 0; padding: 0 0 0 1.9em; font-size: 0.82em; line-height: 1.6; color: var(--text-muted); display: none; }
    .quiz .q:has(input:checked) .why { display: block; }
  </style>
  <div class="q">
    <p>1. A block is fenced as <code>html</code> instead. What do you see?</p>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-a"><label for="q1-a">A card — the fence name is a formality</label></div>
    <div class="opt right"><input type="radio" name="fence" id="q1-b"><label for="q1-b">A plain code block</label></div>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-c"><label for="q1-c">A card, after a warning</label></div>
    <p class="why">Only <code>h5-renderer</code> is recognised. Every other fence renders exactly as it did before the plugin was installed — and one time only, a hint points at the right fence.</p>
  </div>
  <div class="q">
    <p>2. A card contains an <code>img</code> whose source is an https:// URL. What happens?</p>
    <div class="opt wrong"><input type="radio" name="image" id="q2-a"><label for="q2-a">The photo loads normally</label></div>
    <div class="opt wrong"><input type="radio" name="image" id="q2-b"><label for="q2-b">A broken-image icon</label></div>
    <div class="opt right"><input type="radio" name="image" id="q2-c"><label for="q2-c">Everything but the photo renders</label></div>
    <p class="why">The source is stripped before anything is drawn; the rest of the card is untouched. Inline the photo as a <code>data:</code> URL, or draw it as inline SVG.</p>
  </div>
  <div class="q">
    <p>3. Where does a rendered card actually live?</p>
    <div class="opt wrong"><input type="radio" name="home" id="q3-a"><label for="q3-a">Directly in the note's DOM</label></div>
    <div class="opt right"><input type="radio" name="home" id="q3-b"><label for="q3-b">In a shadow root</label></div>
    <div class="opt wrong"><input type="radio" name="home" id="q3-c"><label for="q3-c">In an iframe</label></div>
    <p class="why">Each block gets its own shadow root. That is why two cards can use the same class names — and the same ids — without ever colliding.</p>
  </div>
</div>
```

Notice what is missing: no `onclick`, no state object, nothing to re-render. A `<details>` or a radio group is enough to make a note block feel alive.
