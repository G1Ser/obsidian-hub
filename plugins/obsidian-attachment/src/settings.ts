import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";

export interface AttachmentCoreSettings {
  /** 附件存放的根目录（相对于 vault 根） */
  assetsRoot: string;
  /** 是否自动将常见图片格式转为 WebP */
  enableWebp: boolean;
  /** WebP 编码质量 (1–100)，值越大文件越大质量越好 */
  webpQuality: number;
  /** 哪些图片后缀需要转 WebP，逗号分隔，如 "png, jpg, jpeg" */
  webpExtensions: string;
  /** 是否启用后台自动扫描孤立资产 */
  autoCleanupEnabled: boolean;
  /** 自动扫描间隔（分钟） */
  autoCleanupInterval: number;
  /** 自动清理时跳过确认框，直接进回收站 */
  autoCleanupSkipConfirm: boolean;
  /** assets/.trash/ 中文件最多保留小时数，超期的永久删除 */
  trashRetentionHours: number;
}

/** 默认值 */
export const DEFAULT_SETTINGS: AttachmentCoreSettings = {
  assetsRoot: "assets",
  enableWebp: true,
  webpQuality: 80,
  webpExtensions: "png, jpg, jpeg",
  autoCleanupEnabled: false,
  autoCleanupInterval: 10,
  autoCleanupSkipConfirm: false,
  trashRetentionHours: 24,
};

// ---------------------------------------------------------------------------
// 设置面板
// ---------------------------------------------------------------------------

export class AttachmentCoreSettingTab extends PluginSettingTab {
  plugin: ObsidianAttachmentCorePlugin;

  constructor(app: App, plugin: ObsidianAttachmentCorePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display = (): void => {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Attachment Core Settings" });

    // ---- 附件根目录 ----
    new Setting(containerEl)
      .setName("Assets root folder")
      .setDesc("Attachments are saved under this root folder in your vault.")
      .addText((text) => {
        text
          .setPlaceholder("assets")
          .setValue(this.plugin.settings.assetsRoot)
          .onChange(async (value) => {
            this.plugin.settings.assetsRoot = value.trim() || "assets";
            await this.plugin.saveSettings();
          });
      });

    // ---- WebP 开关 ----
    new Setting(containerEl)
      .setName("Convert images to WebP")
      .setDesc(
        "Automatically convert PNG/JPEG images to WebP format to reduce file size.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableWebp)
          .onChange(async (value) => {
            this.plugin.settings.enableWebp = value;
            await this.plugin.saveSettings();
          });
      });

    // ---- WebP 质量滑块 ----
    new Setting(containerEl)
      .setName("WebP quality")
      .setDesc(
        "Quality level for WebP conversion (1–100). Higher = better quality, larger file.",
      )
      .addSlider((slider) => {
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.webpQuality)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.webpQuality = value;
            await this.plugin.saveSettings();
          });
      });

    // ---- WebP 转换后缀列表 ----
    new Setting(containerEl)
      .setName("WebP image extensions")
      .setDesc(
        "Comma-separated list of extensions to convert (e.g. png, jpg, jpeg, bmp).",
      )
      .addText((text) => {
        text
          .setPlaceholder("png, jpg, jpeg")
          .setValue(this.plugin.settings.webpExtensions)
          .onChange(async (value) => {
            this.plugin.settings.webpExtensions =
              value.trim() || "png, jpg, jpeg";
            await this.plugin.saveSettings();
          });
      });

    // ---- 分隔线 ----
    containerEl.createEl("h3", { text: "Auto Cleanup" });

    // ---- 自动扫描开关 ----
    new Setting(containerEl)
      .setName("Auto scan for orphaned assets")
      .setDesc(
        "Periodically scan for assets that are no longer referenced by any note.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.autoCleanupEnabled)
          .onChange(async (value) => {
            this.plugin.settings.autoCleanupEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.restartAutoScan();
          });
      });

    new Setting(containerEl)
      .setName("Scan interval (minutes)")
      .setDesc("How often to scan for orphaned assets (5–30 min).")
      .addText((text) => {
        text
          .setPlaceholder("10")
          .setValue(String(this.plugin.settings.autoCleanupInterval))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 5) {
              this.plugin.settings.autoCleanupInterval = 5;
            } else if (num > 30) {
              this.plugin.settings.autoCleanupInterval = 30;
            } else {
              this.plugin.settings.autoCleanupInterval = num;
            }
            await this.plugin.saveSettings();
            this.plugin.restartAutoScan();
          });
      });

    // ---- 跳过确认框 ----
    new Setting(containerEl)
      .setName("Skip confirmation on auto-cleanup")
      .setDesc(
        "When enabled, auto-scan will move orphaned assets to trash without asking. A summary notice will still be shown.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.autoCleanupSkipConfirm)
          .onChange(async (value) => {
            this.plugin.settings.autoCleanupSkipConfirm = value;
            await this.plugin.saveSettings();
          });
      });

    // ---- 回收站保留时长 ----
    new Setting(containerEl)
      .setName("Trash retention (hours)")
      .setDesc(
        "Files in assets/.trash/ are permanently deleted after this many hours (1–72, about 1–3 days).",
      )
      .addSlider((slider) => {
        slider
          .setLimits(1, 72, 1)
          .setValue(this.plugin.settings.trashRetentionHours)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.trashRetentionHours = value;
            await this.plugin.saveSettings();
          });
      });
  };
}
