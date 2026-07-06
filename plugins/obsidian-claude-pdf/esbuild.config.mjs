import { buildPlugin } from '../../scripts/build.mjs';
import fs from 'node:fs';
import path from 'node:path';

await buildPlugin('obsidian-claude-pdf', {
  plugins: [
    {
      name: 'copy-css',
      setup(build) {
        build.onEnd(() => {
          const srcCssDir = path.resolve('src/css');
          const distDir = path.resolve('dist');

          // 确保 dist 目录存在
          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
          }

          const files = fs.readdirSync(srcCssDir);

          for (const file of files) {
            const srcPath = path.join(srcCssDir, file);
            const distPath = path.join(distDir, file);

            if (fs.statSync(srcPath).isFile()) {
              fs.copyFileSync(srcPath, distPath);
            }
          }
        });
      },
    },
  ],
});
