import fs from 'fs';
import { markdownToHtml } from '../src/converter';

const md = fs.readFileSync('tests/测试导出.md', 'utf8');
const css = fs.readFileSync('src/css/claude-style.css', 'utf8');

(async () => {
  const body = await markdownToHtml(md);
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"/>
<style>${css}</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true,theme:'base',themeVariables:{primaryColor:'#f0eee6',primaryTextColor:'#141413',primaryBorderColor:'#d97757',lineColor:'#d97757',secondaryColor:'#f5f4ed',tertiaryColor:'#faf9f5',fontSize:'15px'}});</script>
</head>
<body>
<article class="pdf-root markdown-body">
${body}
</article>
</body>
</html>`;

  fs.writeFileSync('tests/preview.html', html);
})();
