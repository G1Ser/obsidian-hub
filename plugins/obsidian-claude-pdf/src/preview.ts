import { Modal, Notice } from 'obsidian';
import type { Settings } from './settings';

export class PreviewModal extends Modal {
  html: string;
  settings: Settings;
  file: any;
  activeTab: 'html' | 'pdf' = 'html';
  tabEls: Record<string, HTMLElement> = {};
  bodyEl: HTMLElement | null = null;

  constructor(app: any, html: string, settings: Settings, file: any) {
    super(app);
    this.html = html;
    this.settings = settings;
    this.file = file;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    modalEl.style.cssText = 'width:40vw;height:80vh;';
    contentEl.style.cssText = 'display:flex;flex-direction:column';
    this.buildHeader(contentEl);
    this.bodyEl = contentEl.createDiv();
    this.bodyEl.style.cssText = 'flex:1;overflow:hidden;min-height:0';
    this.switchTab('html');
  }

  /* ---- header with tabs ---- */

  buildHeader(parent: HTMLElement) {
    const header = parent.createDiv();
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 4px;flex-shrink:0;width:100%';
    /* tabs */
    const tabBar = header.createDiv();
    tabBar.style.cssText = 'display:flex;gap:4px;';
    const makeTab = (label: string, key: 'html' | 'pdf') => {
      const btn = tabBar.createEl('button', { text: label });
      btn.style.cssText = 'padding:4px 14px;border-radius:4px;font-size:0.9em;';
      btn.onclick = () => this.switchTab(key);
      this.tabEls[key] = btn;
    };
    makeTab('HTML Preview', 'html');
    makeTab('PDF Preview', 'pdf');

    const spacer = header.createDiv();
    spacer.style.cssText = 'flex:1;';

    /* progress bar (hidden) */
    const progressWrap = header.createDiv();
    progressWrap.style.cssText = 'display:none;align-items:center;gap:4px;';
    progressWrap.createEl('span', { text: 'Exporting…' });
    const bar = progressWrap.createDiv();
    bar.style.cssText =
      'height:3px;width:80px;background:var(--background-modifier-border);border-radius:2px;overflow:hidden;';
    const fill = bar.createDiv();
    fill.style.cssText = 'height:100%;width:0%;background:#d97757;transition:width 0.3s;';
    const setProgress = (p: number) => {
      fill.style.width = `${p}%`;
    };

    /* buttons */
    const cancelBtn = header.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => this.close();

    const exportBtn = header.createEl('button', { text: 'Export', cls: 'mod-cta' });
    exportBtn.onclick = async () => {
      exportBtn.disabled = true;
      cancelBtn.disabled = true;
      progressWrap.style.display = '';
      setProgress(20);
      try {
        const electron = (require as any)('electron');
        const remote = electron.remote;
        const fs = (require as any)('fs');
        const path = (require as any)('path');
        const os = (require as any)('os');
        setProgress(40);

        const tmp = path.join(os.tmpdir(), `claude-pdf-export-${Date.now()}.html`);
        fs.writeFileSync(tmp, this.html, 'utf8');

        const win = new remote.BrowserWindow({
          width: 800,
          height: 600,
          show: false,
          webPreferences: { nodeIntegration: true, contextIsolation: false },
        });
        await win.loadURL(`file://${tmp.replace(/\\/g, '/')}`);
        setProgress(60);
        await new Promise(r => setTimeout(r, 1500));
        setProgress(75);

        const buf = await win.webContents.printToPDF({
          printBackground: true,
          preferCSSPageSize: true,
        });
        setProgress(90);
        try {
          fs.unlinkSync(tmp);
        } catch {}
        win.close();

        const dir = this.settings.outputDir || remote.app.getPath('desktop');
        const name = this.file.basename.replace(/\.\w+$/, '');
        const outPath = path.join(dir, `${name}.pdf`);
        fs.writeFileSync(outPath, buf);
        setProgress(100);
        await new Promise(r => setTimeout(r, 300));
        this.close();
        new Notice(`PDF saved: ${outPath}`);
      } catch (e: any) {
        this.close();
        new Notice(`Export error: ${e.message}`);
        console.error(e);
      }
    };
  }

  /* ---- tab switching ---- */

  switchTab(key: 'html' | 'pdf') {
    this.activeTab = key;
    for (const [k, el] of Object.entries(this.tabEls)) {
      el.style.cssText =
        k === key
          ? 'padding:4px 14px;border-radius:4px;font-size:0.9em;background:var(--interactive-accent);color:var(--text-on-accent);'
          : 'padding:4px 14px;border-radius:4px;font-size:0.9em;';
    }
    this.renderBody();
  }

