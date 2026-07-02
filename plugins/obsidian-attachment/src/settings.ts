import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type ObsidianAttachmentCorePlugin from './main';

export interface AttachmentCoreSettings {
  assetsRoot: string;
  enableWebp: boolean;
  webpQuality: number;
  webpExtensions: string;
}

export const DEFAULT_SETTINGS: AttachmentCoreSettings = {
  assetsRoot: 'Assets',
  enableWebp: true,
  webpQuality: 80,
  webpExtensions: 'png, jpg, jpeg',
};

export class AttachmentCoreSettingTab extends PluginSettingTab {
  plugin: ObsidianAttachmentCorePlugin;

  constructor(app: App, plugin: ObsidianAttachmentCorePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display = (): void => {
    const { containerEl } = this;
    containerEl.empty();

    /* heading + reset button */
    const heading = containerEl.createDiv();
    heading.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:1em;';
    heading.createEl('h2', { text: 'Attachment Core Settings' });
    const spacer = heading.createDiv();
    spacer.style.cssText = 'flex:1;';
    const resetBtn = heading.createEl('button', { text: 'Reset to defaults' });
    resetBtn.style.cssText = 'font-size:0.85em;';
    resetBtn.onclick = async () => {
      Object.assign(this.plugin.settings, DEFAULT_SETTINGS);
      await this.plugin.saveSettings();
      this.display();
      new Notice('Settings reset to defaults.');
    };

    new Setting(containerEl)
      .setName('Assets root folder')
      .setDesc('Attachments are saved under this root folder in your vault.')
      .addText(text => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.assetsRoot)
          .setValue(this.plugin.settings.assetsRoot)
          .onChange(async value => {
            this.plugin.settings.assetsRoot = value.trim() || DEFAULT_SETTINGS.assetsRoot;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Convert images to WebP')
      .setDesc('Automatically convert PNG/JPEG images to WebP format to reduce file size.')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableWebp).onChange(async value => {
          this.plugin.settings.enableWebp = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('WebP quality')
      .setDesc('Quality level for WebP conversion (1–100). Higher = better quality, larger file.')
      .addSlider(slider => {
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.webpQuality)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.webpQuality = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('WebP image extensions')
      .setDesc('Comma-separated list of extensions to convert (e.g. png, jpg, jpeg, bmp).')
      .addText(text => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.webpExtensions)
          .setValue(this.plugin.settings.webpExtensions)
          .onChange(async value => {
            this.plugin.settings.webpExtensions = value.trim() || DEFAULT_SETTINGS.webpExtensions;
            await this.plugin.saveSettings();
          });
      });
  };
}
