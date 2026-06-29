/**
 * 自定义回收站模块
 *
 * 文件移动时追加 .trashed-<时间戳> 后缀：
 *   assets/note/img.webp → assets/.trash/note/img.trashed-20260629-160000000.webp
 *
 * 过期判断直接从文件名解析，不需要 stat()，零 I/O。
 */

import { normalizePath, TFile } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";
import { formatTimestamp, getReferencedPaths } from "./utils";

const TRASH_DIR = ".trash";

// 匹配 .trashed-YYYYMMDD-HHmmssSSS 后缀
const TRASHED_RE = /\.trashed-(\d{8}-\d{9})\./;

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/** 从文件名解析移入回收站的时间戳（毫秒） */
const parseTrashedTime = (filename: string): number | null => {
  const m = filename.match(TRASHED_RE);
  if (!m) return null;

  const ts = m[1]; // "20260629-160000000"
  const [datePart, timePart] = ts.split("-");

  const y = +datePart.slice(0, 4);
  const mo = +datePart.slice(4, 6) - 1;
  const d = +datePart.slice(6, 8);
  const h = +timePart.slice(0, 2);
  const mi = +timePart.slice(2, 4);
  const s = +timePart.slice(4, 6);
  const ms = +timePart.slice(6, 9);

  return Date.UTC(y, mo, d, h, mi, s, ms);
};

const isExpired = async (
  plugin: ObsidianAttachmentCorePlugin,
  filename: string,
  retentionHours: number,
): Promise<boolean> => {
  const trashedTime = parseTrashedTime(filename);
  if (trashedTime !== null) {
    return Date.now() - trashedTime > retentionHours * 60 * 60 * 1000;
  }
  // 兼容旧格式（没有 .trashed- 后缀的文件），回退到 stat
  const stat = await plugin.app.vault.adapter.stat(filename);
  if (!stat) return false;
  const ageMs = Date.now() - (stat.mtime ?? 0);
  return ageMs > retentionHours * 60 * 60 * 1000;
};

/** 去掉 .trashed-<ts> 后缀，还原原始文件名 */
const stripTrashedSuffix = (path: string): string =>
  path.replace(/\.trashed-\d{8}-\d{9}\./, ".");

// ---------------------------------------------------------------------------
// 移入回收站
// ---------------------------------------------------------------------------

export const moveToTrash = async (
  plugin: ObsidianAttachmentCorePlugin,
  filePaths: string[],
): Promise<number> => {
  const { vault } = plugin.app;
  const assetsRoot = normalizePath(plugin.settings.assetsRoot);
  let moved = 0;

  for (const filePath of filePaths) {
    const file = vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) continue;

    const relative = filePath.slice(assetsRoot.length + 1);
    // 追加 .trashed-<ts> 到扩展名前
    const ts = formatTimestamp(new Date());
    const trashedRelative = relative.replace(/\.([^.]+)$/, `.trashed-${ts}.$1`);
    const trashPath = normalizePath(`${assetsRoot}/${TRASH_DIR}/${trashedRelative}`);

    try {
      const trashDir = trashPath.slice(0, trashPath.lastIndexOf("/"));
      if (!(await vault.adapter.exists(trashDir))) {
        await vault.createFolder(trashDir);
      }
      await vault.rename(file, trashPath);
      moved++;
    } catch {
      // 单文件失败不影响其余
    }
  }

  return moved;
};

// ---------------------------------------------------------------------------
// 回收站扫描：恢复 + 过期清理
// ---------------------------------------------------------------------------

interface TrashScanResult {
  restored: number;
  expired: number;
}

export const scanTrash = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<TrashScanResult> => {
  const { vault } = plugin.app;
  const assetsRoot = normalizePath(plugin.settings.assetsRoot);
  const trashRoot = normalizePath(`${assetsRoot}/${TRASH_DIR}`);
  const retentionHours = plugin.settings.trashRetentionHours;
  const referenced = getReferencedPaths(plugin);

  if (!(await vault.adapter.exists(trashRoot))) {
    return { restored: 0, expired: 0 };
  }

  let restored = 0;
  let expired = 0;

  const walkTrash = async (dir: string): Promise<void> => {
    const listed = await vault.adapter.list(dir);

    for (const subDir of listed.folders) {
      await walkTrash(subDir);
    }

    for (const trashPath of listed.files) {
      const normalized = normalizePath(trashPath);

      // 反推原始路径
      const relative = normalized.slice(trashRoot.length + 1);
      const originalPath = normalizePath(`${assetsRoot}/${stripTrashedSuffix(relative)}`);

      if (referenced.has(originalPath)) {
        // ---- 恢复（还原文件名） ----
        const file = vault.getAbstractFileByPath(normalized);
        if (file instanceof TFile) {
          try {
            const restoreDir = originalPath.slice(0, originalPath.lastIndexOf("/"));
            if (!(await vault.adapter.exists(restoreDir))) {
              await vault.createFolder(restoreDir);
            }
            // 恢复时用 stripped 路径
            await vault.rename(file, originalPath);
            restored++;
          } catch {
            // 恢复失败，跳过
          }
        }
      } else if (await isExpired(plugin, normalized, retentionHours)) {
        const file = vault.getAbstractFileByPath(normalized);
        if (file instanceof TFile) {
          try {
            await vault.delete(file);
            expired++;
          } catch {
            // 删除失败，跳过
          }
        }
      }
    }
  };

  await walkTrash(trashRoot);
  await removeEmptyDirs(vault, trashRoot);

  return { restored, expired };
};

const removeEmptyDirs = async (
  vault: import("obsidian").Vault,
  dir: string,
): Promise<void> => {
  const listed = await vault.adapter.list(dir);

  for (const subDir of listed.folders) {
    await removeEmptyDirs(vault, subDir);
  }

  const after = await vault.adapter.list(dir);
  if (
    after.files.length === 0 &&
    after.folders.length === 0 &&
    dir.includes(TRASH_DIR)
  ) {
    try {
      await vault.adapter.rmdir(dir, false);
    } catch {
      // 忽略
    }
  }
};
