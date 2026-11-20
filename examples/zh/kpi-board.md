# 指标卡与看板

数字用 `tabular-nums`，竖着看不会左右跳；卡片之间只是 CSS grid，窄了自动折行，不需要另做一版。

```h5-renderer
<div class="kpi">
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
    <div class="cell"><div class="num">0</div><div class="label">网络请求</div></div>
    <div class="cell"><div class="num">0</div><div class="label">脚本被执行</div></div>
    <div class="cell"><div class="num">0</div><div class="label">写回笔记</div></div>
    <div class="cell"><div class="num">50<em>ms</em></div><div class="label">单块渲染预算</div></div>
  </div>
  <p class="foot">前三个是承诺，最后一个是可以被观察到的上限：越过它就先降级成源码。</p>
</div>
```

看板是三列 grid，每列顶上一个状态点。列宽用 `minmax(0, 1fr)`，长标题只会换行，不会把整张卡撑破。

```h5-renderer
<div class="board">
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
    <div class="title"><span class="dot"></span>待办</div>
    <div class="ticket"><b>移动端点按目标</b><span>按钮最小 32px</span></div>
    <div class="ticket"><b>导出 PDF 分页</b><span>不在文字行中间断开</span></div>
  </div>
  <div class="lane doing">
    <div class="title"><span class="dot"></span>进行中</div>
    <div class="ticket"><b>编辑态重建门控</b><span>光标在块内就不重建</span></div>
  </div>
  <div class="lane done">
    <div class="title"><span class="dot"></span>已完成</div>
    <div class="ticket"><b>阅读视图卡片</b><span>0.1.0</span></div>
    <div class="ticket"><b>Live Preview 渲染</b><span>0.1.1</span></div>
  </div>
</div>
```

两张卡、一篇笔记，彼此不知道对方存在：各自一个 shadow root，所以类名可以重名。
