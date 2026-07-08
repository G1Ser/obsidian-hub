# Obsidian Hub

我的 Obsidian 插件合集。

> 如果这个项目对你有用，欢迎点个 ⭐ Star 鼓励一下～

## 安装

- 在 [Releases](https://github.com/G1Ser/obsidian-hub/releases) 页面找到对应插件的 zip，下载后解压到 `<vault>/.obsidian/plugins/<插件名>/`，然后在 Obsidian 设置里启用。

- 下载整个仓库

```bash
# 克隆项目
git clone https://github.com/G1Ser/obsidian-hub.git
cd obsidian-hub

# 安装依赖
pnpm bootstrap

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置你的 Obsidian Vault 路径
# OBSIDIAN_VAULT_PATH=C:\Users\YourName\Documents\MyVault

# 构建所有插件
pnpm build

# 或构建单个插件
pnpm build:attachment  # 构建 obsidian-attachment
pnpm build:emmet       # 构建 obsidian-emmet
pnpm build:pdf         # 构建 obsidian-claude-pdf
```

## 插件

### [obsidian-attachment](./plugins/obsidian-attachment/README.md)

智能附件管理插件，让附件井井有条。

拖拽或粘贴图片到笔记时，自动：

- **归置** — 存入 `Assets/<笔记路径>/`，告别散落一地的附件
- **压缩** — PNG/JPG 自动转 WebP，节省存储空间
- **去重** — 时间戳命名 `YYYYMMDD-HHmmssSSS`，不会覆盖旧文件
- **清理** — 后台扫描孤立附件，移入回收站

### [obsidian-emmet](./plugins/obsidian-emmet/README.md)

Emmet 缩写展开插件，快速生成 HTML 结构。

在编辑器里输入缩写，一键展开为 HTML：

- `div>span*2` → `<div><span></span><span></span></div>`
- `table>tr*3>td*4` → 3 行 4 列的表格
- `ul>li*3{Item}` → 3 个带文本的 `<li>`
- `div+p` → `<div></div><p></p>` 同级兄弟

### [obsidian-claude-pdf](./plugins/obsidian-claude-pdf/README.md)

将 Markdown 文件导出为 Claude 风格的精美 PDF 文档。

功能特性：

- **Claude 风格** - 采用 Claude 官方文档的排版风格，简洁优雅
- **智能分页** - 自动处理标题、表格、图片等元素的跨页问题
- **水印支持** - 可添加自定义水印，保护文档版权
- **格式兼容** - 完美支持 Obsidian 语法，包括 callout、数学公式、代码高亮等
