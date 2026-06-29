# Obsidian Hub

我的 Obsidian 插件合集，每个插件解决一个具体问题。

> 如果这个项目对你有用，欢迎点个 ⭐ Star 鼓励一下～

## 安装

在 [Releases](https://github.com/G1Ser/obsidian-hub/releases) 页面找到对应插件的 zip，下载后解压到 `<vault>/.obsidian/plugins/<插件名>/`，然后在 Obsidian 设置里启用。

## 插件

### obsidian-attachment

拖拽或粘贴图片到笔记时，自动：

- **归置** — 存入 `assets/<笔记路径>/`，告别散落一地的附件
- **压缩** — png / jpg 自动转 WebP，节省存储空间
- **去重** — 时间戳命名 `YYYYMMDD-HHmmssSSS`，不会覆盖旧文件

**可配置项：**

| 设置                   | 默认值           | 说明                       |
| ---------------------- | ---------------- | -------------------------- |
| Assets root folder     | `assets`         | 附件存放根目录             |
| Convert images to WebP | 开启             | 是否自动转 WebP            |
| WebP quality           | `80`             | 编码质量 (1–100)           |
| WebP extensions        | `png, jpg, jpeg` | 需要转换的后缀（逗号分隔） |
