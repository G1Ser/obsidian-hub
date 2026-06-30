import { Modal, Notice, TFile, normalizePath } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";

// ---------------------------------------------------------------------------
// 扫描
// ---------------------------------------------------------------------------

const getReferencedPaths = (
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

export const findOrphanedAssets = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<string[]> => {
  const { app, settings } = plugin;
  const assetsRoot = normalizePath(settings.assetsRoot);
  const referenced = getReferencedPaths(plugin);

  const orphans: string[] = [];

  const walk = async (dir: string): Promise<void> => {
    const listed = await app.vault.adapter.list(dir);
    for (const subDir of listed.folders) {
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
// 批量删除（静默，用于启动时）
// ---------------------------------------------------------------------------

export const silentClean = async (
  plugin: ObsidianAttachmentCorePlugin,
): Promise<number> => {
  const orphans = await findOrphanedAssets(plugin);
  if (orphans.length === 0) return 0;

  const { vault } = plugin.app;
  let deleted = 0;

  for (const path of orphans) {
    const file = vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      try {
        await vault.trash(file, false);
        deleted++;
      } catch {
        // skip
      }
    }
  }

  return deleted;
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
      text: "⚠️ These files will be moved to system trash. Ctrl+Z in the editor cannot undo this action.",
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
    const deleted = await silentClean(this.plugin);
    new Notice(`Cleaned ${deleted} orphaned asset(s).`);
    this.close();
  };
}

// ---------------------------------------------------------------------------
// 对外入口
// ---------------------------------------------------------------------------

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
