import type { PaginationRule } from '.';

export const imageRule: PaginationRule = {
  name: 'image',
  match: block => block.tagName.toLowerCase() === 'img',
  apply: ({ block, layout }) => {
    const img = layout.clone(block);
    if (layout.tryAppend(img)) {
      return;
    }
    layout.newPage();
    layout.forceAppend(img);
  },
};
