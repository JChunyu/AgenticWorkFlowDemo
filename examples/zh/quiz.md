# 一张可以作答的卡

三个关于本插件的问题，在阅读视图里就能作答。每个选项是一个 radio；对勾、叉和解释都靠兄弟选择器。没有计分，因为计分需要脚本。

```h5-renderer
<div class="quiz">
  <style>
    .quiz { display: grid; gap: 18px; }
    .quiz .q { display: grid; gap: 7px; }
    .quiz .q > p { margin: 0 0 2px; font-size: 0.94em; line-height: 1.55; color: var(--text-normal); }
    .quiz .opt { display: grid; }
    .quiz input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; }
    .quiz label { display: grid; grid-template-columns: 1.4em minmax(0, 1fr); gap: 6px; padding: 6px 8px; border: 1px solid transparent; border-radius: 7px; font-size: 0.86em; line-height: 1.5; color: var(--text-muted); cursor: pointer; }
    .quiz label::before { content: ""; justify-self: center; width: 0.62em; height: 0.62em; margin-top: 0.42em; border: 1.4px solid var(--text-faint); border-radius: 50%; }
    .quiz label:hover { background: var(--background-modifier-hover); }
    .quiz input:focus-visible + label { outline: 2px solid var(--text-accent); outline-offset: 1px; }
    .quiz input:checked + label { border-color: var(--background-modifier-border); color: var(--text-normal); }
    .quiz input:checked + label::before { border-color: var(--text-accent); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-accent); }
    .quiz .right input:checked + label { border-color: var(--text-success); color: var(--text-success); }
    .quiz .right input:checked + label::before { border-color: var(--text-success); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-success); }
    .quiz .wrong input:checked + label { border-color: var(--text-error); color: var(--text-error); }
    .quiz .wrong input:checked + label::before { border-color: var(--text-error); box-shadow: inset 0 0 0 3px var(--background-primary), inset 0 0 0 9px var(--text-error); }
    .quiz .why { margin: 0; padding: 0 0 0 1.9em; font-size: 0.82em; line-height: 1.6; color: var(--text-muted); display: none; }
    .quiz .q:has(input:checked) .why { display: block; }
  </style>
  <div class="q">
    <p>1. 某个块用的是 <code>html</code> 这个 fence，会怎样？</p>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-a"><label for="q1-a">照样出卡片——fence 名只是个形式</label></div>
    <div class="opt right"><input type="radio" name="fence" id="q1-b"><label for="q1-b">还是普通代码块</label></div>
    <div class="opt wrong"><input type="radio" name="fence" id="q1-c"><label for="q1-c">出卡片，但先给一条警告</label></div>
    <p class="why">只认 <code>h5-renderer</code>。其它 fence 与装插件之前渲染得一模一样——并且只会出现一次提示，指向正确的 fence。</p>
  </div>
  <div class="q">
    <p>2. 卡片里有个 <code>img</code>，地址是 https:// 开头，会怎样？</p>
    <div class="opt wrong"><input type="radio" name="image" id="q2-a"><label for="q2-a">照片正常加载</label></div>
    <div class="opt wrong"><input type="radio" name="image" id="q2-b"><label for="q2-b">显示一个裂图</label></div>
    <div class="opt right"><input type="radio" name="image" id="q2-c"><label for="q2-c">除了照片，其它都照常渲染</label></div>
    <p class="why">在画出第一个像素之前地址就被剥掉了，卡片其余部分不受影响。要用照片就把它内联成 <code>data:</code> URL，或者直接画成内联 SVG。</p>
  </div>
  <div class="q">
    <p>3. 渲染出来的卡片到底住在哪儿？</p>
    <div class="opt wrong"><input type="radio" name="home" id="q3-a"><label for="q3-a">就在笔记的 DOM 里</label></div>
    <div class="opt right"><input type="radio" name="home" id="q3-b"><label for="q3-b">在一个 shadow root 里</label></div>
    <div class="opt wrong"><input type="radio" name="home" id="q3-c"><label for="q3-c">在一个 iframe 里</label></div>
    <p class="why">每个块有自己独立的 shadow root。所以两张卡可以写同样的类名——同样的 id 也行——永远不会互相干扰。</p>
  </div>
</div>
```

注意少掉的东西：没有 `onclick`、没有状态对象、没有需要重渲染的界面。一个 `<details>` 或一组 radio 就够让笔记里的块有反应。
