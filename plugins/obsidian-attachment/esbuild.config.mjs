import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const watch = process.argv.includes("--watch");
const outdir = "dist";
const manifestSource = "manifest.json";
const manifestTarget = path.join(outdir, "manifest.json");

function writeManifestWithoutBom() {
  const raw = fs.readFileSync(manifestSource, "utf8");
  const withoutBom = raw.replace(/^\uFEFF/, "");
  const manifest = JSON.parse(withoutBom);
  const normalized = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.mkdirSync(outdir, { recursive: true });
  fs.writeFileSync(manifestTarget, normalized, { encoding: "utf8" });
}

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2020",
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
  outfile: path.join(outdir, "main.js"),
  external: ["obsidian"],
  plugins: [
    {
      name: "copy-manifest",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            return;
          }

          writeManifestWithoutBom();
        });
      },
    },
  ],
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
}
