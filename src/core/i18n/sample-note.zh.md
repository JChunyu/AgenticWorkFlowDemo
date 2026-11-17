# 三张卡片

下面三张卡都是 HTML 画出来的。Mermaid 只能画流程图、时序图和甘特图，遇到并列对比、特性矩阵和自由排版就没办法了。

## 方案对比

这张卡是 HTML 排的版，Mermaid 做不到这种三列并列加竖线分隔。

```h5-renderer
<div class="compare">
  <style>
    .compare { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .compare .col { padding: 0 16px; border-left: 1px solid var(--background-modifier-border); }
    .compare .col:first-child { padding-left: 0; border-left: none; }
    .compare h3 { margin: 0 0 8px; font-size: 1.05em; font-weight: 600; color: var(--text-normal); }
    .compare p { margin: 0; line-height: 1.6; color: var(--text-muted); }
    .compare .tag { display: inline-block; margin-bottom: 8px; font-size: 0.85em; color: var(--text-accent); }
    @media (max-width: 360px) {
      .compare { grid-template-columns: 1fr; }
      .compare .col { padding: 0 0 16px; border-left: none; }
    }
  </style>
  <div class="col">
    <span class="tag">方案 A</span>
    <h3>截图</h3>
    <p>贴上去就完事，但没法改字，也没法跟随主题，笔记从此变成图片仓库。</p>
  </div>
  <div class="col">
    <span class="tag">方案 B</span>
    <h3>Mermaid</h3>
    <p>能画流程图，但语法只覆盖流程和时序，做不出并列对比与自由排版。</p>
  </div>
  <div class="col">
    <span class="tag">方案 C</span>
    <h3>这个块</h3>
    <p>直接写 HTML，跟着笔记主题变，随时可以改一行字，内容始终可重新生成。</p>
  </div>
</div>
```

## 特性矩阵

这张卡用表格加内联 SVG 对勾，密一点的信息也读得下去。

```h5-renderer
<div class="matrix">
  <style>
    .matrix { width: 100%; border-collapse: collapse; }
    .matrix th, .matrix td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--background-modifier-border); }
    .matrix thead th { background: var(--background-secondary); font-weight: 600; color: var(--text-normal); }
    .matrix tbody tr:nth-child(even) { background: var(--background-secondary); }
    .matrix td { color: var(--text-muted); }
    .matrix .mark { color: var(--text-normal); }
    .matrix svg { vertical-align: -2px; }
  </style>
  <table>
    <thead>
      <tr><th>能力</th><th>截图</th><th>Mermaid</th><th>这个块</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="mark">跟随深浅主题</td>
        <td>不行</td><td>可以</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">改一个字</td>
        <td>重做图</td><td>改语法</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">并列对比版式</td>
        <td>可以</td><td>不行</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
      <tr>
        <td class="mark">内容可重新生成</td>
        <td>不行</td><td>可以</td>
        <td><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5 5.5 11 12 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></td>
      </tr>
    </tbody>
  </table>
</div>
```

## 流程图

这张卡节点只描边不填充，箭头 1.5px，比 Mermaid 的默认样式更轻。

```h5-renderer
<div class="flow">
  <style>
    .flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .flow .node { padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; color: var(--text-normal); }
    .flow .node small { display: block; color: var(--text-muted); }
    .flow .arrow { flex: 0 0 auto; color: var(--text-muted); }
    .flow svg { display: block; }
  </style>
  <div class="node">写一段 HTML<small>粘进笔记</small></div>
  <span class="arrow"><svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5H34" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M33 1.5 38 5l-5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <div class="node">切到阅读视图<small>插件接管</small></div>
  <span class="arrow"><svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5H34" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M33 1.5 38 5l-5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <div class="node">看到卡片<small>与笔记同主题</small></div>
</div>
```

想自己写一张？在命令面板里执行「复制给 AI 的要求」，把它粘给任何 AI，让它照这个约定输出。
