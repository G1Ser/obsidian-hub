import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, deployToVault } from './load-env.mjs';

/**
 * 构建 Obsidian 插件。
 *
 * 零配置用法：
 *   await buildPlugin('obsidian-emmet');
 *
 * 定制用法（覆盖基础项 / 追加 esbuild 插件）：
 *   await buildPlugin('obsidian-emmet', {
 *     target: 'es2022',
 *     plugins: [myPlugin()],
 *   });
 *
 * @param {string}          pluginId    - 插件 ID
 * @param {object}          [overrides] - 覆盖 esbuild 基础配置 / 追加插件
 * @param {string}          [overrides.outDir]
 * @param {string[]}        [overrides.entryPoints]
 * @param {string[]}        [overrides.external]
 * @param {import('esbuild').Plugin[]} [overrides.plugins] - 追加的自定义插件
 */
export const buildPlugin = async (pluginId, overrides = {}) => {
  loadEnv();

  const WATCH_MODE = process.argv.includes('--watch');
  const OUT_DIR = overrides.outDir || 'dist';

  // ---- 基础 esbuild 配置（所有插件共用） ----

  const baseConfig = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2020',
    outfile: path.join(OUT_DIR, 'main.js'),
    external: ['obsidian'],
    sourcemap: WATCH_MODE ? 'inline' : false,
    logLevel: 'info',
  };

  // ---- manifest 复制 + vault 部署 ----

  const manifestSource = overrides.manifestSource || 'manifest.json';
  const manifestTarget = path.join(OUT_DIR, 'manifest.json');

  const copyManifest = () => {
    const raw = fs.readFileSync(manifestSource, 'utf8');
    const withoutBom = raw.replace(/^﻿/, '');
    const manifest = JSON.parse(withoutBom);
    const normalized = `${JSON.stringify(manifest, null, 2)}\n`;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(manifestTarget, normalized, { encoding: 'utf8' });
  };

  // ---- 合并用户覆盖 ----

  const { plugins: extraPlugins = [], ...rest } = overrides;

  const config = {
    ...baseConfig,
    ...rest,
    plugins: [
      {
        name: 'obsidian-plugin',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length === 0) {
              copyManifest();
              deployToVault(pluginId, OUT_DIR);
            }
          });
        },
      },
      ...extraPlugins,
    ],
  };

  // ---- 启动 ----

  const ctx = await esbuild.context(config);

  if (WATCH_MODE) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
};
