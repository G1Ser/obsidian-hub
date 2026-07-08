# Obsidian Attachment

智能附件管理插件，让附件井井有条。

## 功能特性

拖拽或粘贴图片到笔记时，自动：

- **归置** — 存入 `Assets/<笔记路径>/`，告别散落一地的附件
- **压缩** — PNG/JPG 自动转 WebP，节省存储空间
- **去重** — 时间戳命名 `YYYYMMDD-HHmmssSSS`，不会覆盖旧文件
- **清理** — 后台扫描孤立附件，移入回收站

## 配置指南

打开 **设置 → 第三方插件 → Attachment Core** 进行配置。

### Assets root folder

附件保存的根文件夹名称。

- 默认值：`Assets`
- 示例：设置为 `Assets` 后，笔记 `Notes/ProjectA/note.md` 的附件会保存到 `Assets/Notes/ProjectA/`

### Convert images to WebP

是否自动将图片转换为 WebP 格式。

- 默认值：开启
- 说明：WebP 格式体积更小，质量损失小，推荐开启

### WebP quality

WebP 转换的质量等级（1-100）。

- 默认值：`80`
- 说明：数值越高画质越好，文件越大；推荐 70-85 之间

### WebP image extensions

需要转换为 WebP 的图片格式，用逗号分隔。

- 默认值：`png, jpg, jpeg`
- 示例：`png, jpg, jpeg, bmp`

## 使用方法

### 保存附件

直接拖拽或粘贴图片到笔记中，插件会自动：
1. 按笔记路径归档到 `Assets/<笔记路径>/`
2. 使用时间戳命名避免冲突
3. 自动转换为 WebP 格式（如已启用）

### 清理孤立附件

运行命令 **Clean orphaned assets**：
- 打开命令面板（`Ctrl+P` / `Cmd+P`）
- 搜索 "Clean orphaned assets"
- 执行后会扫描所有未被引用的附件并移入回收站

插件也会在启动时自动静默清理孤立附件。
