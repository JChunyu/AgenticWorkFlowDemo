/**
 * Timeline for the promo video. Runs inside the stage page after the cards have
 * been painted; `video.mjs` calls `window.__seek(t)` once per frame and
 * screenshots the canvas.
 *
 * Everything here is a pure function of `t` — the same second always produces
 * the same frame — so the video can be re-rendered without a re-shoot.
 */
(() => {
  const SCENES = [
    { id: 'title', from: 0, to: 4.2 },
    { id: 'tabs', from: 4.2, to: 9.6 },
    { id: 'quiz', from: 9.6, to: 14.2 },
    { id: 'gallery', from: 14.2, to: 18.4 },
    { id: 'themes', from: 18.4, to: 22.6 },
    { id: 'promises', from: 22.6, to: 26.8 },
    { id: 'end', from: 26.8, to: 31 },
  ];

  /** Cursor stops: `{ t, scene, selector }`, resolved to pixels once at start. */
  const STOPS = [
    { t: 4.9, scene: 'tabs', selector: 'label[for="tab-photo"]' },
    { t: 5.9, scene: 'tabs', selector: 'label[for="tab-route"]', click: 6.05 },
    { t: 7.4, scene: 'tabs', selector: 'label[for="tab-numbers"]', click: 7.55 },
    { t: 10.7, scene: 'quiz', selector: 'label[for="q1-b"]', click: 11.0 },
    { t: 12.0, scene: 'quiz', selector: 'label[for="q2-a"]', click: 12.2 },
    { t: 14.9, scene: 'gallery', selector: 'figure:nth-of-type(1) img' },
    { t: 15.85, scene: 'gallery', selector: 'figure:nth-of-type(2) img' },
    { t: 16.8, scene: 'gallery', selector: 'figure:nth-of-type(3) img' },
    { t: 23.5, scene: 'promises', selector: 'details:nth-of-type(2) summary', click: 23.65 },
    { t: 25.0, scene: 'promises', selector: 'details:nth-of-type(3) summary', click: 25.15 },
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = (t, from, to) => {
    const x = clamp((t - from) / (to - from), 0, 1);
    return x * x * (3 - 2 * x);
  };

  const sceneEls = new Map();
  for (const scene of SCENES) {
    const el = document.querySelector(`[data-scene="${scene.id}"]`);
    if (el) sceneEls.set(scene.id, el);
  }

  /** A card's shadow root is a separate tree; searches have to cross it. */
  function within(sceneId, selector) {
    const scene = sceneEls.get(sceneId);
    if (!scene) return [];
    const found = [...scene.querySelectorAll(selector)];
    const host = scene.querySelector('.h5r-rendered-host');
    if (host?.shadowRoot) found.push(...host.shadowRoot.querySelectorAll(selector));
    return found;
  }

  /** Centre of a node inside a card's shadow root, in page coordinates. */
  function locate(sceneId, selector) {
    const [el] = within(sceneId, selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }

  const stops = STOPS.map((stop) => ({
    ...stop,
    point: stop.scene ? locate(stop.scene, stop.selector) ?? stop.at ?? [960, 540] : stop.at,
  }));

  function cursorAt(t) {
    if (t < stops[0].t) return null;
    let index = 0;
    while (index < stops.length - 1 && t >= stops[index + 1].t) index += 1;
    const next = stops[index];
    const [nx, ny] = next.point;
    if (index === 0) return { x: nx, y: ny, click: 0 };
    const prev = stops[index - 1];
    const span = Math.max(0.35, next.t - prev.t);
    const k = ease(t, prev.t, prev.t + Math.min(0.72, span));
    const [px, py] = prev.point;
    return {
      x: px + (nx - px) * k,
      y: py + (ny - py) * k,
      click: next.click ? 1 - clamp(Math.abs(t - next.click) / 0.16, 0, 1) : 0,
    };
  }

  let litIndex = -2;

  /* Page CSS cannot reach into a shadow root, so the hover state the pointer
   * would produce is added to the card's own sheet instead. */
  const galleryHost = sceneEls.get('gallery')?.querySelector('.h5r-rendered-host');
  if (galleryHost?.shadowRoot && typeof CSSStyleSheet === 'function') {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('.frames figure.lit figcaption { opacity: 1; transform: translateY(0); }');
    galleryHost.shadowRoot.adoptedStyleSheets = [...galleryHost.shadowRoot.adoptedStyleSheets, sheet];
  }

  function setTab(id) {
    for (const input of within('tabs', 'input')) {
      const want = input.id === id;
      if (input.checked !== want) input.checked = want;
    }
  }

  function setAnswers(ids) {
    for (const input of within('quiz', 'input')) {
      const want = ids.includes(input.id);
      if (input.checked !== want) input.checked = want;
    }
  }

  function setLit(index) {
    if (litIndex === index) return;
    litIndex = index;
    within('gallery', 'figure').forEach((figure, position) => {
      figure.classList.toggle('lit', position === index);
    });
  }

  function setOpened(indexes) {
    within('promises', 'details').forEach((node, position) => {
      const want = indexes.includes(position);
      if (node.open !== want) node.open = want;
    });
  }

  const cursor = document.getElementById('cursor');
  const flipLayer = document.getElementById('flip-dark');

  window.__seek = (t) => {
    for (const scene of SCENES) {
      const el = sceneEls.get(scene.id);
      if (!el) continue;
      /* The light-theme scene is a hard cut: cross-fading white over a dark
       * canvas would read as a grey flash rather than a theme switch. */
      const enter = scene.id === 'themes' ? 0.16 : 0.5;
      const fadeIn = scene.from === 0 ? 1 : ease(t, scene.from, scene.from + enter);
      const fadeOut = scene.to === SCENES[SCENES.length - 1].to ? 1 : 1 - ease(t, scene.to - 0.4, scene.to);
      const opacity = clamp(fadeIn * fadeOut, 0, 1);
      el.style.opacity = String(opacity);
      el.style.visibility = opacity < 0.002 ? 'hidden' : 'visible';
      el.style.transform = `translateY(${(1 - fadeIn) * 20}px)`;
    }

    setTab(t >= 7.55 ? 'tab-numbers' : t >= 6.05 ? 'tab-route' : 'tab-photo');

    const answers = [];
    if (t >= 11) answers.push('q1-b');
    if (t >= 12.2) answers.push('q2-a');
    setAnswers(answers);

    setLit(t >= 16.8 ? 2 : t >= 15.85 ? 1 : t >= 14.9 ? 0 : -1);
    setOpened(t >= 25.15 ? [1, 2] : t >= 23.65 ? [1] : []);
    /* A theme switch is a cut, not a dissolve: cross-fading white over a dark
     canvas reads as a grey flash rather than as the same card in another theme. */
    if (flipLayer) flipLayer.style.opacity = t >= 20.4 ? '1' : '0';

    const endUrl = document.getElementById('end-url');
    if (endUrl) {
      const k = ease(t, 28.1, 28.9);
      endUrl.style.opacity = String(k);
      endUrl.style.transform = `translateY(${(1 - k) * 12}px)`;
    }

    const position = cursorAt(t);
    if (cursor) {
      if (!position) {
        cursor.style.opacity = '0';
      } else {
        /* The cursor has nothing to point at during the theme cut. */
        const away = ease(t, 19.6, 19.85) * (1 - ease(t, 21.1, 21.35));
        const show = ease(t, 4.6, 5.1) * (1 - ease(t, 26.2, 26.7)) * (1 - away);
        cursor.style.opacity = String(show);
        cursor.style.transform =
          `translate(${position.x}px, ${position.y}px) scale(${1 - position.click * 0.2})`;
      }
    }
  };

  window.__seek(0);
  window.__ready = true;
})();
