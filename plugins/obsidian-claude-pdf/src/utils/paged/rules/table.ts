import type { PaginationRule } from '.';
import type { PageLayout } from '../types';

export const tableRule: PaginationRule = {
  name: 'table',
  match: block => isTable(block),
  apply: ({ block, layout }) => {
    appendTable(block, layout);
  },
};

export const appendTable = (table: HTMLElement, layout: PageLayout) => {
  appendTableChildren({
    table,
    layout,
    appendTo: () => layout.currentContainer,
    onNewPage: () => {
      layout.newPage();
      return layout.currentContainer;
    },
  });
};

export const appendTableChildren = ({
  table,
  layout,
  appendTo,
  onNewPage,
}: {
  table: HTMLElement;
  layout: PageLayout;
  appendTo: () => HTMLElement;
  onNewPage: () => HTMLElement;
}) => {
  const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLElement[];
  if (!rows.length) {
    const cloned = layout.clone(table);
    appendTo().appendChild(cloned);
    if (!layout.isOverflow()) {
      return;
    }
    cloned.remove();
    onNewPage().appendChild(cloned);
    return;
  }

  let currentTable = createEmptyTable(table);
  let currentTbody = getTbody(currentTable);
  appendTo().appendChild(currentTable);

  for (const row of rows) {
    const clonedRow = layout.clone(row);
    currentTbody.appendChild(clonedRow);
    if (!layout.isOverflow()) {
      continue;
    }
    clonedRow.remove();
    if (!currentTbody.children.length) {
      currentTable.remove();
    }
    const nextContainer = onNewPage();
    currentTable = createEmptyTable(table);
    currentTbody = getTbody(currentTable);
    currentTbody.appendChild(clonedRow);
    nextContainer.appendChild(currentTable);
  }
};

export const isTable = (block: HTMLElement): boolean => block.tagName.toLowerCase() === 'table';

const createEmptyTable = (table: HTMLElement) => {
  const next = table.cloneNode(false) as HTMLTableElement;
  const colgroup = table.querySelector('colgroup');
  if (colgroup) {
    next.appendChild(colgroup.cloneNode(true));
  }
  const thead = table.querySelector('thead');
  if (thead) {
    next.appendChild(thead.cloneNode(true));
  }
  next.appendChild(document.createElement('tbody'));
  return next;
};

const getTbody = (table: HTMLElement) => {
  return table.querySelector('tbody') as HTMLElement;
};
