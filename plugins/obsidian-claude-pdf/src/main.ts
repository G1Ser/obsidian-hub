import { App, FileSystemAdapter, Modal, Notice, Plugin, TFile } from 'obsidian';
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

    const progress = new ExportProgressModal(this.app);
    progress.open();

    const { remote } = (require as any)('electron');
    const fs = (require as any)('fs');
    const path = (require as any)('path');
    const os = (require as any)('os');
    const { pathToFileURL } = (require as any)('url');

    let win: any = null;
    let tempHtmlPath = '';

    try {
      progress.update(8, '准备导出目录...');

      const dir = this.settings.outputDir || remote.app.getPath('desktop');
      fs.mkdirSync(dir, { recursive: true });

      progress.update(18, '读取当前 Markdown...');

      const md = await this.app.vault.read(file);

      progress.update(32, '生成 Claude HTML...');

      const html = await this.buildHtml(md);
      const outputPath = path.join(dir, `${file.basename}.pdf`);
      tempHtmlPath = path.join(os.tmpdir(), `obsidian-claude-pdf-${Date.now()}.html`);
      const pagedScriptPath = path.join(this.getPluginDir(), 'paged.js');

      fs.writeFileSync(tempHtmlPath, html, 'utf8');

      progress.update(46, '加载导出页面...');

      win = new remote.BrowserWindow({
        width: 1240,
        height: 1754,
        show: false,
      });

      await win.loadURL(pathToFileURL(tempHtmlPath).href);

      progress.update(60, '加载分页规则...');

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

      progress.update(74, '按 A4 页面分页...');

      await win.webContents.executeJavaScript(`window.paged(${JSON.stringify(pagedOptions)})`);

      progress.update(88, '生成 PDF 文件...');

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

      progress.update(96, '写入桌面文件...');

      fs.writeFileSync(outputPath, pdf);

      progress.update(100, '导出完成');
      window.setTimeout(() => progress.close(), 500);
      new Notice(`PDF 已导出：${outputPath}`);
    } catch (error) {
      progress.fail('导出失败');
      new Notice(`PDF 导出失败：${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      if (win) {
        win.destroy();
      }

      if (tempHtmlPath) {
        fs.rmSync(tempHtmlPath, { force: true });
      }
    }
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

class ExportProgressModal extends Modal {
  private fillEl!: HTMLElement;
  private percentEl!: HTMLElement;
  private messageEl!: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '正在导出 PDF' });

    this.messageEl = contentEl.createDiv({ text: '准备开始...' });
    this.messageEl.style.cssText = 'margin:8px 0 12px;color:var(--text-muted);';

    const track = contentEl.createDiv();
    track.style.cssText =
      'height:10px;border-radius:999px;background:var(--background-modifier-border);overflow:hidden;';

    this.fillEl = track.createDiv();
    this.fillEl.style.cssText =
      'height:100%;width:0%;border-radius:999px;background:var(--interactive-accent);transition:width 160ms ease;';

    this.percentEl = contentEl.createDiv({ text: '0%' });
    this.percentEl.style.cssText =
      'margin-top:8px;text-align:right;font-variant-numeric:tabular-nums;color:var(--text-muted);';
  }

  onClose() {
    this.contentEl.empty();
  }

  update(percent: number, message: string) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    this.messageEl.setText(message);
    this.fillEl.style.width = `${value}%`;
    this.percentEl.setText(`${value}%`);
  }

  fail(message: string) {
    this.messageEl.setText(message);
    this.fillEl.style.background = 'var(--text-error)';
  }
}
