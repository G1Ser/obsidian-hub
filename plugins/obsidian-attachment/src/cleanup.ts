/**
 * 孤立资产清理模块
 */

import { Modal, Notice, normalizePath } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";
import { moveToTrash, scanTrash } from "./trash";
import { getReferencedPaths } from "./utils";

// ---------------------------------------------------------------------------
// 扫描
// ---------------------------------------------------------------------------

export const findOrphanedAssets = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<string[]> => {
  const { app, settings } = plugin;
  const assetsRoot = normalizePath(settings.assetsRoot);
  const trashDir = normalizePath(`${assetsRoot}/.trash`);
  const referenced = getReferencedPaths(plugin);

  const orphans: string[] = [];

  const walk = async (dir: string): Promise<void> => {
    const listed = await app.vault.adapter.list(dir);
    for (const subDir of listed.folders) {
      if (normalizePath(subDir) === trashDir) continue;
      await walk(subDir);
    }
    for (const filePath of listed.files) {
      const normalized = normalizePath(filePath);
      if (!referenced.has(normalized)) {
        orphans.push(normalized);
      }
    }
  };

  if (await app.vault.adapter.exists(assetsRoot)) {
    await walk(assetsRoot);
  }

  return orphans;
};

// ---------------------------------------------------------------------------
// 确认对话框
// ---------------------------------------------------------------------------

class CleanupModal extends Modal {
  private orphans: string[];
  private plugin: ObsidianAttachmentCorePlugin;

  constructor(
    app: import("obsidian").App,
    plugin: ObsidianAttachmentCorePlugin,
    orphans: string[],
  ) {
    super(app);
    this.plugin = plugin;
    this.orphans = orphans;
  }

  onOpen = (): void => {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", {
      text: `Found ${this.orphans.length} orphaned asset(s)`,
    });

    const listContainer = contentEl.createDiv({
      cls: "attachment-cleanup-list",
    });
    listContainer.style.maxHeight = "300px";
    listContainer.style.overflowY = "auto";
    listContainer.style.marginBottom = "1em";

    for (const path of this.orphans) {
      const row = listContainer.createDiv({ cls: "attachment-cleanup-row" });
      row.style.padding = "2px 0";
      row.style.fontSize = "0.9em";
      row.createSpan({ text: path });
    }

    const warning = contentEl.createEl("p", {
      text: "⚠️ These files will be moved to assets/.trash/. They can be restored if referenced again later.",
    });
    warning.style.color = "var(--text-warning)";
    warning.style.fontSize = "0.85em";

    const buttonRow = contentEl.createDiv({
      cls: "attachment-cleanup-buttons",
    });
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "0.5em";
    buttonRow.style.marginTop = "1em";

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const confirmBtn = buttonRow.createEl("button", {
      text: "Move to Trash",
      cls: "mod-cta",
    });
    confirmBtn.addEventListener("click", () => this.executeCleanup());
  };

  onClose = (): void => {
    const { contentEl } = this;
    contentEl.empty();
  };

  private executeCleanup = async (): Promise<void> => {
    const moved = await moveToTrash(this.plugin, this.orphans);

    // 同步检查回收站（可能恢复/清理过期文件）
    const { restored, expired } = await scanTrash(this.plugin);

    const parts: string[] = [];
    if (moved > 0) parts.push(`${moved} moved to trash`);
    if (restored > 0) parts.push(`${restored} restored`);
    if (expired > 0) parts.push(`${expired} expired`);

    new Notice(`Cleanup done: ${parts.join(", ")}.`);
    this.close();
  };
}

// ---------------------------------------------------------------------------
// 对外入口
// ---------------------------------------------------------------------------

/**
 * 手动触发（命令面板）：扫描 → 弹确认框 → 用户确认后删除。
 */
export const runCleanup = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<void> => {
  const orphans = await findOrphanedAssets(plugin);

  if (orphans.length === 0) {
    new Notice("No orphaned assets found.");
    return;
  }

  new CleanupModal(plugin.app, plugin, orphans).open();
};

/**
 * 静默扫描（定时器触发）。
 *
 * 同时做三件事：
 *  1. 扫描资产孤儿
 *  2. 检查回收站 → 恢复被重新引用的文件
 *  3. 检查回收站 → 永久删除过期文件
 *
 * 根据 autoCleanupSkipConfirm：
 *  - false：弹出可点击的 Notice → 用户点击 → 打开确认框
 *  - true：直接移入回收站 → 弹出结果通知
 */
export const runSilentScan = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<void> => {
  // 先扫回收站（恢复 + 过期清理）
  const trashResult = await scanTrash(plugin);

  // 再扫孤儿
  const orphans = await findOrphanedAssets(plugin);

  // 没有孤儿也没有回收站变动 → 完全静默
  if (
    orphans.length === 0 &&
    trashResult.restored === 0 &&
    trashResult.expired === 0
  ) {
    return;
  }

  if (orphans.length === 0) {
    // 只有回收站变动，没有新孤儿
    const parts: string[] = [];
    if (trashResult.restored > 0)
      parts.push(`${trashResult.restored} restored`);
    if (trashResult.expired > 0)
      parts.push(`${trashResult.expired} expired from trash`);
    new Notice(`Auto-scan: ${parts.join(", ")}.`);
    return;
  }

  // 有新孤儿
  if (plugin.settings.autoCleanupSkipConfirm) {
    const moved = await moveToTrash(plugin, orphans);
    const parts: string[] = [`${moved} moved to trash`];
    if (trashResult.restored > 0)
      parts.push(`${trashResult.restored} restored`);
    if (trashResult.expired > 0) parts.push(`${trashResult.expired} expired`);
    new Notice(`Auto-scan: ${parts.join(", ")}.`);
    return;
  }

  // 需要确认
  const trashNote =
    trashResult.restored > 0 || trashResult.expired > 0
      ? ` (${trashResult.restored} restored, ${trashResult.expired} expired)`
      : "";

  const notice = new Notice(
    `Found ${orphans.length} orphaned asset(s)${trashNote}. Click to review.`,
    0,
  );

  notice.messageEl.addEventListener("click", () => {
    notice.hide();
    new CleanupModal(plugin.app, plugin, orphans).open();
  });
};
