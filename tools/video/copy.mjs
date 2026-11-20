/**
 * The spoken track for the promo video: one line per scene, in the order the
 * scenes appear.
 *
 * `from` / `to` are the speech window in seconds — not the scene window. The
 * voice starts a beat after the cut and stops before the next one, so a line
 * that overruns is a build error rather than a video that drifts. `voice.mjs`
 * measures every line and fails on anything that does not fit.
 *
 * The video itself is silent by design: the timeline in `stage.js` is a pure
 * function of `t`, so the audio can be replaced or re-recorded without
 * re-rendering a single frame.
 */

export const SCRIPT = {
  en: {
    voice: 'Samantha',
    rate: 180,
    lines: [
      {
        scene: 'title',
        from: 0.25,
        to: 4.3,
        text: 'AI writes HTML. Your note should still look like your note.',
      },
      {
        scene: 'tabs',
        from: 4.55,
        to: 9.45,
        text: 'Tabs, switches, panels — all CSS. Not one line of script.',
      },
      {
        scene: 'quiz',
        from: 9.95,
        to: 14.1,
        text: "It answers back. Green when you're right, red when you're wrong.",
      },
      {
        scene: 'gallery',
        from: 14.5,
        to: 18.35,
        text: 'Photos live inside the note as data URLs. Nothing is fetched.',
      },
      {
        scene: 'themes',
        from: 18.75,
        to: 22.45,
        text: 'Same block, untouched. Light theme, dark theme.',
      },
      {
        scene: 'promises',
        from: 22.95,
        to: 26.7,
        text: 'No scripts. No requests. Your file is never written.',
      },
      {
        scene: 'end',
        from: 27.15,
        to: 30.85,
        text: 'H5 Card Renderer. Open source. Link on screen.',
      },
    ],
  },

  zh: {
    voice: 'Tingting',
    rate: 208,
    lines: [
      {
        scene: 'title',
        from: 0.25,
        to: 4.3,
        text: '大模型给你一段 HTML，它该长得像笔记本身。',
      },
      {
        scene: 'tabs',
        from: 4.55,
        to: 9.45,
        text: '标签页、开关、折叠面板，全靠 CSS，没有脚本。',
      },
      {
        scene: 'quiz',
        from: 9.95,
        to: 14.1,
        text: '它还会回应你：答错变红，答对变绿，解释跟着出来。',
      },
      {
        scene: 'gallery',
        from: 14.5,
        to: 18.35,
        text: '照片内联在卡片里，一个请求都不发，断网也在。',
      },
      {
        scene: 'themes',
        from: 18.75,
        to: 22.45,
        text: '同一个块，一个字没改，亮暗两种主题。',
      },
      {
        scene: 'promises',
        from: 22.95,
        to: 26.7,
        text: '不执行脚本，不发请求，文件也不会被改。',
      },
      {
        scene: 'end',
        from: 27.2,
        to: 30.7,
        text: 'H5 卡片渲染器，开源，链接在屏幕上。',
      },
    ],
  },
};

/** Length of the film, so the audio track can be padded to match exactly. */
export const DURATION = 31;
