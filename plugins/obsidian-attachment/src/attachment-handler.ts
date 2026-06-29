import { normalizePath, TFile } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";
import {
  formatTimestamp,
  ensureFolder,
  normalizeExtension,
  convertImageToWebp,
} from "./utils";

type VaultWithGetAvailablePath = import("obsidian").Plugin["app"]["vault"] & {
  getAvailablePath: (path: string, ext: string) => string;
};

export const createSaveAttachment = (
  plugin: ObsidianAttachmentCorePlugin,
): ((name: string, ext: string, data: ArrayBuffer) => Promise<unknown>) => {
  return async (_name, ext, data) => {
    const { settings, app } = plugin;
    const vault = app.vault as VaultWithGetAvailablePath;

    let finalExt = ext;
    let finalData = data;
    const normalizedExt = normalizeExtension(ext);

    if (settings.enableWebp) {
      const webpExts = settings.webpExtensions
        .split(",")
        .map((s) => normalizeExtension(s));

      if (webpExts.includes(normalizedExt)) {
        const webpData = await convertImageToWebp(
          data,
          settings.webpQuality / 100,
        );
        if (webpData) {
          finalExt = "webp";
          finalData = webpData;
        }
      }
    }

    const activeFile = app.workspace.getActiveFile();
    const noteFolderPath =
      activeFile instanceof TFile && activeFile.extension === "md"
        ? normalizePath(activeFile.path.replace(/\.md$/i, ""))
        : "unknown";

    const targetFolder = normalizePath(
      `${settings.assetsRoot}/${noteFolderPath}`,
    );
    await ensureFolder(app.vault, targetFolder);

    const timestamp = formatTimestamp(new Date());
    const basePath = normalizePath(`${targetFolder}/${timestamp}`);
    const targetPath = vault.getAvailablePath(basePath, finalExt);

    return app.vault.createBinary(targetPath, finalData);
  };
};
