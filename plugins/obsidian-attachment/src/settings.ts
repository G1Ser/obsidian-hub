/**
 * 设置模块 — 定义用户可配置的字段、默认值和设置面板 UI。
 *
 * 角色分工：
 *  - AttachmentCoreSettings 接口：声明"有哪些字段可以配置"
 *  - DEFAULT_SETTINGS 常量：插件第一次安装时的初始值
 *  - AttachmentCoreSettingTab 类：负责在 Obsidian 设置页渲染控件
 *
 * Obsidian 设置 API：
 *   用户改了值 → onChange 回调 → saveSettings() 写磁盘
 *   下次加载插件 → loadSettings() 读磁盘 → 控件 setValue() 还原 UI
 */

import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianAttachmentCorePlugin from "./main";

// ---------------------------------------------------------------------------
// 设置数据结构
// ---------------------------------------------------------------------------

export interface AttachmentCoreSettings {
  /** 附件存放的根目录（相对于 vault 根） */
  assetsRoot: string;
  /** 是否自动将常见图片格式转为 WebP */
  enableWebp: boolean;
  /** WebP 编码质量 (1–100)，值越大文件越大质量越好 */
  webpQuality: number;
  /** 哪些图片后缀需要转 WebP，逗号分隔，如 "png, jpg, jpeg" */
  webpExtensions: string;
}

/** 出厂默认值 — 用户没改过就用这些 */
export const DEFAULT_SETTINGS: AttachmentCoreSettings = {
  assetsRoot: "assets",
  enableWebp: true,
  webpQuality: 80,
  webpExtensions: "png, jpg, jpeg",
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

  /**
   * display() 是 Obsidian 调用的入口。
   * 每次用户切换到本设置页时触发，需要重新渲染全部控件。
   */
  display = (): void => {
    const { containerEl } = this;
    containerEl.empty(); // 先清空，避免重复渲染

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
      .setDesc("Automatically convert PNG/JPEG images to WebP format to reduce file size.")
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
      .setDesc("Quality level for WebP conversion (1–100). Higher = better quality, larger file.")
      .addSlider((slider) => {
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.webpQuality)
          .setDynamicTooltip() // 拖动时实时显示数值
          .onChange(async (value) => {
            this.plugin.settings.webpQuality = value;
            await this.plugin.saveSettings();
          });
      });

    // ---- WebP 转换后缀列表 ----
    new Setting(containerEl)
      .setName("WebP image extensions")
      .setDesc("Comma-separated list of extensions to convert (e.g. png, jpg, jpeg, bmp).")
      .addText((text) => {
        text
          .setPlaceholder("png, jpg, jpeg")
          .setValue(this.plugin.settings.webpExtensions)
          .onChange(async (value) => {
            this.plugin.settings.webpExtensions = value.trim() || "png, jpg, jpeg";
            await this.plugin.saveSettings();
          });
      });
  };
}
