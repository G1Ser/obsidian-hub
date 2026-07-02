const fs = require('fs');
const path = require('path');

const cssPath = path.resolve('src/css/katex.min.css');
const fontRoot = path.resolve('src/fonts');

let css = fs.readFileSync(cssPath, 'utf-8');
css = css.replace(
  /url\((['"]?)(.*?)\1\)\s*format\((['"]?)(.*?)\3\)/g,
  (_, __, fontPath, ___, format) => {
    const filename = path.basename(fontPath);
    const fullPath = path.join(fontRoot, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn('Not Found:', fullPath);
      return _;
    }
    const ext = path.extname(filename).slice(1);
    const mime = {
      woff2: 'font/woff2',
      woff: 'font/woff',
      ttf: 'font/ttf',
      otf: 'font/otf',
    }[ext];
    const base64 = fs.readFileSync(fullPath).toString('base64');
    return `url("data:${mime};base64,${base64}") format("${format}")`;
  },
);

fs.writeFileSync(path.resolve('src/css/katex.base64.css'), css);
console.log('Done!');
