"use strict";
(() => {
  // src/utils/paged/options.ts
  var DEFAULT_OPTIONS = {
    rootSelector: "#source",
    pageWidth: "210mm",
    pageHeight: "297mm",
    marginTop: "5mm",
    marginRight: "10mm",
    marginBottom: "5mm",
    marginLeft: "10mm"
  };
  var mergeOptions = (options = {}) => {
    return {
      ...DEFAULT_OPTIONS,
      ...options
    };
  };

  // src/utils/paged/prepare.ts
  var convertMermaidSvgToImg = () => {
    const svgs = Array.from(document.querySelectorAll('svg[id^="mermaid-"]'));
    for (const svg of svgs) {
      const clonedSvg = svg.cloneNode(true);
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const rect = svg.getBoundingClientRect();
      const width = svg.getAttribute("width") && svg.getAttribute("width") !== "100%" ? Number.parseFloat(svg.getAttribute("width") || "") : rect.width;
      const height = svg.getAttribute("height") && svg.getAttribute("height") !== "100%" ? Number.parseFloat(svg.getAttribute("height") || "") : rect.height;
      if (width) clonedSvg.setAttribute("width", String(width));
      if (height) clonedSvg.setAttribute("height", String(height));
      const svgText = new XMLSerializer().serializeToString(clonedSvg);
      const img = document.createElement("img");
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      if (width) img.width = width;
      if (height) img.height = height;
      svg.replaceWith(img);
    }
  };
  var prepareDocument = async () => {
    await document.fonts.ready;
    const win = window;
    if (win.mermaid) {
      await win.mermaid.run();
      convertMermaidSvgToImg();
    }
  };

  // src/utils/paged/normalize.ts
  var removeHr = (root) => {
    const headings = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    const last = root.lastElementChild;
    for (const heading of headings) {
      const prev = heading.previousElementSibling;
      if (prev && ["HR", "hr"].includes(prev.tagName)) {
        prev.remove();
      }
    }
    if (last && ["HR", "hr"].includes(last.tagName)) {
      last.remove();
    }
  };
  var normalizeDocument = (root) => {
    removeHr(root);
  };

  // src/utils/paged/layout.ts
  var createLayout = (source, opts) => {
    injectPageStyle(opts);
    const sourceClassName = source.className;
    document.body.innerHTML = "";
    const layout = {};
    layout.sourceClassName = sourceClassName;
    layout.createPage = () => createPage(sourceClassName);
    layout.newPage = () => {
      layout.currentPage = layout.createPage();
      layout.currentContainer = layout.currentPage;
      return layout.currentPage;
    };
    layout.isOverflow = () => {
      return layout.currentPage.scrollHeight > layout.currentPage.clientHeight + 1;
    };
    layout.tryAppend = (node) => {
      layout.currentContainer.appendChild(node);
      if (!layout.isOverflow()) {
        return node;
      }
      node.remove();
      return null;
    };
    layout.forceAppend = (node) => {
      layout.currentContainer.appendChild(node);
      return node;
    };
    layout.withContainer = (container, fn) => {
      const prev = layout.currentContainer;
      layout.currentContainer = container;
      try {
        return fn();
      } finally {
        layout.currentContainer = prev;
      }
    };
    layout.clone = (node) => {
      return node.cloneNode(true);
    };
    layout.currentPage = layout.createPage();
    layout.currentContainer = layout.currentPage;
    return layout;
  };
  var createPage = (sourceClassName) => {
    const page = document.createElement("article");
    page.className = `${sourceClassName} pdf-page`;
    document.body.appendChild(page);
    return page;
  };
  var injectPageStyle = (opts) => {
    const style = document.createElement("style");
    style.textContent = `
@page {
  size: ${opts.pageWidth} ${opts.pageHeight};
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
}

.pdf-page{
    width: ${opts.pageWidth};
    height: ${opts.pageHeight};
    padding: ${opts.marginTop} ${opts.marginRight} ${opts.marginBottom} ${opts.marginLeft};
    box-sizing: border-box;
    background: var(--claude-bg);
    overflow:hidden;
}

@media print {
  .pdf-page {
    break-after: page;
  }
}
`;
    document.head.appendChild(style);
  };

  // src/utils/paged/rules/default.ts
  var defaultRule = {
    name: "default",
    match: () => true,
    apply: ({ block, layout }) => {
      const cloned = layout.clone(block);
      if (layout.tryAppend(cloned)) {
        return;
      }
      layout.newPage();
      layout.forceAppend(cloned);
    }
  };

  // src/utils/paged/rules/heading.ts
  var HEADING_SELECTOR = "h1,h2,h3,h4,h5,h6";
  var headingRule = {
    name: "heading",
    match: (block) => block.matches(HEADING_SELECTOR),
    apply: ({ block, nextBlock, layout }) => {
      appendHeading(block, nextBlock, layout);
    }
  };
  var appendHeading = (heading, nextBlock, layout) => {
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
    if (!pageWasEmpty) {
      layout.newPage();
    }
    layout.forceAppend(layout.clone(heading));
  };

  // src/utils/paged/rules/image.ts
  var imageRule = {
    name: "image",
    match: (block) => block.tagName.toLowerCase() === "img",
    apply: ({ block, layout }) => {
      const img = layout.clone(block);
      if (layout.tryAppend(img)) {
        return;
      }
      layout.newPage();
      layout.forceAppend(img);
    }
  };

  // src/utils/paged/rules/table.ts
  var tableRule = {
    name: "table",
    match: (block) => block.tagName.toLowerCase() === "table",
    apply: ({ block, layout }) => {
      const rows = Array.from(block.querySelectorAll("tbody > tr"));
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
    }
  };
  var createEmptyTable = (table) => {
    const next = table.cloneNode(false);
    const colgroup = table.querySelector("colgroup");
    if (colgroup) {
      next.appendChild(colgroup.cloneNode(true));
    }
    const thead = table.querySelector("thead");
    if (thead) {
      next.appendChild(thead.cloneNode(true));
    }
    next.appendChild(document.createElement("tbody"));
    return next;
  };
  var getTbody = (table) => {
    return table.querySelector("tbody");
  };

  // src/utils/paged/rules/list.ts
  var listRule = {
    name: "list",
    match: (block) => isList(block),
    apply: ({ block, layout }) => {
      appendList(block, layout);
    }
  };
  var appendList = (list, layout) => {
    const items = Array.from(list.children);
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
  var appendListChildren = ({
    list,
    layout,
    appendTo,
    onNewPage
  }) => {
    let currentList = createEmptyList(list);
    appendTo().appendChild(currentList);
    const items = Array.from(list.children);
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
  var isList = (node) => {
    const tag = node.tagName.toLowerCase();
    return tag === "ul" || tag === "ol";
  };
  var appendListAsBlock = (list, layout) => {
    const cloned = layout.clone(list);
    if (layout.tryAppend(cloned)) return;
    layout.newPage();
    layout.forceAppend(cloned);
  };
  var createEmptyList = (list) => {
    return list.cloneNode(false);
  };

  // src/utils/paged/rules/callout.ts
  var calloutRule = {
    name: "callout",
    match: (block) => block.classList.contains("callout"),
    apply: ({ block, layout }) => {
      appendCallout(block, layout);
    }
  };
  var appendCallout = (callout, layout) => {
    const title = callout.querySelector(".callout-title");
    const content = callout.querySelector(".callout-content");
    if (!content) {
      appendCalloutAsBlock(callout, layout);
      return;
    }
    const nodes = getMeaningfulNodes(content);
    if (!nodes.length) {
      appendCalloutAsBlock(callout, layout);
      return;
    }
    let currentCallout = createEmptyCallout(callout, title);
    let currentContent = getCalloutContent(currentCallout);
    layout.forceAppend(currentCallout);
    for (const node of nodes) {
      if (node instanceof HTMLElement && isList(node)) {
        appendListChildren({
          list: node,
          layout,
          appendTo: () => currentContent,
          onNewPage: () => {
            if (!hasMeaningfulChildNodes(currentContent)) {
              currentCallout.remove();
            }
            layout.newPage();
            currentCallout = createEmptyCallout(callout, title);
            currentContent = getCalloutContent(currentCallout);
            layout.forceAppend(currentCallout);
            return currentContent;
          }
        });
        continue;
      }
      const result = appendNodeIntoCallout({
        node,
        layout,
        callout,
        title,
        currentCallout,
        currentContent
      });
      currentCallout = result.currentCallout;
      currentContent = result.currentContent;
    }
  };
  var appendCalloutAsBlock = (callout, layout) => {
    const cloned = layout.clone(callout);
    if (layout.tryAppend(cloned)) return;
    layout.newPage();
    layout.forceAppend(cloned);
  };
  var appendNodeIntoCallout = ({
    node,
    layout,
    callout,
    title,
    currentCallout,
    currentContent
  }) => {
    const clonedNode = node.cloneNode(true);
    currentContent.appendChild(clonedNode);
    if (!layout.isOverflow()) {
      return {
        currentCallout,
        currentContent
      };
    }
    clonedNode.parentNode?.removeChild(clonedNode);
    if (!hasMeaningfulChildNodes(currentContent)) {
      currentCallout.remove();
    }
    layout.newPage();
    currentCallout = createEmptyCallout(callout, title);
    currentContent = getCalloutContent(currentCallout);
    currentContent.appendChild(clonedNode);
    layout.forceAppend(currentCallout);
    return {
      currentCallout,
      currentContent
    };
  };
  var createEmptyCallout = (callout, title) => {
    const next = callout.cloneNode(false);
    if (title) {
      next.appendChild(title.cloneNode(true));
    }
    const content = document.createElement("div");
    content.className = "callout-content";
    next.appendChild(content);
    return next;
  };
  var getCalloutContent = (callout) => {
    const content = callout.querySelector(":scope > .callout-content");
    if (!content) {
      throw new Error("Missing .callout-content in paged callout");
    }
    return content;
  };
  var getMeaningfulNodes = (content) => {
    return Array.from(content.childNodes).filter((node) => {
      return !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim());
    });
  };
  var hasMeaningfulChildNodes = (el) => {
    return Array.from(el.childNodes).some((node) => {
      return !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim());
    });
  };

  // src/utils/paged/rules/index.ts
  var rules = [
    headingRule,
    calloutRule,
    tableRule,
    imageRule,
    listRule,
    defaultRule
  ];
  var applyRule = (args) => {
    const rule = rules.find((item) => item.match(args.block));
    rule?.apply(args);
  };

  // src/utils/paged/append.ts
  var layoutBlocks = (blocks, layout, opts) => {
    for (let index = 0; index < blocks.length; index++) {
      applyRule({
        block: blocks[index],
        nextBlock: blocks[index + 1],
        blocks,
        index,
        layout,
        opts
      });
    }
  };

  // src/utils/paged/index.ts
  var paged = async (options = {}) => {
    const opts = mergeOptions(options);
    const { rootSelector } = opts;
    await prepareDocument();
    const source = document.querySelector(rootSelector);
    if (!source) {
      throw new Error(`Missing root element: ${rootSelector}`);
      return;
    }
    normalizeDocument(source);
    const blocks = Array.from(source.children).map((el) => el.cloneNode(true));
    const layout = createLayout(source, opts);
    layoutBlocks(blocks, layout, opts);
  };
  window.paged = paged;
})();
