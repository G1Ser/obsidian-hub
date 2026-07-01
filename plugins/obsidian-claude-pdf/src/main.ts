import { Plugin, Notice, PluginSettingTab, Setting } from 'obsidian';
import { markdownToHtml } from './converter';

/* ---- settings ---- */

interface Settings {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  outputDir: string;
}

const DEFAULTS: Settings = {
  marginTop: 20,
  marginRight: 18,
  marginBottom: 20,
  marginLeft: 18,
  outputDir: '',
};

/* ---- HTML shell ---- */

const buildHtml = (body: string, css: string, s: Settings): string => {
  const pad = `${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"/>
<style>
${css}
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #faf9f5; margin: 0; padding: 0; min-height: 297mm; }
  .pdf-root, .markdown-body {
    width: auto; max-width: none; margin: 0;
    padding: ${pad};
    border: 0; border-radius: 0; box-shadow: none;
    background: #faf9f5;
  }
}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({startOnLoad:true,theme:'base',themeVariables:{primaryColor:'#f0eee6',primaryTextColor:'#141413',primaryBorderColor:'#d97757',lineColor:'#d97757',secondaryColor:'#f5f4ed',tertiaryColor:'#faf9f5',fontSize:'15px'}});
</script>
</head>
<body>
<article class="pdf-root markdown-body">
${body}
</article>
</body>
</html>`;
};

/* ---- plugin ---- */

export default class extends Plugin {
  settings!: Settings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'export-claude-pdf',
      name: 'Export as Claude Style PDF',
      callback: () => this.exportPDF(),
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async exportPDF() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return new Notice('No active file');

    const md = await this.app.vault.read(file);
    const css = await this.loadCSS();

    new Notice('Generating PDF…');
    try {
      const body = await markdownToHtml(md);
      const html = buildHtml(body, css, this.settings);

      /* Electron printToPDF — saves directly to outputDir */
      const electron = (require as any)('electron');
      const remote = electron.remote;
      const fs = (require as any)('fs');
      const path = (require as any)('path');

      const win = new remote.BrowserWindow({
        width: 800, height: 600, show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
      });

      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      await win.loadURL(dataUrl);

      /* wait for mermaid to render */
      await new Promise(r => setTimeout(r, 1500));

      const buf = await win.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
      });

      win.close();

      const dir = this.settings.outputDir || remote.app.getPath('desktop');
      const name = file.basename.replace(/\.\w+$/, '');
      const outPath = path.join(dir, `${name}.pdf`);
      fs.writeFileSync(outPath, buf);

      new Notice(`PDF saved: ${outPath}`);
    } catch (e: any) {
      new Notice(`PDF error: ${e.message}`);
      console.error(e);
    }
  }

  async loadCSS(): Promise<string> {
    const dir = this.app.vault.configDir;
    try {
      return await this.app.vault.adapter.read(`${dir}/plugins/obsidian-claude-pdf/claude-style.css`);
    } catch {
      return `:root,.pdf-root{color-scheme:light;text-decoration-color:currentColor}.pdf-root,.markdown-body{max-width:none;background:#faf9f5;color:#141413;font-family:Georgia,serif;font-size:16px;line-height:1.65;padding:0}`;
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

/* ---- settings tab ---- */

class SettingTab extends PluginSettingTab {
  plugin: Plugin & { settings: Settings; saveSettings: () => Promise<void> };

  constructor(app: any, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Claude PDF' });

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
      .addButton(b =>
        b.setButtonText('Browse').onClick(chooseDir),
      );

    /* ---- margins ---- */
    containerEl.createEl('h3', { text: 'A4 Margins (mm)' });

    const margins: { key: keyof Settings; label: string }[] = [
      { key: 'marginTop',    label: 'Top' },
      { key: 'marginRight',  label: 'Right' },
      { key: 'marginBottom', label: 'Bottom' },
      { key: 'marginLeft',   label: 'Left' },
    ];

    for (const { key, label } of margins) {
      new Setting(containerEl)
        .setName(label)
        .addText(t =>
          t
            .setValue(String(this.plugin.settings[key]))
            .onChange(async v => {
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
