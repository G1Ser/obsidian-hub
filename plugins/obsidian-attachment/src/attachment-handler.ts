/**
 * 附件处理模块 — 替换 Obsidian 默认的 saveAttachment 行为。
 *
 * 保存流程：
 *  1. 如果启用了 WebP 且文件后缀匹配，先转为 WebP
 *  2. 根据当前笔记路径构造目标目录：<assetsRoot>/<notePath>/
 *  3. 以时间戳命名文件，写入 vault
 *
 * 为什么用"工厂函数"而不是类？
 *  因为 saveAttachment 作为一个替换函数被挂到 app 上，
 *  它只需要闭包捕获 plugin 实例来读取 settings，不需要额外状态。
 */

import { normalizePath, TFile } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";
import {
  formatTimestamp,
  ensureFolder,
  normalizeExtension,
  convertImageToWebp,
} from "./utils";

// App 上有一个未公开的 saveAttachment 方法，这里补一下类型
type VaultWithGetAvailablePath = import("obsidian").Plugin["app"]["vault"] & {
  getAvailablePath: (path: string, ext: string) => string;
};

/**
 * 创建一个替换版的 saveAttachment 函数。
 *
 * @param plugin - 插件实例，用来读 settings 和 app
 * @returns 符合 saveAttachment 签名的替换函数
 */
export const createSaveAttachment = (
  plugin: ObsidianAttachmentCorePlugin,
): ((name: string, ext: string, data: ArrayBuffer) => Promise<unknown>) => {
  return async (_name, ext, data) => {
    const { settings, app } = plugin;
    const vault = app.vault as VaultWithGetAvailablePath;

    // ---- Step 1: WebP 转换 ----
    let finalExt = ext;
    let finalData = data;
    const normalizedExt = normalizeExtension(ext);

    if (settings.enableWebp) {
      // 把用户输入的 "png, jpg, jpeg" 拆成数组，逐个规范化
      const webpExts = settings.webpExtensions
        .split(",")
        .map((s) => normalizeExtension(s));

      if (webpExts.includes(normalizedExt)) {
        // slider 存的是 1–100，toBlob 要 0–1
        const webpData = await convertImageToWebp(data, settings.webpQuality / 100);
        if (webpData) {
          finalExt = "webp";
          finalData = webpData;
        }
      }
    }

    // ---- Step 2: 确定目标目录 ----
    const activeFile = app.workspace.getActiveFile();
    const noteFolderPath =
      activeFile instanceof TFile && activeFile.extension === "md"
        ? normalizePath(activeFile.path.replace(/\.md$/i, ""))
        : "unknown";

    const targetFolder = normalizePath(`${settings.assetsRoot}/${noteFolderPath}`);
    await ensureFolder(app.vault, targetFolder);

    // ---- Step 3: 生成文件名并写入 ----
    const timestamp = formatTimestamp(new Date());
    const basePath = normalizePath(`${targetFolder}/${timestamp}`);
    // getAvailablePath 会自动处理重名：collision → 加序号 → 返回唯一路径
    const targetPath = vault.getAvailablePath(basePath, finalExt);

    return app.vault.createBinary(targetPath, finalData);
  };
};
