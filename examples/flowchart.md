# 流程图：一个块从粘贴到卡片

主流程在左，右边那条虚线是唯一的岔路——fence 名不对，插件就当没看见。用 HTML 排而不是画成一张图，好处是节点里的字仍然可以选中、可以改，字号跟着笔记走。

```h5-renderer
<div class="flow">
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
    <div class="node">在笔记里写一段 HTML<small>围在 h5-renderer 里</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node gate">fence 名对得上吗<small>只认小写的 h5-renderer</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">清洗<small>script、on*、远程引用在显示前剥掉</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">渲染<small>放进 shadow root，继承笔记的变量</small></div>
    <span class="arrow"><svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0v14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 12l4 5 4-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="node">你看到一张卡<small>同主题、同宽度、同字号</small></div>
  </div>
  <div class="side">
    <span class="cap">对不上就走这条</span>
    <div class="node">原样留着<small>普通代码块，和装插件之前一模一样</small></div>
  </div>
</div>
```

同一个块还有三个可能的出口，第二张卡把三种结局摆在一起：

```h5-renderer
<div class="outcomes">
  <style>
    .outcomes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .outcomes .col { padding: 12px 14px; border: 1px solid var(--background-modifier-border); border-radius: 10px; }
    .outcomes .tag { display: inline-block; margin-bottom: 6px; font-size: 0.72em; letter-spacing: 0.04em; color: var(--text-accent); }
    .outcomes h4 { margin: 0 0 6px; font-size: 0.95em; font-weight: 600; color: var(--text-normal); }
    .outcomes p { margin: 0; font-size: 0.84em; line-height: 1.55; color: var(--text-muted); }
    @media (max-width: 520px) { .outcomes { grid-template-columns: 1fr; } }
  </style>
  <div class="col">
    <span class="tag">顺利</span>
    <h4>卡片</h4>
    <p>渲染在 50ms 预算内完成，当场替换掉代码块。</p>
  </div>
  <div class="col">
    <span class="tag">超预算</span>
    <h4>源码加一条提示</h4>
    <p>越过 500ms 立刻降级；点「预览」可以再渲染一次。</p>
  </div>
  <div class="col">
    <span class="tag">不是这个 fence</span>
    <h4>普通代码块</h4>
    <p>插件完全不碰它，控制台也不会多一句警告。</p>
  </div>
</div>
```
