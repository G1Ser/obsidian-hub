import { Notice, Plugin, TFile } from 'obsidian';
import { Settings, DEFAULTS, SettingTab } from './settings';
import { markdownToHtml } from './utils/converter';
import { loadCss } from './utils/postCss';

const CLAUDE_CLASS = '.claude-root';

export default class ClaudeExportPlugin extends Plugin {
  settings!: Settings;

  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: 'export-current-md-to-html',
      name: 'Export current Markdown to HTML',
      callback: async () => {
        await this.exportCurrentFileToHtml();
      },
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async exportCurrentFileToHtml() {
    const file = this.app.workspace.getActiveFile();

    if (!file || !(file instanceof TFile) || file.extension !== 'md') {
      new Notice('请先打开一个 Markdown 文件');
      return;
    }

    const md = await this.app.vault.read(file);
    const html = await this.buildHtml(md);
    const electron = (require as any)('electron');
    const remote = electron.remote;
    const fs = (require as any)('fs');
    const path = (require as any)('path');
    const dir = this.settings.outputDir || remote.app.getPath('desktop');
    const outputPath = path.join(dir, `${file.basename}.html`);
    fs.writeFileSync(outputPath, html);

    new Notice(`HTML 已导出：${outputPath}`);
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

    const css = `${claudeCss}${mermaidCss}${katexCss}${obsidianCss}`;
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
}
