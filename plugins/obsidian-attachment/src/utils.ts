import { normalizePath, type Plugin } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";

// =========================================================================
// 时间戳
// =========================================================================
export const formatTimestamp = (date: Date): string => {
  const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
  ].join("");
};

// =========================================================================
// 目录
// =========================================================================

/**
 * 确保 vault 中存在指定目录路径（逐层创建）。
 *
 * @param vault - Obsidian 的 Vault 对象
 * @param folderPath - 相对于 vault 根的目录路径，如 "assets/notes/sub"
 */
export const ensureFolder = async (
  vault: Plugin["app"]["vault"],
  folderPath: string,
): Promise<void> => {
  // 快路径：已存在就返回
  if (await vault.adapter.exists(folderPath)) return;

  // 慢路径：逐层检查并创建
  const parts = folderPath.split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!(await vault.adapter.exists(current))) {
      await vault.createFolder(current);
    }
  }
};

// =========================================================================
// 引用扫描
// =========================================================================

/**
 * 从 metadataCache 构建 assets 目录下所有被引用文件的路径集合。
 * trash.ts 和 cleanup.ts 共用此函数。
 */
export const getReferencedPaths = (
  plugin: ObsidianAttachmentCorePlugin,
): Set<string> => {
  const assetsRoot = normalizePath(plugin.settings.assetsRoot);
  const referenced = new Set<string>();

  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;
  for (const targets of Object.values(resolvedLinks)) {
    for (const targetPath of Object.keys(targets)) {
      if (targetPath.startsWith(assetsRoot)) {
        referenced.add(normalizePath(targetPath));
      }
    }
  }

  return referenced;
};

// =========================================================================
// 后缀处理
// =========================================================================
export const normalizeExtension = (ext: string): string =>
  ext.trim().toLowerCase().replace(/^\./, "");

// =========================================================================
// 图片转换
// =========================================================================

/**
 * 把任意浏览器支持的图片格式转为 WebP。
 *
 * @param data   - 原始图片二进制数据
 * @param quality- WebP 编码质量 (0–1)，0.8 是较好的平衡点
 * @returns WebP 格式的 ArrayBuffer，失败时返回 null
 */
export const convertImageToWebp = async (
  data: ArrayBuffer,
  quality: number,
): Promise<ArrayBuffer | null> => {
  try {
    const blob = new Blob([data]);
    const bitmap = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", quality);
    });

    if (!webpBlob) return null;

    return await webpBlob.arrayBuffer();
  } catch {
    return null;
  }
};
