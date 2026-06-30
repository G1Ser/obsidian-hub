# Obsidian Hub

我的 Obsidian 插件合集。

> 如果这个项目对你有用，欢迎点个 ⭐ Star 鼓励一下～

## 安装

在 [Releases](https://github.com/G1Ser/obsidian-hub/releases) 页面找到对应插件的 zip，下载后解压到 `<vault>/.obsidian/plugins/<插件名>/`，然后在 Obsidian 设置里启用。

## 插件

### obsidian-attachment

拖拽或粘贴图片到笔记时，自动：

- **归置** — 存入 `assets/<笔记路径>/`，告别散落一地的附件
- **压缩** — png / jpg 自动转 WebP，节省存储空间
- **去重** — 时间戳命名 `YYYYMMDD-HHmmssSSS`，不会覆盖旧文件
- **清理** — 后台扫描孤立的附件，移入回收站

### obsidian-emmet

在编辑器里输入缩写，一键展开为 HTML：

- `div` → `<div></div>`
- `div.container#main` → `<div class="container" id="main"></div>`
- `div*3` → 三个 `<div></div>`
- `div>span*2` → `<div><span></span><span></span></div>`
- `table>tr*3>td*4` → 3 行 4 列的表格

用法：输入缩写后 `Ctrl+P` → **Expand Emmet abbreviation**。
