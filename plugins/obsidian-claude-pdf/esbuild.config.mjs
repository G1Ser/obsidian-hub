import { buildPlugin } from '../../scripts/build.mjs';
import fs from 'node:fs';
import path from 'node:path';

await buildPlugin('obsidian-claude-pdf', {
  plugins: [
    {
      name: 'copy-css',
      setup(build) {
        build.onEnd(() => {
          fs.copyFileSync(
            path.resolve('src/css/claude-style.css'),
            path.resolve('dist/claude-style.css'),
          );
          fs.copyFileSync(
            path.resolve('src/css/katex.base64.css'),
            path.resolve('dist/katex.base64.css'),
          );
        });
      },
    },
  ],
});
