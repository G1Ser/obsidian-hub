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

const copyManifest = () => {
  // 读取原始文件
  const raw = fs.readFileSync(MANIFEST_SOURCE, "utf8");
  const withoutBom = raw.replace(/^﻿/, "");
  const manifest = JSON.parse(withoutBom);
  const normalized = `${JSON.stringify(manifest, null, 2)}\n`;
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
  bundle: true, // 所有依赖打进一个文件
  format: "cjs", // module.exports = xxx
  platform: "browser", // 不要引入 Node.js 内置模块（fs, path 等）
  target: "es2020", // 编译到 ES2020，Electron 版本够新，不需要更低

  // ---- 输出路径 ----
  outfile: path.join(OUT_DIR, "main.js"),

  // ---- 外部依赖 ----
  // obsidian 包在运行时由 Obsidian 提供，不要打进 bundle
  external: ["obsidian"],

  // ---- Source Map ----
  sourcemap: WATCH_MODE ? "inline" : false,
  logLevel: "info",

  // =========================================================================
  // 4. 自定义插件 — 每次构建完成后复制 manifest
  // =========================================================================
  plugins: [
    {
      name: "copy-manifest",
      setup(build) {
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
