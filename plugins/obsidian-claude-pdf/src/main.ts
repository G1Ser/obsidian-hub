import { FileSystemAdapter, Notice, Plugin, TFile } from 'obsidian';
import { Settings, DEFAULTS, SettingTab } from './settings';
import { markdownToHtml } from './utils/converter';
import { loadCss } from './utils/postCss';
import type { PagedOptions } from './utils/paged/types';

const CLAUDE_CLASS = '.claude-root';

export default class ClaudeExportPlugin extends Plugin {
  settings!: Settings;

  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: 'export-current-md-to-pdf',
      name: 'Export current Markdown to PDF',
      callback: async () => {
        await this.exportCurrentFileToPdf();
      },
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async exportCurrentFileToPdf() {
    const file = this.app.workspace.getActiveFile();

    if (!file || !(file instanceof TFile) || file.extension !== 'md') {
      new Notice('请先打开一个 Markdown 文件');
      return;
    }

    const { remote } = (require as any)('electron');
    const fs = (require as any)('fs');
    const path = (require as any)('path');
    const os = (require as any)('os');
    const { pathToFileURL } = (require as any)('url');

    const dir = this.settings.outputDir || remote.app.getPath('desktop');
    fs.mkdirSync(dir, { recursive: true });

    const md = await this.app.vault.read(file);
    const html = await this.buildHtml(md);
    const outputPath = path.join(dir, `${file.basename}.pdf`);
    const tempHtmlPath = path.join(os.tmpdir(), `obsidian-claude-pdf-${Date.now()}.html`);
    const pagedScriptPath = path.join(this.getPluginDir(), 'paged.js');

    fs.writeFileSync(tempHtmlPath, html, 'utf8');

    const win = new remote.BrowserWindow({
      width: 1240,
      height: 1754,
      show: false,
    });

    try {
      await win.loadURL(pathToFileURL(tempHtmlPath).href);
      await win.webContents.executeJavaScript(fs.readFileSync(pagedScriptPath, 'utf8'));

      const { marginTop, marginRight, marginBottom, marginLeft } = this.settings;

      const pagedOptions: PagedOptions = {
        rootSelector: '#source',
        pageWidth: '210mm',
        pageHeight: '297mm',
        marginTop: `${marginTop}mm`,
        marginRight: `${marginRight}mm`,
        marginBottom: `${marginBottom}mm`,
        marginLeft: `${marginLeft}mm`,
      };

      await win.webContents.executeJavaScript(`window.paged(${JSON.stringify(pagedOptions)})`);

      const pdf = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margins: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      });

      fs.writeFileSync(outputPath, pdf);
    } finally {
      win.destroy();
      fs.rmSync(tempHtmlPath, { force: true });
    }

    new Notice(`PDF 已导出：${outputPath}`);
  }

  private getPluginDir(): string {
    const path = (require as any)('path');
    const adapter = this.app.vault.adapter;

    if (!(adapter instanceof FileSystemAdapter) || !this.manifest.dir) {
      throw new Error('Claude PDF requires Obsidian desktop file system access.');
    }

    return path.join(adapter.getBasePath(), this.manifest.dir);
  }

  private async buildHtml(md: string): Promise<string> {
    const mermaidConfig = {
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        fontFamily: 'Anthropic Sans Web Text',
        primaryColor: '#f0eee6',
        primaryTextColor: '#141413',
        primaryBorderColor: '#d97757',
        lineColor: '#d97757',
        secondaryColor: '#f5f4ed',
        tertiaryColor: '#faf9f5',
        fontSize: '16px',
      },
    };

    const base = this.manifest.dir;

    const claudeCss = await loadCss(this.app, `${base}/claude-style.css`, CLAUDE_CLASS);

    const mermaidCss = await loadCss(this.app, `${base}/mermaid-style.css`, CLAUDE_CLASS);

    const obsidianCss = await loadCss(this.app, `${base}/obsidian-style.css`);

    const katexCss = await loadCss(this.app, `${base}/katex-style.css`);

    const css = `${claudeCss}${mermaidCss}${katexCss}${obsidianCss}${this.buildWatermarkCss()}`;
    const body = await markdownToHtml(md);

    return `<!doctype html>
<html>
<head>
<meta charset="utf8">
<style>
*{padding:0;margin:0;box-sizing:border-box;}
html,
body {
  margin: 0;
  padding: 0;
}
${css}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize(${JSON.stringify(mermaidConfig)});</script>
</head>
<body>
  <article id="source" class="claude-root">
${body}
  </article>
</body>
</html>`;
  }

  private buildWatermarkCss(): string {
    if (!this.settings.watermark) return '';

    return `
.pdf-page {
  position: relative;
}

.pdf-page > * {
  position: relative;
  z-index: 1;
}

.pdf-page::before {
  content: ${JSON.stringify(this.settings.watermarkText)};
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 0;
  transform: translate(-50%, -50%) rotate(55deg);
  color: ${this.settings.watermarkColor};
  opacity: ${this.settings.watermarkOpacity};
  font-size: ${this.settings.watermarkSize}px;
  font-family: var(--pdf-font-sans);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}
`;
  }
}
