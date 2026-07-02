import fs from 'fs';
import { markdownToHtml } from '../src/converter';

const md = fs.readFileSync('tests/测试导出.md', 'utf8');
const claudeCss = fs.readFileSync('src/css/claude-style.css', 'utf8');
const obsidianCss = fs.readFileSync('src/css/obsidian-style.css', 'utf8');
const katexCss = fs.readFileSync('src/css/katex-style.css', 'utf8');
const mermaidCss = fs.readFileSync('src/css/mermaid-style.css', 'utf8');
(async () => {
  const body = await markdownToHtml(md);
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf8">
<style>
*{padding:0;margin:0;box-sizing: border-box;}
${claudeCss}
${obsidianCss}
${katexCss}
${mermaidCss}
.pdf-preview {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32px;
  background: rgba(75,75,75,0.5);
}
.pdf-layout{
  width: 210mm;
  min-height:297mm;
  margin: 0 auto;
  padding: 5mm 10mm;
  background: var(--claude-bg);
  border: 1px solid var(--claude-border);
  border-radius: var(--claude-radius-lg);
  box-shadow: var(--claude-shadow-soft);
}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true,theme:'base',themeVariables:{primaryColor:'#f0eee6',primaryTextColor:'#141413',primaryBorderColor:'#d97757',lineColor:'#d97757',secondaryColor:'#f5f4ed',tertiaryColor:'#faf9f5',fontSize:'15px'}});</script>
</head>
<body class="pdf-preview">
    <div class="pdf-layout">
      <article class="claude-root">
      ${body}
      </article>
    </div>
</body>
</html>`;

  fs.writeFileSync('tests/preview.html', html);
})();
