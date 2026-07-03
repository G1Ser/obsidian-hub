export interface PagedOptions {
  rootSelector?: string;
  pageWidth?: string;
  pageHeight?: string;
  padding?: string;
  gap?: string;
}

export async function paged(options: PagedOptions = {}) {
  const {
    rootSelector = '#source',
    pageWidth = '210mm',
    pageHeight = '297mm',
    padding = '5mm 10mm',
    gap = '5px',
  } = options;

  await document.fonts.ready;

  const win = window as any;

  if (win.mermaid) {
    await win.mermaid.run();
    convertMermaidSvgToImg();
  }

  const source = document.querySelector(rootSelector) as HTMLElement | null;

  if (!source) {
    throw new Error(`Missing root element: ${rootSelector}`);
  }

  const sourceClassName = source.className;

  const blocks = Array.from(source.children).map(el => el.cloneNode(true) as HTMLElement);

  const style = document.createElement('style');
  style.textContent = `
@page {
  size: A4;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${gap};
  padding: 20px;
  background: rgba(75,75,75,0.5);
}

@media print {
  body {
    display: block;
    padding: 0;
    gap: 0;
    background: white;
  }

  .pdf-page {
    break-after: page;
    box-shadow: none;
  }
}

.pdf-page {
  width: ${pageWidth};
  height: ${pageHeight};
  padding: ${padding};
  overflow: hidden;
  box-sizing: border-box;
  background: var(--claude-bg, #fff);
}

.pdf-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pdf-content img {
  max-width: 100%;
  height: auto;
}
`;
  document.head.appendChild(style);

  document.body.innerHTML = '';

  const createPage = (): HTMLElement => {
    const page = document.createElement('div');
    page.className = 'pdf-page';

    const content = document.createElement('article');
    content.className = `${sourceClassName} pdf-content`;

    page.appendChild(content);
    document.body.appendChild(page);

    return content;
  };

  const isOverflow = (content: HTMLElement): boolean => {
    return content.scrollHeight > content.clientHeight + 1;
  };

  const appendNormal = (block: HTMLElement, contentRef: { current: HTMLElement }) => {
    const cloned = block.cloneNode(true) as HTMLElement;

    contentRef.current.appendChild(cloned);

    if (!isOverflow(contentRef.current)) return;

    cloned.remove();

    contentRef.current = createPage();
    contentRef.current.appendChild(block.cloneNode(true));
  };

  const appendImage = (block: HTMLElement, contentRef: { current: HTMLElement }) => {
    const img = block.cloneNode(true) as HTMLImageElement;

    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    contentRef.current.appendChild(img);

    if (!isOverflow(contentRef.current)) return;

    img.remove();

    contentRef.current = createPage();
    contentRef.current.appendChild(img);

    if (isOverflow(contentRef.current)) {
      img.style.maxHeight = `${contentRef.current.clientHeight}px`;
      img.style.width = 'auto';
      img.style.objectFit = 'contain';
    }
  };

  const appendTable = (table: HTMLTableElement, contentRef: { current: HTMLElement }) => {
    const rows = Array.from(table.querySelectorAll('tbody > tr'));

    if (!rows.length) {
      appendNormal(table, contentRef);
      return;
    }

    const createEmptyTable = () => {
      const next = table.cloneNode(false) as HTMLTableElement;

      const colgroup = table.querySelector('colgroup');
      if (colgroup) {
        next.appendChild(colgroup.cloneNode(true));
      }

      const thead = table.querySelector('thead');
      if (thead) {
        next.appendChild(thead.cloneNode(true));
      }

      const tbody = document.createElement('tbody');
      next.appendChild(tbody);

      return next;
    };

    let currentTable = createEmptyTable();
    let tbody = currentTable.querySelector('tbody') as HTMLTableSectionElement;

    contentRef.current.appendChild(currentTable);

    for (const row of rows) {
      const clonedRow = row.cloneNode(true) as HTMLTableRowElement;
      tbody.appendChild(clonedRow);

      if (!isOverflow(contentRef.current)) continue;

      clonedRow.remove();

      if (!tbody.children.length) {
        currentTable.remove();
      }

      contentRef.current = createPage();

      currentTable = createEmptyTable();
      tbody = currentTable.querySelector('tbody') as HTMLTableSectionElement;

      tbody.appendChild(clonedRow);
      contentRef.current.appendChild(currentTable);
    }
  };

  const contentRef = {
    current: createPage(),
  };

  for (const block of blocks) {
    const tag = block.tagName.toLowerCase();

    if (tag === 'img') {
      appendImage(block, contentRef);
      continue;
    }

    if (tag === 'table') {
      appendTable(block as HTMLTableElement, contentRef);
      continue;
    }

    appendNormal(block, contentRef);
  }
}

function convertMermaidSvgToImg() {
  const svgs = Array.from(document.querySelectorAll('svg[id^="mermaid-"]')) as SVGSVGElement[];

  for (const svg of svgs) {
    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const rect = svg.getBoundingClientRect();

    const width =
      svg.getAttribute('width') && svg.getAttribute('width') !== '100%'
        ? Number.parseFloat(svg.getAttribute('width') || '')
        : rect.width;

    const height =
      svg.getAttribute('height') && svg.getAttribute('height') !== '100%'
        ? Number.parseFloat(svg.getAttribute('height') || '')
        : rect.height;

    if (width) {
      clonedSvg.setAttribute('width', String(width));
    }

    if (height) {
      clonedSvg.setAttribute('height', String(height));
    }

    const svgText = new XMLSerializer().serializeToString(clonedSvg);

    const img = document.createElement('img');
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    if (width) {
      img.width = width;
    }

    if (height) {
      img.height = height;
    }

    svg.replaceWith(img);
  }
}

declare global {
  interface Window {
    paged: typeof paged;
  }
}

window.paged = paged;
