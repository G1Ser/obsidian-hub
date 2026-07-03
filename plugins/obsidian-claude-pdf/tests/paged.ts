import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

async function main() {
  const contentHtmlPath = path.resolve('tests/content.html');
  const outputPdfPath = path.resolve('C:/Users/Administrator/Downloads/paged.pdf');
  const bundledPagedPath = path.resolve('tests/.paged.bundle.js');

  await build({
    entryPoints: [path.resolve('src/paged.ts')],
    outfile: bundledPagedPath,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome100'],
  });

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(`file://${contentHtmlPath}`, {
    waitUntil: 'networkidle',
  });

  await page.addScriptTag({
    path: bundledPagedPath,
  });

  await page.evaluate(async () => {
    await window.paged({
      rootSelector: '#source',
      pageWidth: '210mm',
      pageHeight: '297mm',
      padding: '5mm 10mm',
      gap: '5px',
    });
  });

  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`done pdf: ${outputPdfPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
