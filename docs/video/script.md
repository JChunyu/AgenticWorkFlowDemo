# 30 秒宣传片 · 配音稿

片子是 `docs/video/h5-card-renderer-{zh,en}.mp4`，1920×1080、30fps、31 秒、有解说。
画面全部由插件自己的管线实时画出，配音由本文件驱动：改这里的字，重跑 `npm run voice`，
30 秒后视频换一版口播，画面一帧不动。

---

## 一句话主张

- **中文**：AI 递给你的那一段 HTML，应该长得像这篇笔记本身，而不是一段贴错地方的代码。
- **English**: The HTML an AI hands you should look like the note it lands in — not like code that fell into it.

## 给谁看

已经在 Obsidian 里用 AI 写东西的人：让模型整理一段对比、排一张时间线、做一张成绩卡，
拿到手是一坨 HTML，粘进笔记里要么是一屏代码，要么样式跟笔记打架。他们不是不会写 CSS，
是不想为了看一眼结果就破坏笔记的版式。

## 语气

克制、工程师对工程师。不喊"颠覆""革命"，给的是可验证的事实：不执行脚本、不发请求、
不写回文件。解说只做一件事——把画面上正在发生的事说出来，让观众知道该看哪儿。

## 分镜与配音

| 时间 | 画面 | 中文配音 | English narration |
|---|---|---|---|
| 00:00–00:04 | 标题 + 一张已经渲染好的灯开关卡片 | 大模型给你一段 HTML，它该长得像笔记本身。 | AI writes HTML. Your note should still look like your note. |
| 00:04–00:09 | 一张卡三个标签页，光标依次点过 | 标签页、开关、折叠面板，全靠 CSS，没有脚本。 | Tabs, switches, panels — all CSS. Not one line of script. |
| 00:09–00:14 | 答题卡，点错变红、点对变绿 | 它还会回应你：答错变红，答对变绿，解释跟着出来。 | It answers back. Green when you're right, red when you're wrong. |
| 00:14–00:18 | 三张照片，逐张亮起图注 | 照片内联在卡片里，一个请求都不发，断网也在。 | Photos live inside the note as data URLs. Nothing is fetched. |
| 00:18–00:22 | 同一个块，硬切浅色 / 深色 | 同一个块，一个字没改，亮暗两种主题。 | Same block, untouched. Light theme, dark theme. |
| 00:22–00:26 | 承诺卡，两条 `<details>` 展开 | 不执行脚本，不发请求，文件也不会被改。 | No scripts. No requests. Your file is never written. |
| 00:26–00:31 | 片尾，URL 淡入 | H5 卡片渲染器，开源，链接在屏幕上。 | H5 Card Renderer. Open source. Link on screen. |

英文 7 句共 67 词，中文 7 句共 123 字（含拉丁字母），都在各自窗口内读完，最后一句落在画面切走之前。

## 每一句在卖什么

| 画面里的东西 | 观众听到的 | 为什么这么翻 |
|---|---|---|
| 卡片和笔记同主题、同栏宽 | "它该长得像笔记本身" | 不说"支持主题变量"，说观众一眼能验证的结果 |
| radio + `:checked` 做的标签页 | "全靠 CSS，没有脚本" | "没有脚本"是 Obsidian 用户的第一道顾虑，必须先拆 |
| 答对变绿、答错变红 | "它会回应你" | 交互不是卖点，**能在笔记里交互**才是 |
| 照片是 `data:` URL | "一个请求都不发，断网也在" | 隐私不靠形容词，靠一句可复现的测试条件 |
| 浅色 / 深色硬切 | "一个字没改" | 直接回答"是不是要写两套样式" |
| 不执行、不联网、不写回 | 同左 | 三条硬承诺，对应插件最容易被质疑的三件事 |

没写进去的：性能数字、插件体积、Star 数——没有实测就不说。

## 重录 / 换语言

```bash
npm run voice          # 中英两版都重做
npm run voice -- zh    # 只做中文
npm run voice -- check # 只测每句时长，不动视频
```

- 文案在 `tools/video/copy.mjs`，每句带一个 `from` / `to` 窗口；句子比窗口长会直接报错，
  不会悄悄拖到下一个镜头。
- 声音用系统语音合成（中文 Tingting、英文 Samantha），不联网、不用素材库，同一台机器上重跑结果一致。
- 视频流是 `-c:v copy` 混进去的，配音换了画面不会重新编码。
- 中文稿里避开"AI"两个字母：系统语音会读成"阿姨"。改用"大模型"，也更符合这个圈子的说法。
