## 项目概述

**obsidian-attachment** 是一个 Obsidian 附件管理插件，核心功能：
- 自动归档附件到 `Assets/<笔记路径>/`
- 自动转换图片为 WebP 格式
- 时间戳命名避免冲突
- 清理孤立附件

## 文件结构

```
plugins/obsidian-attachment/
├── src/
│   ├── main.ts              # 插件入口，注册命令和钩子
│   ├── settings.ts          # 配置管理和设置面板
│   ├── attachment-handler.ts # 核心附件保存逻辑
│   ├── cleanup.ts           # 孤立附件扫描和清理
│   └── utils.ts             # 工具函数（时间戳、目录、图片转换）
├── manifest.json            # Obsidian 插件元数据
├── package.json             # npm 包配置
├── esbuild.config.mjs       # 构建配置
├── tsconfig.json            # TypeScript 配置
└── dist/                    # 构建输出目录
```

## 核心模块与技术要点

### //src/main.ts 插件入口

拦截 `app.saveAttachment` 方法，替换为自定义保存逻辑，注册清理命令，启动时自动执行静默清理。

关键函数：
- `onload()` - 初始化插件，拦截 saveAttachment，注册命令
- `onunload()` - 恢复原始 saveAttachment

### //src/attachment-handler.ts 附件保存逻辑

检查是否需要转换为 WebP，计算目标路径，生成时间戳文件名，使用 `vault.getAvailablePath` 避免冲突，创建文件。

关键函数：
- `createSaveAttachment(plugin)` - 返回自定义的 saveAttachment 函数

### //src/cleanup.ts 清理逻辑

从 `metadataCache.resolvedLinks` 获取所有被引用的附件路径，递归扫描 `Assets/` 目录，对比找出孤立文件，移动到系统回收站。

关键函数：
- `findOrphanedAssets(plugin)` - 扫描孤立附件
- `silentClean(plugin)` - 静默清理（启动时）
- `runCleanup(plugin)` - 用户手动清理（带确认对话框）

### //src/utils.ts 工具函数

关键函数：
- `formatTimestamp(date)` - 生成 `YYYYMMDD-HHmmssSSS` 格式时间戳
- `ensureFolder(vault, path)` - 递归创建目录
- `normalizeExtension(ext)` - 标准化文件扩展名
- `convertImageToWebp(data, quality)` - Canvas API 转换图片为 WebP

### //src/settings.ts 配置管理

配置项：
- `assetsRoot` - 附件根目录，默认 'Assets'
- `enableWebp` - 是否启用 WebP 转换
- `webpQuality` - WebP 质量 (1-100)
- `webpExtensions` - 需转换的扩展名列表

关键函数：
- `loadSettings()` - 加载配置
- `saveSettings()` - 保存配置
- `display()` - 渲染设置面板

## Obsidian API 关键点

- **saveAttachment 拦截**：通过替换 `app.saveAttachment` 实现自定义保存逻辑
- **metadataCache.resolvedLinks**：获取所有 Markdown 文件中的链接关系
- **vault.getAvailablePath**：自动处理文件名冲突
- **vault.adapter.list**：递归列出目录内容

## WebP 转换

使用浏览器原生 Canvas API：`createImageBitmap(blob) → canvas.drawImage → canvas.toBlob('image/webp')`

## 数据流

### 附件保存流程

用户粘贴图片 → Obsidian 调用 app.saveAttachment → 拦截 → createSaveAttachment → 检查 enableWebp && 扩展名匹配 → convertImageToWebp (可选) → 计算路径: Assets/<笔记路径>/<时间戳>.webp → ensureFolder 创建目录 → vault.getAvailablePath 避免冲突 → vault.createBinary 创建文件

### 清理流程

启动时 / 用户命令 → metadataCache.resolvedLinks → 获取引用路径 → 递归扫描 Assets/ 目录 → 对比找出孤立文件 → vault.trash 移到回收站

## 开发注意事项

### 文件路径处理

- 所有路径使用 `normalizePath()` 标准化
- 扩展名统一为小写，去除前导点
- 路径分隔符统一为 `/`

### 错误处理

- WebP 转换失败时保留原格式
- 清理失败时静默跳过
- 目录创建失败会抛出异常

### 性能优化

- 启动清理使用 `metadataCache.on('resolved')` 确保元数据已加载
- 目录检查使用快路径（先检查是否存在）
- 递归扫描使用异步遍历

## 相关文件

- [README.md](./README.md) - 用户手册
- [manifest.json](./manifest.json) - 插件元数据
- [package.json](./package.json) - 构建配置
