import type { PageLayout, ResolvedPagedOptions } from './types';
import { applyRule } from './rules';

export const layoutBlocks = (
  blocks: HTMLElement[],
  layout: PageLayout,
  opts: ResolvedPagedOptions,
) => {
  for (let index = 0; index < blocks.length; index++) {
    applyRule({
      block: blocks[index],
      nextBlock: blocks[index + 1],
      blocks,
      index,
      layout,
      opts,
    });
  }
};