  renderBody() {
    if (!this.bodyEl) return;
    this.bodyEl.empty();

    if (this.activeTab === 'html') {
      /* HTML preview: iframe + page break lines, no watermark, no padding */
      const { marginTop, marginBottom } = this.settings;
      const contentH = 297 - marginTop - marginBottom; /* usable content height per A4 page */
      const htmlNoWm = this.html
        .replace(/<script>[\s\S]*?position:fixed[\s\S]*?<\/script>/, '')
        .replace(
          '</head>',
          `<style>
            *{scrollbar-width: none;box-sizing:border-box}
            .pdf-root::after {
              content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 999;
              background: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(${contentH}mm - 4px),
                rgba(0,0,0,0.04) calc(${contentH}mm - 4px),
                rgba(0,0,0,0.12) calc(${contentH}mm - 2px),
                rgba(0,0,0,0.22) calc(${contentH}mm - 1px),
                rgba(0,0,0,0.06) ${contentH}mm
              );
              background-size: 100% ${contentH}mm;
            }
            .pdf-root { position: relative; }
          </style></head>`,
        );
      const iframe = this.bodyEl.createEl('iframe');
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.srcdoc = htmlNoWm;
    } else {
      /* PDF preview: clip-based pagination — pages match HTML tab overlay exactly */
      const s = this.settings;
      const contentH = 297 - s.marginTop - s.marginBottom;
      const contentW = 210 - s.marginLeft - s.marginRight;
      const padCSS = `${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm`;

      /* pre-build watermark HTML, JSON-escaped for safe JS embedding */
      const wmJSON = s.watermark
        ? JSON.stringify(
            Array.from({ length: s.watermarkCount }, () => {
              const top = (Math.random() * 240 + 20).toFixed(1);
              const left = (Math.random() * 140 + 20).toFixed(1);
              const rot = (Math.random() * 50 - 25).toFixed(1);
              const txt = s.watermarkText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              return (
                `<span style="position:absolute;z-index:9999;pointer-events:none;` +
                `font-size:${s.watermarkSize}px;color:${s.watermarkColor};opacity:${s.watermarkOpacity};` +
                `top:${top}mm;left:${left}mm;transform:rotate(${rot}deg);white-space:nowrap;">${txt}</span>`
              );
            }).join(''),
          )
        : '""';

      const htmlPaged = this.html
        .replace(/<script>[\s\S]*?position:fixed[\s\S]*?<\/script>/, '')
        .replace(
          '</head>',
          `<style>
            *{scrollbar-width: none;box-sizing:border-box}
            .pdf-root,.markdown-body{width:${contentW}mm!important;padding:0!important;margin:0}
            .pdf-pages-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
            .pdf-page-card{width:210mm;height:297mm;padding:${padCSS};box-shadow:0 2px 5px rgba(0,0,0,0.16)}
            .pdf-page-clip{height:${contentH}mm;overflow:hidden}
          </style>
          <script>
          window.addEventListener('DOMContentLoaded',function(){
            var root=document.querySelector('.pdf-root');
            if(!root)return;
            var ref=document.createElement('div');
            ref.style.cssText='position:fixed;height:1mm;visibility:hidden';
            document.body.appendChild(ref);
            var mmPx=ref.getBoundingClientRect().height;
            document.body.removeChild(ref);
            var chPx=Math.round(${contentH}*mmPx);
            var pages=Math.max(1,Math.ceil(root.scrollHeight/chPx));
            var wmHTML=${wmJSON};
            /* build page cards */
            var wrap=document.createElement('div');
            wrap.className='pdf-pages-wrap';
            for(var p=0;p<pages;p++){
              var card=document.createElement('div');
              card.className='pdf-page-card';
              var clip=document.createElement('div');
              clip.className='pdf-page-clip';
              var off=document.createElement('div');
              off.className='pdf-page-offset markdown-body';
              off.style.transform='translateY(-'+p*${contentH}+'mm)';
              off.innerHTML=root.innerHTML;
              clip.appendChild(off);
              card.appendChild(clip);
              if(wmHTML){
                var tmp=document.createElement('span');
                tmp.innerHTML=wmHTML;
                while(tmp.firstChild)card.appendChild(tmp.firstChild);
              }
              wrap.appendChild(card);
            }
            /* scale to fit modal, use outer wrapper to constrain width */
            var avail=document.documentElement.clientWidth-24;
            var scale=Math.min(1,avail/(210*mmPx));
            document.body.innerHTML='';
            if(scale<1){
              var outer=document.createElement('div');
              outer.style.cssText='width:'+(210*scale)+'mm;margin:0 auto;overflow:hidden;';
              wrap.style.transform='scale('+scale+')';
              wrap.style.transformOrigin='top center';
              outer.appendChild(wrap);
              document.body.appendChild(outer);
              document.body.style.minHeight=(wrap.scrollHeight*scale+40)+'px';
            }else{
              document.body.appendChild(wrap);
            }
          });
          <\/script>
          </head>`,
        );
      const iframe = this.bodyEl.createEl('iframe');
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.srcdoc = htmlPaged;
    }
  }

  onClose() {
    (this as any).contentEl.empty();
  }
}
