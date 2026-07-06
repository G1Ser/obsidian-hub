/**
 * PDF Pagination Engine
 */
import type { PagedOptions } from './types';
import { mergeOptions } from './options';
import { prepareDocument } from './prepare';
import { normalizeDocument } from './normalize';
import { createLayout } from './layout';
import { layoutBlocks } from './append';
export const paged = async (options: PagedOptions = {}) => {
  const opts = mergeOptions(options);
  const { rootSelector } = opts;
  // 等待字体、Mermaid渲染完成
  await prepareDocument();

  // 获取原始HTML
  const source = document.querySelector(rootSelector) as HTMLElement | null;
  if (!source) {
    throw new Error(`Missing root element: ${rootSelector}`);
    return;
  }

  // Markdown Dom清洗
  normalizeDocument(source);

  // 收集 Dom
  const blocks = Array.from(source.children).map(el => el.cloneNode(true) as HTMLElement);

  // 创建A4页面
  const layout = createLayout(source, opts);

  // 开始分页
  layoutBlocks(blocks, layout, opts);
};

declare global {
  interface Window {
    paged: typeof paged;
  }
}

window.paged = paged;
