import type { PaginationRule } from '.';
import type { PageLayout } from '../types';

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

  if (!nextBlock) {
    if (layout.tryAppend(clonedHeading)) return;

    if (!pageWasEmpty) {
      layout.newPage();
    }

    layout.forceAppend(clonedHeading);
    return;
  }

  const clonedNext = layout.clone(nextBlock);

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
