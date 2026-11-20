# 时间线：一个块的四步，以及每一步的代价

竖线是 CSS 画的，圆点也行；比截图好的地方在于，加一步就是加一个 `div`，字号、主题色全都自动跟着笔记走。

```h5-renderer
<div class="timeline">
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
      <div class="head"><span class="step">01 识别</span><span class="badge">扫描，不执行</span></div>
      <p class="desc">只在行首找 fence，命中 <code>h5-renderer</code> 才收下这段文本。别的 fence 连读都不读。</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">02 清洗</span><span class="badge">0 个网络请求</span></div>
      <p class="desc">脚本、事件属性、远程字体与图片在进入 shadow root 之前就被去掉；去掉的东西会出现在提示条里。</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot filled"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">03 渲染</span><span class="badge">50ms / 500ms</span></div>
      <p class="desc">同步渲染并计时。越过 50ms，下一次重渲染降级为源码；越过 500ms，当场降级。</p>
    </div>
  </div>
  <div class="row">
    <div class="rail"><span class="dot"></span><span class="line"></span></div>
    <div class="body">
      <div class="head"><span class="step">04 重建</span><span class="badge">0 字节写回</span></div>
      <p class="desc">光标进块退回源码，移出、可见、文本确实变了才重建。滚出视野的块释放渲染产物，回来时重建。</p>
    </div>
  </div>
</div>
```

`code` 在卡里同样有效，等宽字体会跟随主题。想让某一步更显眼，把 `.dot` 换成实心，或者在 badge 上换成 `var(--text-accent)`。
