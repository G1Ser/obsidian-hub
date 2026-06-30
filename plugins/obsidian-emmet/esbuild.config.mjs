import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const WATCH_MODE = process.argv.includes('--watch');
const OUT_DIR = 'dist';
const MANIFEST_SOURCE = 'manifest.json';
const MANIFEST_TARGET = path.join(OUT_DIR, 'manifest.json');

const copyManifest = () => {
  const raw = fs.readFileSync(MANIFEST_SOURCE, 'utf8');
  const withoutBom = raw.replace(/^﻿/, '');
  const manifest = JSON.parse(withoutBom);
  const normalized = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_TARGET, normalized, { encoding: 'utf8' });
};

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  outfile: path.join(OUT_DIR, 'main.js'),
  external: ['obsidian'],
  sourcemap: WATCH_MODE ? 'inline' : false,
  logLevel: 'info',
  plugins: [
    {
      name: 'copy-manifest',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length === 0) copyManifest();
        });
      },
    },
  ],
});

if (WATCH_MODE) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
