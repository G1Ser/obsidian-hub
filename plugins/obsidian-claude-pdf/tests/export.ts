import fs from 'fs';
import { marked } from 'marked';

const md = fs.readFileSync('tests/测试导出.md', 'utf8');

const css = fs.readFileSync('src/css/claude-style.css', 'utf8');

const html = marked(md);

fs.writeFileSync(
  'tests/preview.html',
  `
<!doctype html>
<html>

<head>
<meta charset="utf8">

<style>
${css}
</style>

</head>

<body>

<article class="pdf-root markdown-body">

${html}

</article>

</body>

</html>
`,
);
