import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

async function main() {
  const contentHtmlPath = path.resolve('tests/output/raw.html');
  const outputPdfPath = path.resolve('tests/output/测试.pdf');
  const bundledPagedPath = path.resolve('tests/.paged.bundle.js');

  await build({
    entryPoints: [path.resolve('src/utils/paged/index.ts')],
    outfile: bundledPagedPath,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
  });

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(`file://${contentHtmlPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });

  await page
    .waitForLoadState('load', {
      timeout: 10000,
    })
    .catch(() => {
      console.warn('load timeout, continue...');
    });

  await page.addScriptTag({
    path: bundledPagedPath,
  });

  await page.evaluate(async () => {
    await window.paged({
      rootSelector: '#source',
      pageWidth: '210mm',
      pageHeight: '297mm',
      marginTop: '5mm',
      marginRight: '10mm',
      marginBottom: '5mm',
      marginLeft: '10mm',
    });
  });

  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
  });

  await browser.close();
  console.log(`done pdf: ${outputPdfPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
