import type { PaginationRule } from '.';
import type { PageLayout } from '../types';

const MIN_REMAINING_HEIGHT_FOR_SCALE = 500;
const MIN_SCALED_IMAGE_HEIGHT = 300;
const IMAGE_HEIGHT_STEP = 24;

export const imageRule: PaginationRule = {
  name: 'image',
  match: block => isImageBlock(block),
  apply: ({ block, layout }) => {
    appendImageBlock(block, layout);
  },
};

export const isImageBlock = (block: HTMLElement): boolean => {
  if (block.tagName.toLowerCase() === 'img') {
    return true;
  }

  if (block.tagName.toLowerCase() !== 'p') {
    return false;
  }

  const meaningfulChildren = Array.from(block.childNodes).filter(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      return Boolean(node.textContent?.trim());
    }

    return node.nodeName.toLowerCase() !== 'br';
  });

  return meaningfulChildren.length > 0 && meaningfulChildren.every(isImageNode);
};

export const appendImageBlock = (block: HTMLElement, layout: PageLayout) => {
  appendImageBlockInto({
    block,
    layout,
    appendTo: () => layout.currentContainer,
    onNewPage: () => {
      layout.newPage();
      return layout.currentContainer;
    },
  });
};

export const appendImageBlockInto = ({
  block,
  layout,
  appendTo,
  onNewPage,
}: {
  block: HTMLElement;
  layout: PageLayout;
  appendTo: () => HTMLElement;
  onNewPage: () => HTMLElement;
}) => {
  const cloned = layout.clone(block);

  appendTo().appendChild(cloned);
  if (!layout.isOverflow()) {
    return;
  }
  cloned.remove();

  if (tryAppendScaledImageBlock({ block, layout, appendTo })) {
    return;
  }

  onNewPage().appendChild(layout.clone(block));
};

const isImageNode = (node: ChildNode): boolean => {
  return node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'img';
};

const tryAppendScaledImageBlock = ({
  block,
  layout,
  appendTo,
}: {
  block: HTMLElement;
  layout: PageLayout;
  appendTo: () => HTMLElement;
}): boolean => {
  const availableHeight = getCurrentPageRemainingHeight(layout);

  if (availableHeight < MIN_REMAINING_HEIGHT_FOR_SCALE) {
    return false;
  }

  for (
    let maxHeight = Math.floor(availableHeight);
    maxHeight >= MIN_SCALED_IMAGE_HEIGHT;
    maxHeight -= IMAGE_HEIGHT_STEP
  ) {
    const cloned = layout.clone(block);
    fitImagesToHeight(cloned, maxHeight);

    appendTo().appendChild(cloned);
    if (!layout.isOverflow()) {
      return true;
    }
    cloned.remove();
  }

  return false;
};

const fitImagesToHeight = (block: HTMLElement, maxHeight: number) => {
  const images =
    block.tagName.toLowerCase() === 'img'
      ? [block as HTMLImageElement]
      : Array.from(block.querySelectorAll('img'));

  for (const img of images) {
    img.style.maxHeight = `${maxHeight}px`;
  }
};

const getCurrentPageRemainingHeight = (layout: PageLayout): number => {
  const pageRect = layout.currentPage.getBoundingClientRect();
  const styles = window.getComputedStyle(layout.currentPage);
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const lastChild = layout.currentPage.lastElementChild as HTMLElement | null;
  const contentTop = pageRect.top + paddingTop;
  const contentBottom = pageRect.bottom - paddingBottom;
  const usedBottom = lastChild ? lastChild.getBoundingClientRect().bottom : contentTop;

  return Math.max(0, contentBottom - usedBottom);
};
