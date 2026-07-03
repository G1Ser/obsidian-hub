/**
 * 删除 hr。
 */
const removeHr = (root: HTMLElement) => {
  const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const last = root.lastElementChild;
  for (const heading of headings) {
    const prev = heading.previousElementSibling;
    if (prev && ['HR', 'hr'].includes(prev.tagName)) {
      prev.remove();
    }
  }
  if (last && ['HR', 'hr'].includes(last.tagName)) {
    last.remove();
  }
};

/**
 * 清洗 Markdown
 */
export const normalizeDocument = (root: HTMLElement) => {
  removeHr(root);
};
