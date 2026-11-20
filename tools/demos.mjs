/**
 * The example notes, written once and rendered twice.
 *
 * Every card below is the markup a user would paste into a note; `t` is that
 * demo's copy in the language being built. `tools/build-examples.mjs` turns this
 * into `examples/*.md` and `examples/zh/*.md`, and the same cards feed the
 * screenshots and the promo video — so what the README shows is what the files
 * contain.
 *
 * Rules every card obeys, because `tests/unit/examples.test.ts` checks them:
 * one top-level container class, theme variables only, no literal colours, under
 * 150 lines, and nothing the scrubber would remove.
 */

/** Images are inlined at build time; `{{img:name}}` becomes a data: URL. */
export const demos = [
  {
    slug: 'tabs',
    title: { en: 'One card, three views', zh: '一张卡，三个视角' },
    intro: {
      en: 'The same walk, three ways: a photo for how it felt, a route for how it went, numbers for what it cost. The tabs are three radio buttons and three labels — no script, so there is no state to lose.',
      zh: '同一段路，三种写法：照片留给感觉，路线留给过程，数字留给代价。三个标签页只是三个 radio 加三个 label——没有脚本，也就没有会丢的状态。',
    },
    outro: {
      en: 'Click a tab in reading view. While editing, a click on a label still belongs to the label: the plugin hands control clicks through instead of opening the source.',
      zh: '阅读视图里点标签就能切。编辑态下点在 label 上的那一下仍然属于 label：插件把控件上的点击让过去，不会展开源码。',
    },
    copy: {
      en: {
        tabPhoto: 'Photo',
        tabRoute: 'Route',
        tabNumbers: 'Numbers',
        photoAlt: 'A path running through fog between tall pines',
        photoCap: '06:40 — the fog sits in the valley until the sun clears the ridge.',
        routeCap: '9.4 km, one water point at the saddle, and a false summit at 7 km.',
        distance: 'Distance',
        ascent: 'Ascent',
        moving: 'Moving',
        water: 'Water',
      },
      zh: {
        tabPhoto: '照片',
        tabRoute: '路线',
        tabNumbers: '数字',
        photoAlt: '雾中的松林小路',
        photoCap: '06:40 —— 雾压在谷底，要等太阳翻过山脊才散。',
        routeCap: '9.4 公里，鞍部一处取水点，7 公里处有个假顶。',
        distance: '距离',
        ascent: '爬升',
        moving: '移动时间',
        water: '取水',
      },
    },
    cards: [
      {
        name: 'tabs',
        html: (t) => `<div class="tabs">
  <style>
    .tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .tabs .tab { display: contents; }
    .tabs input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; }
    .tabs label { grid-row: 1; padding: 9px 6px; border-bottom: 1px solid var(--background-modifier-border); font-size: 0.82em; color: var(--text-muted); text-align: center; cursor: pointer; user-select: none; }
    .tabs input:checked + label { color: var(--text-normal); box-shadow: inset 0 -2px 0 var(--text-accent); }
    .tabs input:focus-visible + label { outline: 2px solid var(--text-accent); outline-offset: -2px; }
    .tabs .panel { grid-row: 2; grid-column: 1 / -1; display: none; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 16px; align-items: center; padding-top: 14px; }
    .tabs input:checked + label + .panel { display: grid; }
    .tabs figure { margin: 0; }
    .tabs img { display: block; width: 100%; border-radius: 9px; }
    .tabs p { margin: 0; font-size: 0.84em; line-height: 1.6; color: var(--text-muted); }
    .tabs svg.map { display: block; width: 100%; height: auto; color: var(--text-muted); }
    .tabs dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; margin: 0; }
    .tabs dt { font-size: 0.7em; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-faint); }
    .tabs dd { margin: 2px 0 0; font-size: 1.02em; color: var(--text-normal); font-variant-numeric: tabular-nums; }
    .tabs .panel.numbers { grid-template-columns: 1fr; gap: 15px; }
    .tabs .panel.numbers dl { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px 20px; }
    .tabs .panel.numbers dl > div { padding-top: 9px; border-top: 1px solid var(--background-modifier-border); }
    @media (max-width: 420px) { .tabs .panel { grid-template-columns: 1fr; }
      .tabs .panel.numbers dl { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
  <div class="tab">
    <input type="radio" name="trail-view" id="tab-photo" checked>
    <label for="tab-photo">${t.tabPhoto}</label>
    <div class="panel">
      <figure><img src="{{img:forest}}" alt="${t.photoAlt}"></figure>
      <p>${t.photoCap}</p>
    </div>
  </div>
  <div class="tab">
    <input type="radio" name="trail-view" id="tab-route">
    <label for="tab-route">${t.tabRoute}</label>
    <div class="panel">
      <svg class="map" viewBox="0 0 200 150" role="img" aria-label="${t.routeCap}">
        <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.32">
          <path d="M-4 108C34 96 58 112 96 100s72 8 108-4"/>
          <path d="M-4 84C30 72 62 88 98 76s70 6 106-8"/>
          <path d="M-4 132C38 122 66 138 102 126s66 6 102-6"/>
        </g>
        <path d="M18 128 44 96l30 14 26-44 36 10 32-34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3" stroke-linecap="round"/>
        <circle cx="18" cy="128" r="3.4" fill="currentColor"/>
        <circle cx="184" cy="80" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="100" cy="66" r="2.6" fill="currentColor" opacity="0.55"/>
        <path d="M136 76c0-4 2.6-6.4 5.4-6.4S147 72 147 76c0 5-5.6 9-5.6 9S136 81 136 76Z" fill="none" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      <p>${t.routeCap}</p>
    </div>
  </div>
  <div class="tab">
    <input type="radio" name="trail-view" id="tab-numbers">
    <label for="tab-numbers">${t.tabNumbers}</label>
    <div class="panel numbers">
      <dl>
        <div><dt>${t.distance}</dt><dd>9.4 km</dd></div>
        <div><dt>${t.ascent}</dt><dd>620 m</dd></div>
        <div><dt>${t.moving}</dt><dd>3:20</dd></div>
        <div><dt>${t.water}</dt><dd>1</dd></div>
      </dl>
      <p>${t.routeCap}</p>
    </div>
  </div>
</div>`,
      },
    ],
  },

  {
    slug: 'gallery',
    title: { en: 'Photos that carry their own captions', zh: '照片带着自己的说明' },
    intro: {
      en: 'Three photographs, inlined as `data:` URLs. Nothing is fetched when the card opens, and the images travel inside the note — no attachment folder to keep in sync.',
      zh: '三张照片，以 `data:` URL 内联。卡片打开时不发一个请求，图片跟着笔记走——没有附件目录要同步。',
    },
    outro: {
      en: 'Hover a frame — or tab into it — and the caption rises. The scrim is `color-mix` over the note background, so it is a pale veil in a light theme and a dark one in a dark theme.',
      zh: '把鼠标移到画面上（或用 Tab 进入），说明就浮上来。遮罩是 `color-mix` 混在笔记背景上的，所以浅色主题下是浅纱，深色主题下是暗纱。',
    },
    copy: {
      en: {
        a1: 'Fog on the way up',
        a2: 'First light on the ridge',
        a3: 'The lake, on the way back',
      },
      zh: {
        a1: '上山时的雾',
        a2: '山脊上的第一束光',
        a3: '回程的湖面',
      },
    },
    cards: [
      {
        name: 'gallery',
        html: (t) => `<div class="frames">
  <style>
    .frames { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .frames figure { position: relative; margin: 0; overflow: hidden; border-radius: 10px; background: var(--background-secondary); }
    .frames img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
    .frames figcaption { position: absolute; inset: auto 0 0; padding: 30px 10px 9px; font-size: 0.76em; line-height: 1.45; color: var(--text-normal); background: linear-gradient(to top, color-mix(in srgb, var(--background-primary) 95%, transparent), transparent); opacity: 0; transform: translateY(6px); transition: opacity 160ms ease, transform 160ms ease; }
    .frames figure:hover figcaption,
    .frames figure:focus-within figcaption { opacity: 1; transform: translateY(0); }
    .frames figcaption span { display: block; margin-top: 3px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    @media (max-width: 380px) { .frames { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
  <figure><img src="{{img:forest}}" alt="${t.a1}" tabindex="0"><figcaption>${t.a1}<span>06:40</span></figcaption></figure>
  <figure><img src="{{img:ridge}}" alt="${t.a2}" tabindex="0"><figcaption>${t.a2}<span>07:20</span></figcaption></figure>
  <figure><img src="{{img:lake}}" alt="${t.a3}" tabindex="0"><figcaption>${t.a3}<span>19:05</span></figcaption></figure>
</div>`,
      },
    ],
  },

  {
    slug: 'quiz',
    title: { en: 'A card you can answer', zh: '一张可以作答的卡' },
    intro: {
      en: 'Three questions about this plugin, answerable in reading view. Every answer is a radio button; the tick, the cross and the explanation are sibling selectors. No score is kept, because keeping score would need a script.',
      zh: '三个关于本插件的问题，在阅读视图里就能作答。每个选项是一个 radio；对勾、叉和解释都靠兄弟选择器。没有计分，因为计分需要脚本。',
    },
    outro: {
      en: 'Notice what is missing: no `onclick`, no state object, nothing to re-render. A `<details>` or a radio group is enough to make a note block feel alive.',
      zh: '注意少掉的东西：没有 `onclick`、没有状态对象、没有需要重渲染的界面。一个 `<details>` 或一组 radio 就够让笔记里的块有反应。',
    },
    copy: {
      en: {
        q1: 'A block is fenced as <code>html</code> instead. What do you see?',
        q1a: 'A card — the fence name is a formality',
        q1b: 'A plain code block',
        q1c: 'A card, after a warning',
        e1: 'Only <code>h5-renderer</code> is recognised. Every other fence renders exactly as it did before the plugin was installed — and one time only, a hint points at the right fence.',
        q2: 'A card contains an <code>img</code> whose source is an https:// URL. What happens?',
        q2a: 'The photo loads normally',
        q2b: 'A broken-image icon',
        q2c: 'Everything but the photo renders',
        e2: 'The source is stripped before anything is drawn; the rest of the card is untouched. Inline the photo as a <code>data:</code> URL, or draw it as inline SVG.',
        q3: 'Where does a rendered card actually live?',
        q3a: "Directly in the note's DOM",
        q3b: 'In a shadow root',
        q3c: 'In an iframe',
        e3: 'Each block gets its own shadow root. That is why two cards can use the same class names — and the same ids — without ever colliding.',
      },
      zh: {
        q1: '某个块用的是 <code>html</code> 这个 fence，会怎样？',
        q1a: '照样出卡片——fence 名只是个形式',
        q1b: '还是普通代码块',
        q1c: '出卡片，但先给一条警告',
        e1: '只认 <code>h5-renderer</code>。其它 fence 与装插件之前渲染得一模一样——并且只会出现一次提示，指向正确的 fence。',
        q2: '卡片里有个 <code>img</code>，地址是 https:// 开头，会怎样？',
        q2a: '照片正常加载',
        q2b: '显示一个裂图',
        q2c: '除了照片，其它都照常渲染',
        e2: '在画出第一个像素之前地址就被剥掉了，卡片其余部分不受影响。要用照片就把它内联成 <code>data:</code> URL，或者直接画成内联 SVG。',
        q3: '渲染出来的卡片到底住在哪儿？',
        q3a: '就在笔记的 DOM 里',
        q3b: '在一个 shadow root 里',
        q3c: '在一个 iframe 里',
        e3: '每个块有自己独立的 shadow root。所以两张卡可以写同样的类名——同样的 id 也行——永远不会互相干扰。',
      },
    },
    cards: [
      {
        name: 'quiz',
        html: (t) => `<div class="quiz">
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
    <p>1. ${t.q1}</p>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-a"><label for="q1-a">${t.q1a}</label></div>
    <div class="opt right"><input type="radio" name="fence" id="q1-b"><label for="q1-b">${t.q1b}</label></div>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-c"><label for="q1-c">${t.q1c}</label></div>
    <p class="why">${t.e1}</p>
  </div>
  <div class="q">
    <p>2. ${t.q2}</p>
    <div class="opt wrong"><input type="radio" name="image" id="q2-a"><label for="q2-a">${t.q2a}</label></div>
    <div class="opt wrong"><input type="radio" name="image" id="q2-b"><label for="q2-b">${t.q2b}</label></div>
    <div class="opt right"><input type="radio" name="image" id="q2-c"><label for="q2-c">${t.q2c}</label></div>
    <p class="why">${t.e2}</p>
  </div>
  <div class="q">
    <p>3. ${t.q3}</p>
    <div class="opt wrong"><input type="radio" name="home" id="q3-a"><label for="q3-a">${t.q3a}</label></div>
    <div class="opt right"><input type="radio" name="home" id="q3-b"><label for="q3-b">${t.q3b}</label></div>
    <div class="opt wrong"><input type="radio" name="home" id="q3-c"><label for="q3-c">${t.q3c}</label></div>
    <p class="why">${t.e3}</p>
  </div>
</div>`,
      },
    ],
  },

  {
    slug: 'promises',
    title: { en: 'Three promises, folded up', zh: '三条承诺，折起来' },
    intro: {
      en: "The plugin's own rules as a card: three `details` elements, a pseudo-element arrow, and nothing in it that could run.",
      zh: '插件自己的那几条规矩，做成一张卡：三个 `details`，一个伪元素箭头，里面没有任何能执行的东西。',
    },
    outro: {
      en: 'Open one while editing and the card stays a card — a `summary` owns its own click. The arrow is a character in `content`, so there is no icon font to load.',
      zh: '编辑态里展开一条，卡片仍然是卡片——`summary` 的点击属于它自己。箭头是 `content` 里的一个字符，所以没有图标字体要加载。',
    },
    copy: {
      en: {
        s1: 'Nothing runs',
        p1: '<code>&lt;script&gt;</code>, <code>on*</code> handlers and <code>javascript:</code> URLs are removed before a single pixel is drawn. What is left is markup that only reacts to CSS.',
        s2: 'Nothing is fetched',
        p2: '<code>&lt;link&gt;</code>, <code>@import</code>, remote fonts, frames and every fetching attribute come out. A <code>data:</code> URL or an inline SVG is the only way to show an image — which is what makes zero network requests something you can watch in devtools.',
        s3: 'Your file never changes',
        p3: 'Open a card, keep one block as source, scroll a screenful: the markdown is byte-identical afterwards and the undo history is untouched.',
      },
      zh: {
        s1: '什么都不执行',
        p1: '<code>&lt;script&gt;</code>、<code>on*</code> 事件属性和 <code>javascript:</code> 链接在画出第一个像素之前就被去掉。剩下的是只受 CSS 影响的标记。',
        s2: '什么都不联网',
        p2: '<code>&lt;link&gt;</code>、<code>@import</code>、远程字体、frame 以及一切会触发请求的属性都会被剥掉。要放图片只能用 <code>data:</code> URL 或内联 SVG——所以「零网络请求」是能在 devtools 里当场看见的。',
        s3: '笔记文件一个字节都不变',
        p3: '展开卡片、让某一块保持源码、滚过一屏：事后 markdown 逐字节一致，撤销栈也没动过。',
      },
    },
    cards: [
      {
        name: 'promises',
        html: (t) => `<div class="promises">
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
    <summary>${t.s1}</summary>
    <p>${t.p1}</p>
  </details>
  <details>
    <summary>${t.s2}</summary>
    <p>${t.p2}</p>
  </details>
  <details>
    <summary>${t.s3}</summary>
    <p>${t.p3}</p>
  </details>
</div>`,
      },
    ],
  },

  {
    slug: 'lamp-switch',
    title: { en: 'A switch, two states', zh: '台灯开关：一张卡里的两个状态' },
    intro: {
      en: 'One card explains the difference between on and off: switch up, circuit broken; switch down, lamp lit. Both columns are the same SVG drawing, so the picture can never disagree with the text.',
      zh: '一张卡讲清「开」与「关」的差别：左边开关抬起、电路断开；右边开关落下、灯亮。两栏用同一段 SVG 画台灯，只换颜色与光锥，因此插图与文字永远不会各说各话。',
    },
    outro: {
      en: 'This card is plain static HTML: it looks like a switch, but it cannot be flicked. A card that reacts has to react through CSS — there is no script in here, and that is deliberate.',
      zh: '这张卡是纯静态 HTML：它看起来像开关，但不会真的被点。想让人点，得由 CSS 去反应——本块里没有脚本，这是刻意的。',
    },
    copy: {
      en: {
        off: 'OFF',
        on: 'ON',
        up: 'Switch up',
        upBody: 'The circuit is broken here; no current reaches the filament.',
        down: 'Switch down',
        downBody: 'The loop closes, current flows, and the lamp lights.',
        altOff: 'Switch raised, lamp off',
        altOn: 'Switch lowered, lamp on',
      },
      zh: {
        off: 'OFF',
        on: 'ON',
        up: '开关抬起',
        upBody: '电路在这儿断着，灯丝里没有电流。',
        down: '开关落下',
        downBody: '回路闭合，电流过来，灯就亮了。',
        altOff: '开关抬起，台灯不亮',
        altOn: '开关落下，台灯亮着',
      },
    },
    cards: [
      {
        name: 'lamp',
        html: (t) => `<div class="lamp">
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
    <span class="state">${t.off}</span>
    <svg viewBox="0 0 120 124" role="img" aria-label="${t.altOff}">
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
    <h4>${t.up}</h4>
    <p>${t.upBody}</p>
  </div>
  <div class="panel on">
    <span class="state">${t.on}</span>
    <svg viewBox="0 0 120 124" role="img" aria-label="${t.altOn}">
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
    <h4>${t.down}</h4>
    <p>${t.downBody}</p>
  </div>
</div>`,
      },
    ],
  },

  {
    slug: 'kpi-board',
    title: { en: 'Numbers and a board', zh: '指标卡与看板' },
    intro: {
      en: 'Figures line up with `tabular-nums`, so they do not shuffle as you scan down. Between cells there is nothing but CSS grid, and it reflows by itself when the column narrows.',
      zh: '数字用 `tabular-nums`，竖着看不会左右跳；卡片之间只是 CSS grid，窄了自动折行，不需要另做一版。',
    },
    between: {
      en: 'The board is three grid columns, each with a status dot at the top. Column widths use `minmax(0, 1fr)`, so a long title wraps instead of stretching the card wider than the note.',
      zh: '看板是三列 grid，每列顶上一个状态点。列宽用 `minmax(0, 1fr)`，长标题只会换行，不会把整张卡撑破。',
    },
    outro: {
      en: 'Two cards, one note, and neither knows the other exists: a separate shadow root each, so the class names may repeat.',
      zh: '两张卡、一篇笔记，彼此不知道对方存在：各自一个 shadow root，所以类名可以重名。',
    },
    copy: {
      en: {
        net: 'network requests',
        scripts: 'scripts executed',
        writes: 'bytes written back',
        budget: 'render budget, per block',
        foot: 'The first three are promises. The last one is a limit you can watch: cross it and the block degrades to source.',
        todo: 'Todo',
        doing: 'Doing',
        done: 'Done',
        t1: 'Touch targets on mobile',
        t1s: '32px minimum',
        t2: 'PDF page breaks',
        t2s: 'never mid-sentence',
        t3: 'Rebuild gate while typing',
        t3s: 'skip when the cursor is inside',
        t4: 'Card in reading view',
        t4s: '0.1.0',
        t5: 'Live preview rendering',
        t5s: '0.1.1',
      },
      zh: {
        net: '网络请求',
        scripts: '脚本被执行',
        writes: '写回笔记',
        budget: '单块渲染预算',
        foot: '前三个是承诺，最后一个是可以被观察到的上限：越过它就先降级成源码。',
        todo: '待办',
        doing: '进行中',
        done: '已完成',
        t1: '移动端点按目标',
        t1s: '按钮最小 32px',
        t2: '导出 PDF 分页',
        t2s: '不在文字行中间断开',
        t3: '编辑态重建门控',
        t3s: '光标在块内就不重建',
        t4: '阅读视图卡片',
        t4s: '0.1.0',
        t5: 'Live Preview 渲染',
        t5s: '0.1.1',
      },
    },
    cards: [
      {
        name: 'kpi',
        html: (t) => `<div class="kpi">
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
    <div class="cell"><div class="num">0</div><div class="label">${t.net}</div></div>
    <div class="cell"><div class="num">0</div><div class="label">${t.scripts}</div></div>
    <div class="cell"><div class="num">0</div><div class="label">${t.writes}</div></div>
    <div class="cell"><div class="num">50<em>ms</em></div><div class="label">${t.budget}</div></div>
  </div>
  <p class="foot">${t.foot}</p>
</div>`,
      },
      {
        name: 'board',
        html: (t) => `<div class="board">
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
    <div class="title"><span class="dot"></span>${t.todo}</div>
    <div class="ticket"><b>${t.t1}</b><span>${t.t1s}</span></div>
    <div class="ticket"><b>${t.t2}</b><span>${t.t2s}</span></div>
  </div>
  <div class="lane doing">
    <div class="title"><span class="dot"></span>${t.doing}</div>
    <div class="ticket"><b>${t.t3}</b><span>${t.t3s}</span></div>
  </div>
  <div class="lane done">
    <div class="title"><span class="dot"></span>${t.done}</div>
    <div class="ticket"><b>${t.t4}</b><span>${t.t4s}</span></div>
    <div class="ticket"><b>${t.t5}</b><span>${t.t5s}</span></div>
  </div>
</div>`,
      },
    ],
  },

  {
    slug: 'timeline',
    title: { en: 'Four steps, and what each one costs', zh: '时间线：一个块的四步，以及每一步的代价' },
    intro: {
      en: 'The rail is CSS and the dots are spans — better than a screenshot because adding a step means adding one div, and the type scales with the note.',
      zh: '竖线是 CSS 画的，圆点也行；比截图好的地方在于，加一步就是加一个 `div`，字号、主题色全都自动跟着笔记走。',
    },
    outro: {
      en: 'A `code` span works inside a card too, and it picks up the theme’s monospace. To make one step stand out, fill its dot in or switch the badge to `var(--text-accent)`.',
      zh: '`code` 在卡里同样有效，等宽字体会跟随主题。想让某一步更显眼，把 `.dot` 换成实心，或者在 badge 上换成 `var(--text-accent)`。',
    },
    copy: {
      en: {
        s1: 'Recognise',
        b1: 'scan, never execute',
        d1: 'Only a fence at the start of a line is matched, and only <code>h5-renderer</code> is taken. Other fences are not even read.',
        s2: 'Scrub',
        b2: 'zero network requests',
        d2: 'Scripts, event handlers, remote fonts and images are removed before anything reaches the shadow root; whatever was removed shows up in a notice.',
        s3: 'Render',
        b3: '50 ms / 500 ms',
        d3: 'Rendering is synchronous and timed. Past 50 ms the block degrades to source on its next render; past 500 ms it degrades on the spot.',
        s4: 'Rebuild',
        b4: 'zero bytes written',
        d4: 'A cursor inside the block returns it to source. It is rebuilt only when the cursor is out, the block is on screen, and the text actually changed.',
      },
      zh: {
        s1: '识别',
        b1: '扫描，不执行',
        d1: '只在行首找 fence，命中 <code>h5-renderer</code> 才收下这段文本。别的 fence 连读都不读。',
        s2: '清洗',
        b2: '0 个网络请求',
        d2: '脚本、事件属性、远程字体与图片在进入 shadow root 之前就被去掉；去掉的东西会出现在提示条里。',
        s3: '渲染',
        b3: '50ms / 500ms',
        d3: '同步渲染并计时。越过 50ms，下一次重渲染降级为源码；越过 500ms，当场降级。',
        s4: '重建',
        b4: '0 字节写回',
        d4: '光标进块退回源码，移出、可见、文本确实变了才重建。滚出视野的块释放渲染产物，回来时重建。',
      },
    },
    cards: [
      {
        name: 'timeline',
        html: (t) => `<div class="timeline">
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
      <div class="head"><span class="step">01 ${t.s1}</span><span class="badge">${t.b1}</span></div>
      <p class="desc">${t.d1}</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">02 ${t.s2}</span><span class="badge">${t.b2}</span></div>
      <p class="desc">${t.d2}</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">03 ${t.s3}</span><span class="badge">${t.b3}</span></div>
      <p class="desc">${t.d3}</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">04 ${t.s4}</span><span class="badge">${t.b4}</span></div>
      <p class="desc">${t.d4}</p>
    </div>
  </div>
</div>`,
      },
    ],
  },

  {
    slug: 'flowchart',
    title: { en: 'One block, from paste to card', zh: '流程图：一个块从粘贴到卡片' },
    intro: {
      en: 'The main path runs down the middle; the dashed branch on the right is the only exit — the fence name does not match, so the plugin never sees it. Laid out as HTML rather than drawn as a picture, the words inside the nodes stay selectable and editable.',
      zh: '主流程在左，右边那条虚线是唯一的岔路——fence 名不对，插件就当没看见。用 HTML 排而不是画成一张图，好处是节点里的字仍然可以选中、可以改，字号跟着笔记走。',
    },
    between: {
      en: 'The same block has three possible endings, and the second card puts them side by side: a card, source plus a notice, or a plain code block the plugin never touched.',
      zh: '同一个块还有三个可能的出口，第二张卡把三种结局摆在一起。',
    },
    outro: {
      en: 'Only the first ending is the common one. The other two are quiet on purpose — a note should never fail loudly because a block did.',
      zh: '三种结局里只有第一种是常态。另外两种之所以安静，是因为它们本来就该安静——一个块出问题，不该让整篇笔记炸掉。',
    },
    copy: {
      en: {
        n1: 'Write some HTML in a note',
        n1s: 'wrapped in h5-renderer',
        gate: 'Does the fence name match?',
        gates: 'lowercase h5-renderer, nothing else',
        n2: 'Scrub',
        n2s: 'scripts, on*, remote references removed',
        n3: 'Render',
        n3s: 'into a shadow root, inheriting the note',
        n4: 'You see a card',
        n4s: 'same theme, same width, same type',
        sideCap: 'or take this exit',
        side: 'Left exactly as it was',
        sides: 'a plain code block, as before the plugin',
        o1: 'In budget',
        o1h: 'A card',
        o1p: 'Rendered inside 50 ms, the code block is replaced on the spot.',
        o2: 'Over budget',
        o2h: 'Source and a notice',
        o2p: 'Past 500 ms it degrades immediately; Preview renders it once more.',
        o3: 'Wrong fence',
        o3h: 'A plain code block',
        o3p: 'Untouched by the plugin, with not one extra console warning.',
      },
      zh: {
        n1: '在笔记里写一段 HTML',
        n1s: '围在 h5-renderer 里',
        gate: 'fence 名对得上吗',
        gates: '只认小写的 h5-renderer',
        n2: '清洗',
        n2s: 'script、on*、远程引用在显示前剥掉',
        n3: '渲染',
        n3s: '放进 shadow root，继承笔记的变量',
        n4: '你看到一张卡',
        n4s: '同主题、同宽度、同字号',
        sideCap: '对不上就走这条',
        side: '原样留着',
        sides: '普通代码块，和装插件之前一模一样',
        o1: '顺利',
        o1h: '卡片',
        o1p: '渲染在 50ms 预算内完成，当场替换掉代码块。',
        o2: '超预算',
        o2h: '源码加一条提示',
        o2p: '越过 500ms 立刻降级；点「预览」可以再渲染一次。',
        o3: '不是这个 fence',
        o3h: '普通代码块',
        o3p: '插件完全不碰它，控制台也不会多一句警告。',
      },
    },
    cards: [
      {
        name: 'flow',
        html: (t) => `<div class="flow">
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
    <div class="node">${t.n1}<small>${t.n1s}</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node gate">${t.gate}<small>${t.gates}</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">${t.n2}<small>${t.n2s}</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">${t.n3}<small>${t.n3s}</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">${t.n4}<small>${t.n4s}</small></div>
  </div>
  <div class="side">
    <span class="cap">${t.sideCap}</span>
    <div class="node">${t.side}<small>${t.sides}</small></div>
  </div>
</div>`,
      },
      {
        name: 'outcomes',
        html: (t) => `<div class="outcomes">
  <style>
    .outcomes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .outcomes .col { padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 10px; }
    .outcomes .tag { display: inline-block; margin-bottom: 6px; font-size: 0.72em; letter-spacing: 0.04em; color: var(--text-accent); }
    .outcomes h4 { margin: 0 0 6px; font-size: 0.95em; font-weight: 600; color: var(--text-normal); }
    .outcomes p { margin: 0; font-size: 0.84em; line-height: 1.55; color: var(--text-muted); }
    @media (max-width: 520px) { .outcomes { grid-template-columns: 1fr; } }
  </style>
  <div class="col">
    <span class="tag">${t.o1}</span>
    <h4>${t.o1h}</h4>
    <p>${t.o1p}</p>
  </div>
  <div class="col">
    <span class="tag">${t.o2}</span>
    <h4>${t.o2h}</h4>
    <p>${t.o2p}</p>
  </div>
  <div class="col">
    <span class="tag">${t.o3}</span>
    <h4>${t.o3h}</h4>
    <p>${t.o3p}</p>
  </div>
</div>`,
      },
    ],
  },
];

export const LANGS = ['en', 'zh'];
