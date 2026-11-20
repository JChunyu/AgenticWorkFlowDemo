当你要为 Obsidian 笔记生成一段"可视展示块"时，请遵守以下约定：

1. 用代码块的 fence 名 h5-renderer，不要用 html：
   ```h5-renderer
   <div>...</div>
   ```

2. 只写静态内容：div / span / table / svg / style。
   需要"能点"的效果时，只用 CSS 原生控件：details + summary、
   input[type=checkbox|radio] + label、:hover / :focus-within / :focus-visible / :checked。
   不要写 <script>、不要写 on* 事件属性、不要写 javascript: 链接。

3. 不引用任何外部资源：不写 <link>、@import、远程字体、CDN 脚本、外部图片 URL。
   图形优先用内联 <svg>；要用照片就内联成 data: URL（base64），
   不要写 https:// 开头的 src。

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
