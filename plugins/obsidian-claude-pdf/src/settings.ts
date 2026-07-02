import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type { Plugin } from 'obsidian';

export interface Settings {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  outputDir: string;
  watermark: boolean;
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkSize: number;
  watermarkCount: number;
}

export const DEFAULTS: Settings = {
  marginTop: 5,
  marginRight: 10,
  marginBottom: 5,
  marginLeft: 10,
  outputDir: '',
  watermark: false,
  watermarkText: 'watermark',
  watermarkColor: '#b0a99e',
  watermarkOpacity: 0.2,
  watermarkSize: 80,
  watermarkCount: 3,
};

export class SettingTab extends PluginSettingTab {
  plugin: Plugin & { settings: Settings; saveSettings: () => Promise<void> };

  constructor(app: any, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    /* heading + reset button */
    const heading = containerEl.createDiv();
    heading.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:1em;';
    heading.createEl('h2', { text: 'Claude PDF' });
    const spacer = heading.createDiv();
    spacer.style.cssText = 'flex:1;';
    const resetBtn = heading.createEl('button', { text: 'Reset to defaults' });
    resetBtn.style.cssText = 'font-size:0.85em;';
    resetBtn.onclick = async () => {
      (this.plugin.settings as any) = { ...DEFAULTS };
      await this.plugin.saveSettings();
      this.display();
      new Notice('Settings reset to defaults.');
    };

    /* ---- output directory ---- */
    containerEl.createEl('h3', { text: 'Output' });

    const chooseDir = async () => {
      try {
        const { dialog } = (require as any)('electron').remote;
        const result = await dialog.showOpenDialog({
          title: 'Choose default save folder',
          properties: ['openDirectory'],
        });
        if (!result.canceled && result.filePaths?.length) {
          this.plugin.settings.outputDir = result.filePaths[0];
          await this.plugin.saveSettings();
          this.display();
        }
      } catch {
        new Notice('Folder picker not available. Please type the path manually.');
      }
    };

    new Setting(containerEl)
      .setName('Default save folder')
      .setDesc('PDFs will be suggested to save here')
      .addText(t =>
        t
          .setPlaceholder('e.g. C:/Users/You/Desktop')
          .setValue(this.plugin.settings.outputDir)
          .onChange(async v => {
            this.plugin.settings.outputDir = v;
            await this.plugin.saveSettings();
          }),
      )
      .addButton(b => b.setButtonText('Browse').onClick(chooseDir));

    /* ---- watermark ---- */
    containerEl.createEl('h3', { text: 'Watermark' });

    new Setting(containerEl).setName('Enable').addToggle(t =>
      t.setValue(this.plugin.settings.watermark).onChange(async v => {
        this.plugin.settings.watermark = v;
        await this.plugin.saveSettings();
      }),
    );

    new Setting(containerEl).setName('Text').addText(t =>
      t.setValue(this.plugin.settings.watermarkText).onChange(async v => {
        this.plugin.settings.watermarkText = v;
        await this.plugin.saveSettings();
      }),
    );

    new Setting(containerEl).setName('Color').addText(t =>
      t.setValue(this.plugin.settings.watermarkColor).onChange(async v => {
        this.plugin.settings.watermarkColor = v;
        await this.plugin.saveSettings();
      }),
    );

    new Setting(containerEl)
      .setName('Opacity')
      .setDesc('0–1')
      .addText(t =>
        t.setValue(String(this.plugin.settings.watermarkOpacity)).onChange(async v => {
          const n = parseFloat(v);
          if (!isNaN(n) && n >= 0 && n <= 1) {
            this.plugin.settings.watermarkOpacity = n;
            await this.plugin.saveSettings();
          }
        }),
      );

    new Setting(containerEl)
      .setName('Font size')
      .setDesc('px')
      .addText(t =>
        t.setValue(String(this.plugin.settings.watermarkSize)).onChange(async v => {
          const n = parseInt(v);
          if (!isNaN(n) && n > 0) {
            this.plugin.settings.watermarkSize = n;
            await this.plugin.saveSettings();
          }
        }),
      );

    new Setting(containerEl).setName('Count per page').addText(t =>
      t.setValue(String(this.plugin.settings.watermarkCount)).onChange(async v => {
        const n = parseInt(v);
        if (!isNaN(n) && n > 0) {
          this.plugin.settings.watermarkCount = n;
          await this.plugin.saveSettings();
        }
      }),
    );

    /* ---- margins ---- */
    containerEl.createEl('h3', { text: 'A4 Margins (mm)' });

    const margins: { key: keyof Settings; label: string }[] = [
      { key: 'marginTop', label: 'Top' },
      { key: 'marginRight', label: 'Right' },
      { key: 'marginBottom', label: 'Bottom' },
      { key: 'marginLeft', label: 'Left' },
    ];

    for (const { key, label } of margins) {
      new Setting(containerEl).setName(label).addText(t =>
        t.setValue(String(this.plugin.settings[key])).onChange(async v => {
          const n = parseFloat(v);
          if (!isNaN(n) && n >= 0 && n <= 50) {
            (this.plugin.settings as any)[key] = n;
            await this.plugin.saveSettings();
          }
        }),
      );
    }
  }
}
