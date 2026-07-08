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
  var waitForImages = async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map(
        (img) => new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
      )
    );
  };
  var prepareDocument = async () => {
    await document.fonts.ready;
    const win = window;
    if (win.mermaid) {
      await win.mermaid.run();
      convertMermaidSvgToImg();
    }
    await waitForImages();
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

  // src/utils/paged/rules/image.ts
  var MIN_REMAINING_HEIGHT_FOR_SCALE = 350;
  var MIN_SCALED_IMAGE_HEIGHT = 120;
  var IMAGE_HEIGHT_STEP = 24;
  var imageRule = {
    name: "image",
    match: (block) => isImageBlock(block),
    apply: ({ block, layout }) => {
      appendImageBlock(block, layout);
    }
  };
  var isImageBlock = (block) => {
    if (block.tagName.toLowerCase() === "img") {
      return true;
    }
    if (block.tagName.toLowerCase() !== "p") {
      return false;
    }
    const meaningfulChildren = Array.from(block.childNodes).filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return Boolean(node.textContent?.trim());
      }
      return node.nodeName.toLowerCase() !== "br";
    });
    return meaningfulChildren.length > 0 && meaningfulChildren.every(isImageNode);
  };
  var appendImageBlock = (block, layout) => {
    appendImageBlockInto({
      block,
      layout,
      appendTo: () => layout.currentContainer,
      onNewPage: () => {
        layout.newPage();
        return layout.currentContainer;
      }
    });
  };
  var appendImageBlockInto = ({
    block,
    layout,
    appendTo,
    onNewPage
  }) => {
    const cloned = layout.clone(block);
    appendTo().appendChild(cloned);
    if (!layout.isOverflow()) {
      return;
    }
    cloned.remove();
    if (tryAppendScaledImageBlock({ block, layout, appendTo })) {
      return;
    }
    onNewPage().appendChild(layout.clone(block));
  };
  var isImageNode = (node) => {
    return node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "img";
  };
  var tryAppendScaledImageBlock = ({
    block,
    layout,
    appendTo
  }) => {
    const availableHeight = getCurrentPageRemainingHeight(layout);
    if (availableHeight < MIN_REMAINING_HEIGHT_FOR_SCALE) {
      return false;
    }
    for (let maxHeight = Math.floor(availableHeight); maxHeight >= MIN_SCALED_IMAGE_HEIGHT; maxHeight -= IMAGE_HEIGHT_STEP) {
      const cloned = layout.clone(block);
      fitImagesToHeight(cloned, maxHeight);
      appendTo().appendChild(cloned);
      if (!layout.isOverflow()) {
        return true;
      }
      cloned.remove();
    }
    return false;
  };
  var fitImagesToHeight = (block, maxHeight) => {
    const images = block.tagName.toLowerCase() === "img" ? [block] : Array.from(block.querySelectorAll("img"));
    for (const img of images) {
      img.style.width = "100%";
      img.style.maxHeight = `${maxHeight}px`;
      img.style.objectFit = "contain";
    }
  };
  var getCurrentPageRemainingHeight = (layout) => {
    const pageRect = layout.currentPage.getBoundingClientRect();
    const styles = window.getComputedStyle(layout.currentPage);
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const lastChild = layout.currentPage.lastElementChild;
    const contentTop = pageRect.top + paddingTop;
    const contentBottom = pageRect.bottom - paddingBottom;
    const usedBottom = lastChild ? lastChild.getBoundingClientRect().bottom : contentTop;
    return Math.max(0, contentBottom - usedBottom);
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
    if (nextBlock && (isImageBlock(nextBlock) || isCallout(nextBlock))) {
      appendHeadingOnly(clonedHeading, pageWasEmpty, layout);
      return;
    }
    if (!nextBlock) {
      appendHeadingOnly(clonedHeading, pageWasEmpty, layout);
      return;
    }
    const clonedNext = cloneKeepWithNextBlock(nextBlock, layout);
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
  var appendHeadingOnly = (heading, pageWasEmpty, layout) => {
    if (layout.tryAppend(heading)) return;
    if (!pageWasEmpty) {
      layout.newPage();
    }
    layout.forceAppend(heading);
  };
  var cloneKeepWithNextBlock = (block, layout) => {
    if (!isList(block)) {
      return layout.clone(block);
    }
    const firstItem = block.firstElementChild;
    const list = block.cloneNode(false);
    if (firstItem) {
      list.appendChild(layout.clone(firstItem));
    }
    return list;
  };
  var isCallout = (block) => {
    return block.classList.contains("callout");
  };

  // src/utils/paged/rules/table.ts
  var tableRule = {
    name: "table",
    match: (block) => isTable(block),
    apply: ({ block, layout }) => {
      appendTable(block, layout);
    }
  };
  var appendTable = (table, layout) => {
    appendTableChildren({
      table,
      layout,
      appendTo: () => layout.currentContainer,
      onNewPage: () => {
        layout.newPage();
        return layout.currentContainer;
      }
    });
  };
  var appendTableChildren = ({
    table,
    layout,
    appendTo,
    onNewPage
  }) => {
    const rows = Array.from(table.querySelectorAll("tbody > tr"));
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
  var isTable = (block) => block.tagName.toLowerCase() === "table";
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
      if (!(node instanceof HTMLElement)) {
        const result2 = appendNodeIntoCallout({
          node,
          layout,
          callout,
          title,
          currentCallout,
          currentContent
        });
        currentCallout = result2.currentCallout;
        currentContent = result2.currentContent;
        continue;
      }
      const onNewPage = () => {
        if (!hasMeaningfulChildNodes(currentContent)) {
          currentCallout.remove();
        }
        layout.newPage();
        currentCallout = createEmptyCallout(callout, title);
        currentContent = getCalloutContent(currentCallout);
        layout.forceAppend(currentCallout);
        return currentContent;
      };
      if (isList(node)) {
        appendListChildren({
          list: node,
          layout,
          appendTo: () => currentContent,
          onNewPage
        });
        continue;
      }
      if (isTable(node)) {
        appendTableChildren({
          table: node,
          layout,
          appendTo: () => currentContent,
          onNewPage
        });
        continue;
      }
      if (isImageBlock(node)) {
        appendImageBlockInto({
          block: node,
          layout,
          appendTo: () => currentContent,
          onNewPage
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
