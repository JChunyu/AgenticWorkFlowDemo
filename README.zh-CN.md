# h5-in-article-renderer

把 AI 写的 HTML 粘进 Obsidian 笔记，在阅读视图里变成一张和笔记同主题、同宽度、同字号的卡。英文版见
[README.md](README.md)。

**这个插件不做的事：**

1. **不执行脚本。** `<script>`、`on*` 事件属性和 `javascript:` 链接在显示之前就被剥离。
2. **绝不联网。** `<link>`、`@import`、远程字体、CDN 脚本、`<iframe>`/`<object>`/`<embed>`、非 `data:` 的 CSS `url()`，以及一切会触发请求的资源属性（`src`、`srcset`、`poster`、`xlink:href`）都会被剥离，所以渲染全过程零网络请求。普通超链接（`<a href="https://…">`）会保留——它只在你点击时才动作。
3. **不写回你的笔记。** Markdown 文件在处理前后逐字节一致，变的只有阅读视图。（*插入示例笔记* 命令只在你主动执行时新建一篇笔记，四项偏好存在插件自己的 `data.json` 里，两者都不碰你正在读的这篇笔记。）
4. **只认一个 fence：`h5-renderer`。** ```` ```html ```` 和其它所有 fence 与装插件之前完全相同——同样的代码、同样的属性、控制台不会有任何警告。唯一的刻意例外：第一次打开含普通 ```` ```html ```` 块的笔记时，笔记顶部会出现一次内联提示，告诉你该用哪个 fence。此后不再出现。

**正确写法：**

````markdown
```h5-renderer
<div class="card">
  <style>
    .card { display: grid; gap: 12px; color: var(--text-normal); }
  </style>
  <h3>标题</h3>
  <p>正文</p>
</div>
```
````

**错误写法**（会显示成普通代码块，这是刻意的）：

````markdown
```html
<div class="card"><h3>标题</h3></div>
```
````

**编辑时预览：未排期。** 卡片只在阅读视图、打印与导出的 PDF 中出现，不会在编辑时实时出现；
本产品不对这一点做任何版本承诺。

## 安装

- **BRAT**：把本仓库加为 beta 插件，启用，然后在社区插件里打开 *h5-in-article-renderer*。
- **手动**：新建 `<vault>/.obsidian/plugins/h5-in-article-renderer/`，把 `main.js`、`manifest.json`、`styles.css` 放进去，重载 Obsidian 后启用。

需要 Obsidian `1.15.0` 或更新版本，桌面端。v1 不测试移动端，但没有任何设计会让它必然不可用。

## 使用

1. 命令面板执行 **插入示例笔记**，得到一份三卡示例。
2. 命令面板执行 **复制给 AI 的要求**，把它粘给任何 AI。
3. 把 AI 返回的块粘进笔记，切到阅读视图。
4. 鼠标移到卡片上会显现切换按钮，点它即可在源码与渲染结果之间切换。这个选择永远不会写到磁盘上。

设置页恰好四项：启用渲染、新块默认状态（在 *渲染结果* 与 *源码* 之间选择）、显示切换按钮、
显示错误提示。改完立即作用于已经打开的笔记，不需要重载。

## 性能与降级

渲染是同步的，每个块都按两级固定预算计时：超过 **50ms** 时本次仍正常显示，但下一次重渲染会降级为源码；
超过 **500ms** 时立即降级。降级块显示源码加一条提示，点 **预览** 会强制再渲染一次并绕过预算。
两个常量不可配置，且刻意没有 loading 态。

## 数据与隐私

没有 telemetry、没有统计、不访问网络。插件只存两类数据，且都在你的 vault 内：

- `.obsidian/plugins/h5-in-article-renderer/data.json` —— 四项设置，加三个本地标记（引导是否已显示、示例是否已询问、示例是否被拒绝）。
- 别无其它。块状态（渲染态/源码态）只在当前视图的内存里。

删掉插件目录即清空以上全部。

## 给 AI 的约束卡

