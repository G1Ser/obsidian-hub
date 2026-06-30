/**
 * Emmet 缩写解析 & 展开引擎
 *
 * 支持的语法：
 *   tag          → <tag></tag>
 *   tag*3        → 重复 3 次
 *   tag{text}    → 内容 "text"
 *   >            → 子级嵌套
 *   +            → 同级兄弟
 *
 * 组合示例：
 *   div>span*2            → <div><span></span><span></span></div>
 *   table>tr*3>td*4       → 3 行 4 列表格
 *   div+p                 → <div></div><p></p> 同级兄弟
 */

export interface Node {
  tag: string;
  multiply: number;
  content: string;
  children: Node[];
}

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

/**
 * 解析 Emmet 缩写字符串 → 兄弟节点数组。
 *
 * 例："div+span*2" → [Node(div), Node(span, multiply=2)]
 *     "div>p"      → [Node(div, children=[Node(p)])]
 */
export const parse = (abbrev: string): Node[] => {
  return abbrev
    .split('+')
    .map(s => s.trim())
    .filter(Boolean)
    .map(parseGroup);
};

/** 解析 > 分隔的层级组 */
const parseGroup = (group: string): Node => {
  const parts = group
    .split('>')
    .map(s => s.trim())
    .filter(Boolean);

  // 从右往左构建嵌套树
  let node: Node | null = null;

  for (let i = parts.length - 1; i >= 0; i--) {
    const current = parseElement(parts[i]);
    if (node) {
      current.children = [node];
    }
    node = current;
  }

  return node!;
};

/** 解析单个元素：tag{content}*n（content 与 *n 顺序无关） */
const parseElement = (raw: string): Node => {
  let s = raw;
  let i = 0;

  // ---- tag ----
  let tag = '';
  while (i < s.length && /^[a-z]$/i.test(s[i])) {
    tag += s[i++];
  }

  // ---- {content} / *n（二者可出现任意顺序）----
  let content = '';
  let multiply = 1;

  for (let pass = 0; pass < 2; pass++) {
    if (s[i] === '{') {
      const end = s.indexOf('}', i);
      if (end > i) {
        content = s.slice(i + 1, end);
        i = end + 1;
      }
    }
    if (s[i] === '*') {
      i++;
      // Obsidian 有时会在 * 和数字之间插入空格，跳过
      while (i < s.length && s[i] === ' ') i++;
      let n = '';
      while (i < s.length && /^\d$/.test(s[i])) n += s[i++];
      multiply = +n || 1;
    }
  }

  if (!tag) tag = 'div';

  return { tag, multiply, content, children: [] };
};

// ---------------------------------------------------------------------------
// 展开
// ---------------------------------------------------------------------------

/** 单节点 → HTML 字符串（递归缩进） */
const expandNode = (node: Node, indent: number = 0): string => {
  const pad = '  '.repeat(indent);

  const open = `<${node.tag}>`;
  const close = `</${node.tag}>`;

  // ---- 内容 + 子节点 ----
  let body = node.content;
  for (const child of node.children) {
    body += '\n' + expandNode(child, indent + 1);
  }

  // ---- 决定行内 / 块级格式 ----
  const block = node.children.length > 0 || body.includes('\n');

  let one: string;
  if (block) {
    one = pad + open + body + '\n' + pad + close;
  } else {
    one = pad + open + body + close;
  }

  // ---- 乘法 ----
  if (node.multiply > 1) {
    one = Array(node.multiply).fill(one).join('\n');
  }

  return one;
};

/**
 * 顶层入口：兄弟节点数组 → HTML 字符串。
 */
export const expand = (nodes: Node[]): string => {
  return nodes.map(n => expandNode(n)).join('\n');
};
