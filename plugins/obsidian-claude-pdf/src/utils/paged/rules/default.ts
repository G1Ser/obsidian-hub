import type { PaginationRule } from '.';

export const defaultRule: PaginationRule = {
  name: 'default',
  match: () => true,
  apply: ({ block, layout }) => {
    const cloned = layout.clone(block);
    if (layout.tryAppend(cloned)) {
      return;
    }
    layout.newPage();
    layout.forceAppend(cloned);
  },
};
