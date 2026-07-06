import { buildPlugin } from '../../scripts/build.mjs';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync('dist', { recursive: true });

await build({
  entryPoints: [path.resolve('src/utils/paged/index.ts')],
  outfile: path.resolve('dist/paged.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
});

await buildPlugin('obsidian-claude-pdf', {
  platform: 'node',
  external: ['obsidian', 'electron'],
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
