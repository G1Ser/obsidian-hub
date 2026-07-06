import type { PageLayout, ResolvedPagedOptions } from './types';

/**
 * 创建 A4 页面容器。
 */
export const createLayout = (source: HTMLElement, opts: ResolvedPagedOptions): PageLayout => {
  injectPageStyle(opts);

  const sourceClassName = source.className;

  document.body.innerHTML = '';
  const layout = {} as PageLayout;
  layout.sourceClassName = sourceClassName;
  layout.createPage = () => createPage(sourceClassName);
  layout.newPage = () => {
    layout.currentPage = layout.createPage();
    layout.currentContainer = layout.currentPage;
    return layout.currentPage;
  };
  layout.isOverflow = () => {
    return layout.currentPage.scrollHeight > layout.currentPage.clientHeight + 1;
  };
  layout.tryAppend = <T extends HTMLElement>(node: T) => {
    layout.currentContainer.appendChild(node);

    if (!layout.isOverflow()) {
      return node;
    }

    node.remove();
    return null;
  };

  layout.forceAppend = <T extends HTMLElement>(node: T): T => {
    layout.currentContainer.appendChild(node);
    return node;
  };

  layout.withContainer = <T>(container: HTMLElement, fn: () => T): T => {
    const prev = layout.currentContainer;
    layout.currentContainer = container;
    try {
      return fn();
    } finally {
      layout.currentContainer = prev;
    }
  };

  layout.clone = <T extends HTMLElement>(node: T): T => {
    return node.cloneNode(true) as T;
  };

  layout.currentPage = layout.createPage();
  layout.currentContainer = layout.currentPage;

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
    overflow:hidden;
}

@media print {
  .pdf-page {
    break-after: page;
  }
}
`;

  document.head.appendChild(style);
};
