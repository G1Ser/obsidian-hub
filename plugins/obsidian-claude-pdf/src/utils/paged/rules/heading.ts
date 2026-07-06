import type { PaginationRule } from '.';
import type { PageLayout } from '../types';
import { isImageBlock } from './image';
import { isList } from './list';

const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';

export const headingRule: PaginationRule = {
  name: 'heading',

  match: block => block.matches(HEADING_SELECTOR),

  apply: ({ block, nextBlock, layout }) => {
    appendHeading(block, nextBlock, layout);
  },
};

const appendHeading = (
  heading: HTMLElement,
  nextBlock: HTMLElement | undefined,
  layout: PageLayout,
) => {
  const pageWasEmpty = layout.currentPage.children.length === 0;

  const clonedHeading = layout.clone(heading);

  if (nextBlock && (isImageBlock(nextBlock) || isCallout(nextBlock))) {
    appendHeadingOnly(clonedHeading, pageWasEmpty, layout);
    return;
  }

  if (!nextBlock) {
    appendHeadingOnly(clonedHeading, pageWasEmpty, layout);
    return;
  }

  const clonedNext = cloneKeepWithNextBlock(nextBlock, layout);

  layout.forceAppend(clonedHeading);
  layout.forceAppend(clonedNext);

  const overflow = layout.isOverflow();

  clonedNext.remove();

  if (!overflow) {
    return;
  }

  clonedHeading.remove();

  // 关键：当前页为空时，不允许再 newPage
  if (!pageWasEmpty) {
    layout.newPage();
  }

  layout.forceAppend(layout.clone(heading));
};

const appendHeadingOnly = (
  heading: HTMLElement,
  pageWasEmpty: boolean,
  layout: PageLayout,
) => {
  if (layout.tryAppend(heading)) return;

  if (!pageWasEmpty) {
    layout.newPage();
  }

  layout.forceAppend(heading);
};

const cloneKeepWithNextBlock = (block: HTMLElement, layout: PageLayout): HTMLElement => {
  if (!isList(block)) {
    return layout.clone(block);
  }

  const firstItem = block.firstElementChild;
  const list = block.cloneNode(false) as HTMLElement;

  if (firstItem) {
    list.appendChild(layout.clone(firstItem as HTMLElement));
  }

  return list;
};

const isCallout = (block: HTMLElement): boolean => {
  return block.classList.contains('callout');
};
