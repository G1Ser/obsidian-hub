/**
 * 插件入口 — Obsidian 加载/卸载插件时调用的生命周期方法都在这里。
 *
 * 职责：
 *  1. 加载和持久化用户设置
 *  2. 注册设置面板
 *  3. 在插件加载时猴子补丁(monkey-patch) app.saveAttachment，
 *     让所有附件的保存行为都走我们的自定义逻辑
 *  4. 插件卸载时恢复原始 saveAttachment
 */

import { Plugin } from "obsidian";
import type { AttachmentCoreSettings } from "./settings";
import { DEFAULT_SETTINGS, AttachmentCoreSettingTab } from "./settings";
import { createSaveAttachment } from "./attachment-handler";

// ---------------------------------------------------------------------------
// 类型补丁 — Obsidian 内部的 saveAttachment 未在公开类型中导出，
// 这里手动声明以便在运行时替换它。
// ---------------------------------------------------------------------------

type SaveAttachmentFn = (name: string, ext: string, data: ArrayBuffer) => Promise<unknown>;
type AppWithSaveAttachment = Plugin["app"] & { saveAttachment: SaveAttachmentFn };

export default class ObsidianAttachmentCorePlugin extends Plugin {
  settings!: AttachmentCoreSettings;

  /** 保存原始 saveAttachment，卸载时用它恢复 */
  private originalSaveAttachment: SaveAttachmentFn | null = null;

  // =========================================================================
  // 生命周期
  // =========================================================================

  onload = async (): Promise<void> => {
    // 1. 从磁盘读取用户设置 → 合并到 DEFAULT_SETTINGS
    await this.loadSettings();

    // 2. 注册设置面板（Settings → Community Plugins → 齿轮图标）
    this.addSettingTab(new AttachmentCoreSettingTab(this.app, this));

    // 3. 替换 app.saveAttachment，所有拖拽/粘贴附件都会走这里
    const app = this.app as AppWithSaveAttachment;
    this.originalSaveAttachment = app.saveAttachment.bind(app);
    app.saveAttachment = createSaveAttachment(this);
  };

  onunload = (): void => {
    // 插件卸载时把 saveAttachment 恢复原样，避免影响其他插件
    if (this.originalSaveAttachment) {
      const app = this.app as AppWithSaveAttachment;
      app.saveAttachment = this.originalSaveAttachment;
      this.originalSaveAttachment = null;
    }
  };

  // =========================================================================
  // 设置持久化
  // =========================================================================

  /** 读磁盘 → 合并默认值 → 挂到 this.settings */
  loadSettings = async (): Promise<void> => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  /** 把 this.settings 写入磁盘 */
  saveSettings = async (): Promise<void> => {
    await this.saveData(this.settings);
  };
}
