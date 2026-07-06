import type { PaginationRule } from '.';

export const tableRule: PaginationRule = {
  name: 'table',
  match: block => block.tagName.toLowerCase() === 'table',
  apply: ({ block, layout }) => {
    const rows = Array.from(block.querySelectorAll('tbody > tr')) as HTMLElement[];
    if (!rows.length) {
      const cloned = layout.clone(block);
      if (layout.tryAppend(cloned)) {
        return;
      }
      layout.newPage();
      layout.forceAppend(cloned);
      return;
    }
    let currentTable = createEmptyTable(block);
    let currentTbody = getTbody(currentTable);
    layout.forceAppend(currentTable);
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
      layout.newPage();
      currentTable = createEmptyTable(block);
      currentTbody = getTbody(currentTable);
      currentTbody.appendChild(clonedRow);
      layout.forceAppend(currentTable);
    }
  },
};

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
