## 项目概述

**obsidian-hub** 是一个 Obsidian 插件集合项目，采用 monorepo 结构管理多个相关插件。

## 项目结构

```
obsidian-hub/
├── plugins/              # 插件目录
├── package.json           # 根包配置
├── pnpm-workspace.yaml    # pnpm workspace 配置
└── scripts/              # 构建脚本
```

## 项目运转

使用 pnpm workspace 统一管理所有插件依赖，esbuild 快速构建 TypeScript 代码，共享 Obsidian API 和构建工具等依赖。

## 插件开发约束

完成插件开发或功能修改后，必须更新文档并测试验证：

1. **更新用户文档** - 参考 `plugins/<插件名>/README.md` 大纲
2. **更新技术文档** - 参考 `plugins/<插件名>/AGENTS.md` 大纲
3. **测试验证** - 确保功能正常，无 TypeScript 错误

### 文档规范

- **README.md** - 用户手册，面向普通用户
- **AGENTS.md** - 技术文档，面向开发者和 AI Agent

### 代码规范

- 使用 TypeScript 编写
- 遵循 Obsidian 插件开发规范
- 添加适当的错误处理
- 保持代码简洁和可维护性
