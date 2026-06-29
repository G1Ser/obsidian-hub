import { Plugin } from "obsidian";
import type { AttachmentCoreSettings } from "./settings";
import { DEFAULT_SETTINGS, AttachmentCoreSettingTab } from "./settings";
import { createSaveAttachment } from "./attachment-handler";
import { runCleanup, runSilentScan } from "./cleanup";

type SaveAttachmentFn = (
  name: string,
  ext: string,
  data: ArrayBuffer,
) => Promise<unknown>;
type AppWithSaveAttachment = Plugin["app"] & {
  saveAttachment: SaveAttachmentFn;
};

export default class ObsidianAttachmentCorePlugin extends Plugin {
  settings!: AttachmentCoreSettings;

  private originalSaveAttachment: SaveAttachmentFn | null = null;
  /** 自动扫描的定时器 ID */
  private autoScanTimer: ReturnType<typeof setInterval> | null = null;

  // =========================================================================
  // 生命周期
  // =========================================================================

  onload = async (): Promise<void> => {
    await this.loadSettings();

    // 设置面板
    this.addSettingTab(new AttachmentCoreSettingTab(this.app, this));

    // 替换 saveAttachment
    const app = this.app as AppWithSaveAttachment;
    this.originalSaveAttachment = app.saveAttachment.bind(app);
    app.saveAttachment = createSaveAttachment(this);

    // 手动清理命令
    this.addCommand({
      id: "clean-orphaned-assets",
      name: "Clean orphaned assets",
      callback: () => runCleanup(this),
    });

    // 启动后台静默扫描
    this.startAutoScan();
  };

  onunload = (): void => {
    // 恢复原始 saveAttachment
    if (this.originalSaveAttachment) {
      const app = this.app as AppWithSaveAttachment;
      app.saveAttachment = this.originalSaveAttachment;
      this.originalSaveAttachment = null;
    }

    // 清除定时器
    this.stopAutoScan();
  };

  // =========================================================================
  // 设置持久化
  // =========================================================================

  loadSettings = async (): Promise<void> => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async (): Promise<void> => {
    await this.saveData(this.settings);
  };

  // =========================================================================
  // 后台自动扫描
  // =========================================================================

  /** 启动自动扫描定时器（如果用户启用了此功能） */
  startAutoScan = (): void => {
    this.stopAutoScan(); // 先清旧定时器，避免重复

    if (!this.settings.autoCleanupEnabled) return;

    const intervalMs = this.settings.autoCleanupInterval * 60 * 1000;

    this.autoScanTimer = setInterval(() => {
      runSilentScan(this);
    }, intervalMs);
  };

  /** 停止自动扫描定时器 */
  stopAutoScan = (): void => {
    if (this.autoScanTimer !== null) {
      clearInterval(this.autoScanTimer);
      this.autoScanTimer = null;
    }
  };

  /**
   * 当用户在设置面板中改动相关配置时调用，
   * 自动重启定时器使新配置生效。
   */
  restartAutoScan = (): void => {
    this.startAutoScan();
  };
}
