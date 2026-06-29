# 开发指南

## 环境

```bash
pnpm bootstrap   # 安装依赖
pnpm dev         # watch 模式
pnpm build       # 构建所有插件
```

| 命令 | 实际执行 |
|---|---|
| `pnpm bootstrap` | `pnpm install` |
| `pnpm dev` | `pnpm -r dev` — 每个插件启动 esbuild watch |
| `pnpm build` | `pnpm -r build` — 一次性构建 |

## 项目结构

```
obsidian-hub/
├── .github/workflows/release.yml
├── package.json              # 公共 devDependencies
├── pnpm-workspace.yaml       # packages: ["plugins/*"]
└── plugins/
    └── obsidian-attachment/
        ├── manifest.json
        ├── esbuild.config.mjs
        └── src/
            ├── main.ts
            ├── settings.ts
            ├── attachment-handler.ts
            └── utils.ts
```

## 新增插件

```bash
mkdir -p plugins/my-plugin/src
```

`package.json` 模板：

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "private": true,
  "main": "main.js",
  "type": "commonjs",
  "scripts": {
    "build": "node esbuild.config.mjs",
    "dev": "node esbuild.config.mjs --watch"
  }
}
```

复刻 `esbuild.config.mjs` 和 `tsconfig.json`，公共依赖（esbuild / obsidian / typescript）由根目录统一管理。

## 发布

```bash
# 1. 更新 manifest.json 和 package.json 的 version
# 2. 构建
pnpm build

# 3. 打 tag + 推送，GitHub Actions 自动创建 Release
git tag obsidian-attachment@v2.0.0
git push origin obsidian-attachment@v2.0.0
```

## 技术栈

| 工具 | 用途 |
|---|---|
| [pnpm](https://pnpm.io/) | 包管理 + workspace |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [esbuild](https://esbuild.github.io/) | 打包 |
| [Obsidian API](https://github.com/obsidianmd/obsidian-api) | 插件运行时类型 |
