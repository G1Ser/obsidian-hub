import { Plugin, Notice } from 'obsidian';
import { markdownToHtml } from './converter';
import { Settings, DEFAULTS, SettingTab } from './settings';
import { PreviewModal } from './preview';


/* ---- HTML shell ---- */

const buildHtml = (body: string, css: string, katexCss: string, s: Settings): string => {
  const pad = `${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm`;
  const wmJS = s.watermark
    ? `
<script>
(function(){
  var text='${s.watermarkText.replace(/'/g, "\\'")}';
  var color='${s.watermarkColor}';
  var opacity=${s.watermarkOpacity};
  var size=${s.watermarkSize};
  var count=${s.watermarkCount};
  var H=1123; /* A4 page height px */
  for(var i=0;i<count;i++){
    var el=document.createElement('span');
    el.textContent=text;
    el.style.cssText='position:fixed;z-index:9999;pointer-events:none;'+
      'font-size:'+size+'px;color:'+color+';opacity:'+opacity+';'+
      'top:'+(Math.random()*H*0.7+30)+'px;'+
      'left:'+(Math.random()*500+40)+'px;'+
      'transform:rotate('+(Math.random()*50-25)+'deg);'+
      'white-space:nowrap;';
    document.body.appendChild(el);
  }
})();
<\/script>`
    : '';
  return `<!doctype html>
<html>
<head>
<meta charset="utf8">
<style>
${katexCss}
${css}
@page { size: A4; margin: 0; }
html, body { background: #faf9f5; margin: 0; padding: 0; min-height: 297mm; }
.pdf-root, .markdown-body {
  width: auto; max-width: none; margin: 0;
  padding: 0;
  border: 0; border-radius: 0; box-shadow: none;
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
${wmJS}
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
      callback: () => this.openPreview(),
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async openPreview() {
    const file = this.app.workspace.getActiveFile();
    if (!file) return new Notice('No active file');

    const md = await this.app.vault.read(file);
    const css = await this.loadCSS();
    const katexCss = await this.loadKatexCSS();

    new Notice('Rendering preview…');
    try {
      const body = await markdownToHtml(md);
      const html = buildHtml(body, css, katexCss, this.settings);
      new PreviewModal(this.app, html, this.settings, file).open();
    } catch (e: any) {
      new Notice(`Preview error: ${e.message}`);
      console.error(e);
    }
  }

  async loadCSS(): Promise<string> {
    const dir = this.app.vault.configDir;
    try {
      return await this.app.vault.adapter.read(
        `${dir}/plugins/obsidian-claude-pdf/claude-style.css`,
      );
    } catch {
      return `:root,.pdf-root{color-scheme:light;text-decoration-color:currentColor}.pdf-root,.markdown-body{max-width:none;background:#faf9f5;color:#141413;font-family:Georgia,serif;font-size:16px;line-height:1.65;padding:0}`;
    }
  }

  async loadKatexCSS(): Promise<string> {
    const dir = this.app.vault.configDir;
    try {
      return await this.app.vault.adapter.read(
        `${dir}/plugins/obsidian-claude-pdf/katex.base64.css`,
      );
    } catch {
      return '';
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

/* ---- preview modal ---- */
