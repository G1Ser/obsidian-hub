/**
 * 工具模块 — 纯函数，无副作用，与 Obsidian 插件 API 耦合度最低。
 *
 * 按"单一职责"拆分：
 *  - formatTimestamp    → Date → "YYYYMMDD-HHmmssSSS" 字符串
 *  - ensureFolder       → 递归创建 vault 目录
 *  - normalizeExtension → ".PNG" / "JPEG" → "png" / "jpeg"
 *  - convertImageToWebp → ArrayBuffer → WebP ArrayBuffer (基于 Canvas API)
 */

import type { Plugin } from "obsidian";

// =========================================================================
// 时间戳
// =========================================================================

/**
 * 把 Date 格式化为紧凑时间戳：20260629-143025123
 * 用于附件文件名，避免重名且可排序。
 */
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
// 后缀处理
// =========================================================================

/**
 * 统一文件后缀格式：去点 → 去空格 → 小写
 *
 * 示例：
 *   ".PNG " → "png"
 *   "JPEG"  → "jpeg"
 */
export const normalizeExtension = (ext: string): string =>
  ext.trim().toLowerCase().replace(/^\./, "");

// =========================================================================
// 图片转换
// =========================================================================

/**
 * 把任意浏览器支持的图片格式转为 WebP。
 *
 * 原理：
 *   ArrayBuffer → Blob → createImageBitmap → Canvas 绘制 → toBlob("image/webp")
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
    // 1. ArrayBuffer → Blob → ImageBitmap（解码）
    const blob = new Blob([data]);
    const bitmap = await createImageBitmap(blob);

    // 2. 创建离屏 Canvas（不插入 DOM，纯内存操作）
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }

    // 3. 绘制 → 编码为 WebP
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close(); // 释放 GPU 资源

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", quality);
    });

    if (!webpBlob) return null;

    // 4. Blob → ArrayBuffer（Obsidian vault API 需要的格式）
    return await webpBlob.arrayBuffer();
  } catch {
    // 任何一步失败都静默降级：不转换，保留原格式
    return null;
  }
};
