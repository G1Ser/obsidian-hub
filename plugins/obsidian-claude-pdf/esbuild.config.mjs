import { buildPlugin } from '../../scripts/build.mjs';
import fs from 'node:fs';
import path from 'node:path';

await buildPlugin('obsidian-claude-pdf', {
  plugins: [{
    name: 'copy-css',
    setup(build) {
      build.onEnd(() => {
        const src = path.resolve('src/css/claude-style.css');
        const dst = path.resolve('dist/claude-style.css');
        fs.copyFileSync(src, dst);
      });
    },
  }],
});
