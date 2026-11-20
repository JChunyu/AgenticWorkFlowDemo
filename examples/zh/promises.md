# 三条承诺，折起来

插件自己的那几条规矩，做成一张卡：三个 `details`，一个伪元素箭头，里面没有任何能执行的东西。

```h5-renderer
<div class="promises">
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
    <summary>什么都不执行</summary>
    <p><code>&lt;script&gt;</code>、<code>on*</code> 事件属性和 <code>javascript:</code> 链接在画出第一个像素之前就被去掉。剩下的是只受 CSS 影响的标记。</p>
  </details>
  <details>
    <summary>什么都不联网</summary>
    <p><code>&lt;link&gt;</code>、<code>@import</code>、远程字体、frame 以及一切会触发请求的属性都会被剥掉。要放图片只能用 <code>data:</code> URL 或内联 SVG——所以「零网络请求」是能在 devtools 里当场看见的。</p>
  </details>
  <details>
    <summary>笔记文件一个字节都不变</summary>
    <p>展开卡片、让某一块保持源码、滚过一屏：事后 markdown 逐字节一致，撤销栈也没动过。</p>
  </details>
</div>
```

编辑态里展开一条，卡片仍然是卡片——`summary` 的点击属于它自己。箭头是 `content` 里的一个字符，所以没有图标字体要加载。
