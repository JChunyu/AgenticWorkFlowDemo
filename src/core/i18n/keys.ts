/**
 * The only place user-visible copy exists. Both languages carry the same key set;
 * a missing key on either side fails the unit tests and therefore the build.
 */
export const zh = {
  'toggle.toSource': '源码',
  'toggle.toPreview': '预览',
  'toggle.aria.toSource': '切到源码',
  'toggle.aria.toPreview': '切到预览',

  'block.empty': '这个块还是空的',
  'notice.parseFailed': '这段内容没能解析出来',
  'notice.renderFailed': '内容没能显示，已切回源码',
  'notice.degraded': '这段内容太大，先显示源码',
  'notice.removed': '已忽略脚本与外部引用',
  'notice.viewSource': '查看源码',
  'notice.dismiss': '关闭',

  'onboarding.message': '这段代码块不会显示成图。用 `h5-renderer` 才会渲染',
  'onboarding.openSample': '看看示例',
  'onboarding.copyCard': '复制给 AI 的要求',
  'onboarding.dismiss': '关闭',

  'copy.success': '已复制，粘给 AI 即可',
  'copy.failed': '没法自动复制，请手动全选下面的文本',
  'copy.action': '复制给 AI 的要求',

  'sample.ask': '要看一个示例吗？',
  'sample.declined': '好，随时可以从命令面板插入',
  'sample.decline': '以后再说',
  'sample.readOnly': '这个仓库是只读的，没法新建笔记。下面是示例源码',
  'sample.copySource': '复制示例源码',
  'sample.fileName': 'h5-renderer 示例卡片',

  'command.insertSample': '插入示例笔记',
  'command.copyCard': '复制给 AI 的要求',

  'settings.enabled.name': '启用渲染',
  'settings.enabled.desc': '关闭后所有块都显示为普通代码块',
  'settings.defaultState.name': '新块默认状态',
  'settings.defaultState.desc': '新打开的笔记里，块先显示渲染结果还是源码',
  'settings.showToggle.name': '显示切换按钮',
  'settings.showToggle.desc': '块右上角的按钮，用来在源码与渲染结果之间切换',
  'settings.showErrorHints.name': '显示错误提示',
  'settings.showErrorHints.desc': '当内容没能显示或已被忽略时，在块内给出一条说明',
  'settings.state.rendered': '渲染结果',
  'settings.state.source': '源码',
  'settings.copyIntro': '把这份要求交给 AI，它写出的块就能直接显示成图。',
} as const;

export type MessageKey = keyof typeof zh;

export const en: Record<MessageKey, string> = {
  'toggle.toSource': 'Code',
  'toggle.toPreview': 'Preview',
  'toggle.aria.toSource': 'Switch to code',
  'toggle.aria.toPreview': 'Switch to preview',

  'block.empty': 'This block is empty',
  'notice.parseFailed': "Couldn't parse this content",
  'notice.renderFailed': "Couldn't display it — showing the source",
  'notice.degraded': 'This block is too large — showing the source for now',
  'notice.removed': 'Scripts and external references were removed',
  'notice.viewSource': 'View source',
  'notice.dismiss': 'Dismiss',

  'onboarding.message': "This block won't render. Use `h5-renderer` to display it",
  'onboarding.openSample': 'See an example',
  'onboarding.copyCard': 'Copy AI instructions',
  'onboarding.dismiss': 'Dismiss',

  'copy.success': 'Copied — paste it to your AI',
  'copy.failed': 'Could not copy automatically — select the text below',
  'copy.action': 'Copy AI instructions',

  'sample.ask': 'Want to see an example?',
  'sample.declined': 'OK — you can insert it from the command palette anytime',
  'sample.decline': 'Not now',
  'sample.readOnly': 'This vault is read-only, so a new note cannot be created. Here is the sample source',
  'sample.copySource': 'Copy sample source',
  'sample.fileName': 'h5-renderer sample cards',

  'command.insertSample': 'Insert sample note',
  'command.copyCard': 'Copy AI instructions',

  'settings.enabled.name': 'Enable rendering',
  'settings.enabled.desc': 'When off, every block shows as a plain code block',
  'settings.defaultState.name': 'Default state for new blocks',
  'settings.defaultState.desc': 'Whether a freshly opened note shows the rendered card or its source',
  'settings.showToggle.name': 'Show the toggle button',
  'settings.showToggle.desc': 'The button in the top-right corner that switches between source and rendered',
  'settings.showErrorHints.name': 'Show error hints',
  'settings.showErrorHints.desc': 'Show a short note inside the block when content was skipped or could not display',
  'settings.state.rendered': 'Rendered',
  'settings.state.source': 'Source',
  'settings.copyIntro': 'Hand these instructions to your AI so its next block renders as a card.',
};
