## 项目概述

**obsidian-claude-pdf** 是一个 Claude 风格 PDF 导出插件，核心功能：
- 将 Markdown 转换为 Claude 风格的精美 PDF
- 智能分页处理各种元素
- 支持水印、页边距等配置
- 完美兼容 Obsidian 语法

## 文件结构

```
plugins/obsidian-claude-pdf/
├── src/
│   ├── main.ts              # 插件入口，注册导出命令
│   ├── settings.ts          # 配置管理和设置面板
│   └── utils/
│       ├── converter.ts      # Markdown 到 HTML 转换
│       ├── postCss.ts       # CSS 处理和前缀添加
│       └── paged/          # 分页引擎
│           ├── index.ts      # 分页引擎入口
│           ├── types.ts      # 类型定义
│           ├── options.ts    # 配置合并
│           ├── prepare.ts    # 文档准备
│           ├── normalize.ts  # DOM 清洗
│           ├── layout.ts     # 页面布局管理
│           ├── append.ts     # 元素追加逻辑
│           └── rules/        # 分页规则
│               ├── index.ts   # 规则注册
│               ├── callout.ts # Callout 处理
│               ├── heading.ts # 标题处理
│               ├── table.ts   # 表格处理
│               ├── list.ts    # 列表处理
│               ├── image.ts   # 图片处理
│               └── default.ts # 默认处理
├── src/css/                # 样式文件
│   ├── claude-style.css    # Claude 风格样式
│   ├── mermaid-style.css    # Mermaid 图表样式
│   ├── katex-style.css     # 数学公式样式
│   └── obsidian-style.css  # Obsidian 语法样式
├── manifest.json            # Obsidian 插件元数据
├── package.json             # npm 包配置
├── esbuild.config.mjs       # 构建配置
└── tsconfig.json            # TypeScript 配置
```

## 核心模块与技术要点

### //src/main.ts 插件入口

注册 `export-current-md-to-pdf` 命令，读取当前 Markdown 文件，转换为 HTML，使用 Electron BrowserWindow 加载分页引擎，生成 PDF 文件。

关键函数：
- `exportCurrentFileToPdf()` - 导出当前文件为 PDF
- `buildHtml(md)` - 构建 HTML 文档（包含 CSS 和 Mermaid 配置）
- `buildWatermarkCss()` - 生成水印 CSS

### //src/settings.ts 配置管理

配置项：
- `marginTop`, `marginRight`, `marginBottom`, `marginLeft` - 页边距 (mm)
- `outputDir` - 输出目录
- `watermark` - 是否启用水印
- `watermarkText` - 水印文字
- `watermarkColor` - 水印颜色
- `watermarkOpacity` - 水印透明度 (0-1)
- `watermarkSize` - 水印字体大小 (px)

关键函数：
- `loadSettings()` - 加载配置
- `saveSettings()` - 保存配置
- `display()` - 渲染设置面板

### //src/utils/converter.ts Markdown 转换

使用 marked 库将 Markdown 转换为 HTML，支持 Obsidian 特殊语法（callout、内部链接、高亮等），使用 Shiki 进行代码高亮。

关键函数：
- `markdownToHtml(md)` - Markdown 转 HTML 主入口
- `removeYamlFrontmatter(md)` - 移除 YAML frontmatter
- `convertCallouts(md)` - 转换 Obsidian callout
- `preprocessMarkdown(md)` - 预处理 Markdown
- `highlightCodeBlocks` - Shiki 代码高亮

### //src/utils/postCss.ts CSS 处理

使用 PostCSS 处理 CSS 文件，为 Claude 样式添加前缀，避免样式冲突。

关键函数：
- `loadCss(app, path, prefix)` - 加载并处理 CSS 文件

### //src/utils/paged/index.ts 分页引擎入口

等待字体和 Mermaid 渲染完成，清洗 DOM，创建 A4 页面布局，按规则分页元素。

关键函数：
- `paged(options)` - 分页引擎主入口

### //src/utils/paged/layout.ts 页面布局管理

管理 PDF 页面创建和溢出检测，提供新页面创建、元素追加、溢出检测等核心功能。

关键函数：
- `createLayout(source, options)` - 创建页面布局
- `newPage()` - 创建新页面
- `isOverflow()` - 检测当前页是否溢出
- `clone(element)` - 克隆元素

### //src/utils/paged/append.ts 元素追加逻辑

遍历元素数组，按规则分页处理，处理溢出和分页逻辑。

关键函数：
- `layoutBlocks(blocks, layout, options)` - 按规则分页元素

### //src/utils/paged/rules/ 分页规则

为不同类型元素定义分页规则，处理标题、表格、图片、callout、列表等特殊元素的跨页问题。

关键函数：
- `imageRule` - 图片分页规则（自动缩放）
- `headingRule` - 标题分页规则（避免孤立）
- `tableRule` - 表格分页规则（保持完整性）
- `calloutRule` - Callout 分页规则
- `listRule` - 列表分页规则
- `defaultRule` - 默认分页规则

## 导出流程

读取 Markdown → markdownToHtml 转换 → 构建 HTML（包含 CSS）→ 创建 Electron BrowserWindow → 加载 paged.js → 执行分页 → printToPDF 生成 PDF → 保存文件

## 分页引擎流程

等待字体和 Mermaid → normalizeDocument 清洗 DOM → 收集元素块 → createLayout 创建页面 → layoutBlocks 按规则分页 → 生成多页 HTML

## Obsidian 语法支持

- **Callout** - `> [!info]` 等语法转换为 HTML
- **内部链接** - `[[链接]]` 转换为 HTML 链接
- **高亮文本** - `==文本==` 转换为 `<mark>`
- **数学公式** - KaTeX 格式支持
- **代码高亮** - Shiki 语法高亮
- **Mermaid** - 流程图、时序图等
- **YAML frontmatter** - 自动移除

## 技术要点

### Electron API

- **BrowserWindow** - 创建隐藏窗口加载 HTML
- **webContents.executeJavaScript** - 执行分页脚本
- **printToPDF** - 生成 PDF 文件

### 分页策略

- **图片** - 自动缩放适应页面（最小高度 300px，步进 24px）
- **标题** - 避免标题孤立在页面底部
- **表格** - 保持表格完整性，不跨页分割
- **列表** - 尽量保持列表项在同一页

### CSS 处理

- **PostCSS** - 处理 CSS 添加前缀
- **Claude 风格** - 使用官方文档的字体和颜色
- **响应式** - 适配 A4 页面尺寸

## 开发注意事项

### 性能优化

- 使用隐藏的 BrowserWindow 避免闪烁
- 异步等待字体和 Mermaid 渲染完成
- 分页规则按优先级匹配

### 错误处理

- PDF 生成失败时显示通知
- 临时 HTML 文件在 finally 中清理
- BrowserWindow 在完成后销毁

### 样式隔离

- Claude 样式使用 `.claude-root` 前缀
- 避免与 Obsidian 界面样式冲突

## 相关文件

- [README.md](./README.md) - 用户手册
- [manifest.json](./manifest.json) - 插件元数据
- [package.json](./package.json) - 构建配置