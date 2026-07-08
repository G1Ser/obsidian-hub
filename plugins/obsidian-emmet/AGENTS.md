## 项目概述

**obsidian-emmet** 是一个 Emmet 缩写展开插件，核心功能：
- 输入缩写快速生成 HTML 结构
- 支持嵌套、重复、内容等语法
- 兼容 Easy Typing 插件

## 文件结构

```
plugins/obsidian-emmet/
├── src/
│   ├── main.ts              # 插件入口，注册命令
│   └── emmet.ts             # Emmet 解析和展开引擎
├── tests/
│   └── emmet.test.ts        # 单元测试
├── manifest.json            # Obsidian 插件元数据
├── package.json             # npm 包配置
├── esbuild.config.mjs       # 构建配置
├── tsconfig.json            # TypeScript 配置
└── vitest.config.ts         # 测试配置
```

## 核心模块与技术要点

### //src/main.ts 插件入口

注册 `expand-abbreviation` 命令，识别光标前或选中的缩写文本，调用 emmet.ts 解析并展开。

关键函数：
- `expandAtCursor(editor)` - 在光标位置展开缩写
- `onload()` - 注册命令

### //src/emmet.ts Emmet 解析和展开引擎

解析 Emmet 缩写字符串为节点树，递归展开为 HTML 字符串。支持 `>`（嵌套）、`+`（兄弟）、`*n`（重复）、`{text}`（内容）等语法。

关键函数：
- `parse(abbrev)` - 解析缩写字符串为兄弟节点数组
- `parseGroup(group)` - 解析 `>` 分隔的层级组
- `parseElement(raw)` - 解析单个元素（tag{content}*n）
- `expand(nodes)` - 顶层入口，展开节点数组为 HTML
- `expandNode(node, indent)` - 单节点递归展开为 HTML

## Emmet 语法

### 基本语法

- `tag` - 生成标签 `<tag></tag>`
- `tag*n` - 重复 n 次
- `tag{text}` - 添加内容
- `>` - 子级嵌套
- `+` - 同级兄弟

### 解析流程

缩写字符串 → split('+') → parseGroup → split('>') → parseElement → 构建嵌套树 → expandNode → 生成 HTML

## 兼容性处理

- 兼容 Easy Typing 插件，自动处理 `*` 和数字之间的空格（如 `span* 10`）
- 光标前识别：使用正则 `/([a-z][\w*>{}+\-]+)$/i` 匹配光标前的缩写
- 选中文本：直接展开选中的内容

## 开发注意事项

### 解析顺序

- `parseElement` 支持 `{content}` 和 `*n` 任意顺序
- 默认标签为 `div`
- 从右往左构建嵌套树（`parseGroup`）

### 格式化规则

- 有子节点或内容包含换行符时使用块级格式（缩进）
- 否则使用行内格式

## 相关文件

- [README.md](./README.md) - 用户手册
- [manifest.json](./manifest.json) - 插件元数据
- [tests/emmet.test.ts](./tests/emmet.test.ts) - 单元测试