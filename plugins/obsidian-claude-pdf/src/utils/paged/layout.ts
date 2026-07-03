import type { PageLayout, ResolvedPagedOptions } from './types';

/**
 * 创建 A4 页面容器。
 */
export const createLayout = (source: HTMLElement, opts: ResolvedPagedOptions): PageLayout => {
  injectPageStyle(opts);

  const sourceClassName = source.className;

  document.body.innerHTML = '';

  const layout: PageLayout = {
    sourceClassName,
    currentContent: null as unknown as HTMLElement,
    createPage: () => createPage(sourceClassName),
  };

  layout.currentContent = layout.createPage();

  return layout;
};

const createPage = (sourceClassName: string): HTMLElement => {
  const page = document.createElement('article');

  page.className = `${sourceClassName} pdf-page`;

  document.body.appendChild(page);

  return page;
};

const injectPageStyle = (opts: ResolvedPagedOptions) => {
  const style = document.createElement('style');

  style.textContent = `
@page {
  size: ${opts.pageWidth} ${opts.pageHeight};
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
}

.pdf-page{
    width: ${opts.pageWidth};
    height: ${opts.pageHeight};
    padding: ${opts.marginTop} ${opts.marginRight} ${opts.marginBottom} ${opts.marginLeft};
    box-sizing: border-box;
    background: var(--claude-bg);
}

@media print {
  .pdf-page {
    break-after: page;
  }
}
`;

  document.head.appendChild(style);
};