下面这段由 `scripts/sync-docs.mjs` 从 `src/constraint-card.md` 生成。不要在这里手改——
一旦副本漂移，`scripts/verify-docs.mjs` 会让发布失败。约束卡用中文写成是刻意的：它是给模型的指令，
一份规范措辞比两份更容易保持一致；它只有 8 条，读一遍就能核对。

<!-- constraint-card:start -->
````text
当你要为 Obsidian 笔记生成一段"可视展示块"时，请遵守以下约定：

1. 用代码块的 fence 名 h5-renderer，不要用 html：
   ```h5-renderer
   <div>...</div>
   ```

2. 只写静态内容：div / span / table / svg / style。
   不要写 <script>、不要写 on* 事件属性、不要写 javascript: 链接。

3. 不引用任何外部资源：不写 <link>、@import、远程字体、CDN 脚本、外部图片 URL。
   需要图形请用内联 <svg>。

4. 样式集中在一个 <style> 里，选择器收敛：
   不要把规则写到 body / html / * / :root 上；
   所有规则用一个统一的顶层容器类包裹（例如 .card），避免与其他块冲突。

5. 不写死尺寸：宽度用 100% 或 max-width，不要用 1200px 之类固定像素；
   高度同理，避免超出笔记栏或产生滚动条。

6. 颜色优先使用 Obsidian 的 CSS 变量，以便自动跟随浅色/深色主题：
   var(--text-normal)、var(--text-muted)、var(--background-primary)、
   var(--background-secondary)、var(--text-accent)、var(--background-modifier-border)。
   最外层容器不要设置不透明背景，保持透明以融入笔记。

7. 简单优先：优先用 flex / grid 做稳健布局，不追求炫技；
   单块代码尽量控制在 150 行以内。

8. 只输出这一个代码块，不要额外解释。
````
<!-- constraint-card:end -->

## 可访问性

切换按钮可用 `Tab` 到达、`Enter`/`Space` 触发，带随界面语言变化的 `aria-label`，焦点框用主题自带的
focus 色。提示条为 `role="status"`，`aria-live="polite"`（只在渲染失败时用 `assertive`），可聚焦因此
`Esc` 可关闭，且从不抢焦点。DOM 中不存在正值 `tabindex`、没有 focus trap、不注册任何自定义快捷键。

界面只提供中文与英文，其它界面语言回落到英文。卡片内容位于 shadow root 内，读屏器如何遍历它取决于
浏览器与主题。

**卡片内容自身的可访问性取决于 AI 写出的 HTML。** 插件不修复它，也不替它承诺。

## 排障

- **块显示成了普通代码块。** fence 必须严格是 `h5-renderer`，小写、带连字符。`html`、`h5`、`H5-Renderer` 都不识别。
- **编辑器里什么都不渲染。** 符合预期：卡片只出现在阅读视图、打印与 PDF。
- **卡片突然变成源码并带一条提示。** 它超出了渲染预算；点 **预览** 再渲染一次，或把卡片拆小。
- **卡片里的图片不见了。** 远程图片会被剥离以守住零网络；请用 `data:` 内联，或改用内联 `<svg>`。
- **提示说「已忽略脚本与外部引用」。** 该块含 `<script>`、`on*` 或远程引用；卡片其余部分照常显示。
- **我想让插件彻底消失。** 关闭 *启用渲染*：所有块回到普通代码块，页面不残留任何宿主、按钮或提示。

## Roadmap

- 编辑时（Live Preview）渲染：未排期。
- 移动端专项适配：未排期；但当前设计不会让移动端必然不可用。

## 版本策略

遵循语义化版本，`manifest.json` 是唯一版本源；tag、`manifest.version` 与 `package.json.version` 三者不一致时发布失败。

破坏性变更只限两类，且都在自动生成的 release notes 里给出迁移步骤：更换识别的 fence 名、增删或修改设置项。
同一大版本内，公开接口不会出现其它破坏性变更。

## 发布自己的构建之前

`manifest.json` 里有只有维护者才能提供的发布者身份。请先替换 `author`、`authorUrl` 与 `id`
（并在社区目录里确认 id 未被占用）。

## 许可

MIT，见 [LICENSE](LICENSE)。
