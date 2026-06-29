/**
 * esbuild 打包配置
 * ================
 * Obsidian 插件最终要输出到 dist/ 目录，用户安装的就是 dist/ 里的内容。
 *
 * 打包流程概览：
 *   src/*.ts                  ← 你写的源码
 *     │
 *     │  esbuild (bundle + compile)
 *     ▼
 *   dist/main.js              ← 单文件，可直接在 Obsidian 里运行
 *   dist/manifest.json        ← 从根目录 manifest.json 复制过来
 *
 * 运行方式：
 *   node esbuild.config.mjs         → 一次性构建 (build)
 *   node esbuild.config.mjs --watch → 持续监听 (dev)
 */

import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

// =========================================================================
// 1. 基础配置
// =========================================================================

const WATCH_MODE = process.argv.includes("--watch");

/** 构建产物输出目录 */
const OUT_DIR = "dist";

/** manifest.json 的位置 — 在插件根目录，不在 src/ 里 */
const MANIFEST_SOURCE = "manifest.json";
const MANIFEST_TARGET = path.join(OUT_DIR, "manifest.json");

// =========================================================================
// 2. 复制 manifest.json 到 dist/
// =========================================================================

/**
 * 把根目录的 manifest.json 复制到 dist/。
 *
 * 为什么要单独处理？
 *  - manifest.json 不是 TypeScript，esbuild 不会处理它
 *  - 但 Obsidian 加载插件时必须读到 dist/manifest.json
 *  - 另外需要去掉 Windows 记事本可能写入的 BOM 头 (﻿)
 */
const copyManifest = () => {
  // 读取原始文件
  const raw = fs.readFileSync(MANIFEST_SOURCE, "utf8");

  // 去掉 BOM（Byte Order Mark），否则 JSON.parse 会报错
  const withoutBom = raw.replace(/^﻿/, "");

  // 解析 → 重新序列化 → 保证格式统一
  const manifest = JSON.parse(withoutBom);
  const normalized = `${JSON.stringify(manifest, null, 2)}\n`;

  // 确保 dist/ 存在，写入
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_TARGET, normalized, { encoding: "utf8" });
};

// =========================================================================
// 3. esbuild 上下文
// =========================================================================

const ctx = await esbuild.context({
  // ---- 入口 ----
  // esbuild 从这里开始，把所有 import 的模块都打包进来
  entryPoints: ["src/main.ts"],

  // ---- 输出格式 ----
  // Obsidian 插件运行在 Electron 的渲染进程（浏览器环境）
  // 但 Obsidian 的模块系统是 CommonJS，所以用 cjs 格式
  bundle: true,       // 所有依赖打进一个文件
  format: "cjs",      // module.exports = xxx
  platform: "browser",// 不要引入 Node.js 内置模块（fs, path 等）
  target: "es2020",   // 编译到 ES2020，Electron 版本够新，不需要更低

  // ---- 输出路径 ----
  outfile: path.join(OUT_DIR, "main.js"),

  // ---- 外部依赖 ----
  // obsidian 包在运行时由 Obsidian 提供，不要打进 bundle
  // 否则会报 "obsidian already loaded" 之类的错误
  external: ["obsidian"],

  // ---- Source Map ----
  // dev 模式生成 inline sourcemap，方便 F12 调试时看到原始 ts 代码
  // build 模式不生成，减小文件体积
  sourcemap: WATCH_MODE ? "inline" : false,

  logLevel: "info",

  // =========================================================================
  // 4. 自定义插件 — 每次构建完成后复制 manifest
  // =========================================================================
  plugins: [
    {
      name: "copy-manifest",

      setup(build) {
        /**
         * build.onEnd 在 esbuild 完成打包后触发。
         *
         * 注意：这里不能用 build.onStart，因为即使编译失败
         * alsoPackage.json scripts 的异常也会被 node 捕获。
         * 用 onEnd 可以检查 errors 再决定要不要复制。
         */
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            return; // 编译有错就不复制，避免用旧的 manifest 掩盖问题
          }

          copyManifest();
        });
      },
    },
  ],
});

// =========================================================================
// 5. 启动
// =========================================================================

if (WATCH_MODE) {
  // --watch：持续监听文件变化，自动增量编译
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  // 一次性构建后释放资源
  await ctx.rebuild();
  await ctx.dispose(); // 释放 esbuild 内部占用的内存
}

/**
 * dist/ 目录最终结构：
 *
 *   dist/
 *   ├── main.js         ← esbuild 打包的插件代码
 *   └── manifest.json   ← 插件的元信息（id, name, version, ...）
 *
 * Obsidian 加载插件时会：
 *   1. 读取 dist/manifest.json → 获取 id, name, version
 *   2. 根据 main.js 字段加载 dist/main.js
 *   3. 调用 export default 类的 onload() 方法
 */
