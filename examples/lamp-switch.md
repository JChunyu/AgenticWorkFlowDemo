# 台灯开关：一张卡里的两个状态

一张卡讲清「开」与「关」的差别：左边开关抬起、电路断开；右边开关落下、灯亮。两栏用同一段 SVG 画台灯，只换颜色与光锥，因此插图与文字永远不会各说各话。

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
    <svg viewBox="0 0 120 124" role="img" aria-label="开关抬起，台灯不亮">
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
    <h4>开关抬起</h4>
    <p>电路在这儿断着，灯丝里没有电流。</p>
  </div>
  <div class="panel on">
    <span class="state">ON</span>
    <svg viewBox="0 0 120 124" role="img" aria-label="开关落下，台灯亮着">
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
    <h4>开关落下</h4>
    <p>回路闭合，电流过来，灯就亮了。</p>
  </div>
</div>
```

这张卡是纯静态 HTML：它看起来像开关，但不会真的被点。想让人点，得由插件给的状态去改内容——本块里没有脚本，这是刻意的。

第二张卡把同一件事拆成一句一句的因果链，适合放在讲解文档里：

```h5-renderer
<div class="chain">
  <style>
    .chain { display: grid; gap: 0; }
    .chain .step { display: grid; grid-template-columns: 1.6em minmax(0, 1fr); gap: 10px; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed var(--background-modifier-border); }
    .chain .step:last-child { border-bottom: none; }
    .chain .idx { font-size: 0.8em; color: var(--text-faint); font-variant-numeric: tabular-nums; }
    .chain .text { color: var(--text-normal); }
    .chain .text small { display: block; margin-top: 2px; font-size: 0.82em; color: var(--text-muted); }
  </style>
  <div class="step">
    <span class="idx">01</span>
    <span class="text">手按下翘板<small>机械动作，和电无关</small></span>
  </div>
  <div class="step">
    <span class="idx">02</span>
    <span class="text">两个触点合上<small>断开的缝被填平</small></span>
  </div>
  <div class="step">
    <span class="idx">03</span>
    <span class="text">电流有了通路<small>从电源出发，经过灯丝</small></span>
  </div>
  <div class="step">
    <span class="idx">04</span>
    <span class="text">灯丝发热到发光<small>于是你看到亮</small></span>
  </div>
</div>
```
