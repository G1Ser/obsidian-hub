import fs from 'fs';
import { markdownToHtml } from '../src/converter';
import { loadCss } from '../src/postCss';

const CLAUDE_CLASS = '.claude-root';

const md = fs.readFileSync('tests/测试导出.md', 'utf8');

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

(async () => {
  const claudeCss = await loadCss('src/css/claude-style.css', CLAUDE_CLASS);
  const mermaidCss = await loadCss('src/css/mermaid-style.css', CLAUDE_CLASS);
  const obsidianCss = await loadCss('src/css/obsidian-style.css');
  const katexCss = await loadCss('src/css/katex-style.css');

  const css = `${claudeCss}${mermaidCss}${katexCss}${obsidianCss}`;
  const body = await markdownToHtml(md);

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

${css}
</style>

<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
mermaid.initialize(${JSON.stringify(mermaidConfig)});
</script>
</head>

<body>
  <article id="source" class="claude-root">
${body}
  </article>
</body>
</html>`;

  fs.writeFileSync('tests/content.html', html);
})();
