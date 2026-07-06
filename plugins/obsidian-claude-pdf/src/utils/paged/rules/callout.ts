import type { PaginationRule } from '.';
import type { PageLayout } from '../types';
import { appendImageBlockInto, isImageBlock } from './image';
import { appendListChildren, isList } from './list';
import { appendTableChildren, isTable } from './table';
export const calloutRule: PaginationRule = {
  name: 'callout',
  match: block => block.classList.contains('callout'),
  apply: ({ block, layout }) => {
    appendCallout(block, layout);
  },
};

const appendCallout = (callout: HTMLElement, layout: PageLayout) => {
  const title = callout.querySelector('.callout-title');
  const content = callout.querySelector('.callout-content') as HTMLElement | null;

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
      const result = appendNodeIntoCallout({
        node,
        layout,
        callout,
        title,
        currentCallout,
        currentContent,
      });

      currentCallout = result.currentCallout;
      currentContent = result.currentContent;
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
        onNewPage,
      });

      continue;
    }

    if (isTable(node)) {
      appendTableChildren({
        table: node,
        layout,
        appendTo: () => currentContent,
        onNewPage,
      });

      continue;
    }

    if (isImageBlock(node)) {
      appendImageBlockInto({
        block: node,
        layout,
        appendTo: () => currentContent,
        onNewPage,
      });

      continue;
    }

    const result = appendNodeIntoCallout({
      node,
      layout,
      callout,
      title,
      currentCallout,
      currentContent,
    });

    currentCallout = result.currentCallout;
    currentContent = result.currentContent;
  }
};

const appendCalloutAsBlock = (callout: HTMLElement, layout: PageLayout) => {
  const cloned = layout.clone(callout);

  if (layout.tryAppend(cloned)) return;

  layout.newPage();
  layout.forceAppend(cloned);
};

const appendNodeIntoCallout = ({
  node,
  layout,
  callout,
  title,
  currentCallout,
  currentContent,
}: {
  node: Node;
  layout: PageLayout;
  callout: HTMLElement;
  title: Element | null;
  currentCallout: HTMLElement;
  currentContent: HTMLElement;
}) => {
  const clonedNode = node.cloneNode(true);

  currentContent.appendChild(clonedNode);

  if (!layout.isOverflow()) {
    return {
      currentCallout,
      currentContent,
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
    currentContent,
  };
};

const createEmptyCallout = (callout: HTMLElement, title: Element | null): HTMLElement => {
  const next = callout.cloneNode(false) as HTMLElement;

  if (title) {
    next.appendChild(title.cloneNode(true));
  }

  const content = document.createElement('div');
  content.className = 'callout-content';

  next.appendChild(content);

  return next;
};

const getCalloutContent = (callout: HTMLElement): HTMLElement => {
  const content = callout.querySelector(':scope > .callout-content');

  if (!content) {
    throw new Error('Missing .callout-content in paged callout');
  }

  return content as HTMLElement;
};

const getMeaningfulNodes = (content: HTMLElement): Node[] => {
  return Array.from(content.childNodes).filter(node => {
    return !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim());
  });
};

const hasMeaningfulChildNodes = (el: HTMLElement): boolean => {
  return Array.from(el.childNodes).some(node => {
    return !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim());
  });
};
