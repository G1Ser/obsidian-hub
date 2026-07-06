import type { PageLayout, ResolvedPagedOptions } from '../types';
import { defaultRule } from './default';
import { headingRule } from './heading';
import { imageRule } from './image';
import { tableRule } from './table';
import { calloutRule } from './callout';
import { listRule } from './list';

export interface PaginationRule {
  name: string;

  match: (block: HTMLElement) => boolean;

  apply: (args: RuleApplyArgs) => void;
}

export interface RuleApplyArgs {
  block: HTMLElement;
  nextBlock?: HTMLElement;
  blocks: HTMLElement[];
  index: number;
  layout: PageLayout;
  opts: ResolvedPagedOptions;
}

export const rules: PaginationRule[] = [
  headingRule,
  calloutRule,
  tableRule,
  imageRule,
  listRule,
  defaultRule,
];

export const applyRule = (args: RuleApplyArgs) => {
  const rule = rules.find(item => item.match(args.block));

  rule?.apply(args);
};
