import type { PaginationRule } from '.';
import type { PageLayout } from '../types';

export const listRule: PaginationRule = {
  name: 'list',

  match: block => isList(block),

  apply: ({ block, layout }) => {
    appendList(block, layout);
  },
};

export const appendList = (list: HTMLElement, layout: PageLayout) => {
  const items = Array.from(list.children) as HTMLElement[];

  if (!items.length) {
    appendListAsBlock(list, layout);
    return;
  }

  let currentList = createEmptyList(list);

  layout.forceAppend(currentList);

  for (const item of items) {
    const clonedItem = layout.clone(item);

    currentList.appendChild(clonedItem);

    if (!layout.isOverflow()) {
      continue;
    }

    clonedItem.remove();

    if (!currentList.children.length) {
      currentList.remove();
    }

    layout.newPage();

    currentList = createEmptyList(list);
    currentList.appendChild(clonedItem);

    layout.forceAppend(currentList);
  }
};

export const appendListChildren = ({
  list,
  layout,
  appendTo,
  onNewPage,
}: {
  list: HTMLElement;
  layout: PageLayout;
  appendTo: () => HTMLElement;
  onNewPage: () => HTMLElement;
}) => {
  let currentList = createEmptyList(list);

  appendTo().appendChild(currentList);

  const items = Array.from(list.children) as HTMLElement[];

  for (const item of items) {
    const clonedItem = layout.clone(item);

    currentList.appendChild(clonedItem);

    if (!layout.isOverflow()) {
      continue;
    }

    clonedItem.remove();

    if (!currentList.children.length) {
      currentList.remove();
    }

    const nextContainer = onNewPage();

    currentList = createEmptyList(list);
    currentList.appendChild(clonedItem);

    nextContainer.appendChild(currentList);
  }
};

export const isList = (node: Element): boolean => {
  const tag = node.tagName.toLowerCase();
  return tag === 'ul' || tag === 'ol';
};

const appendListAsBlock = (list: HTMLElement, layout: PageLayout) => {
  const cloned = layout.clone(list);

  if (layout.tryAppend(cloned)) return;

  layout.newPage();
  layout.forceAppend(cloned);
};

const createEmptyList = (list: HTMLElement): HTMLElement => {
  return list.cloneNode(false) as HTMLElement;
};
