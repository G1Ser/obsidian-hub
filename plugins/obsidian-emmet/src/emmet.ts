/**
 * Emmet 缩写解析 & 展开引擎
 *
 * 支持的语法：
 *   tag          → <tag></tag>
 *   tag.class    → <tag class="class"></tag>
 *   tag#id       → <tag id="id"></tag>
 *   tag[attr=v]  → <tag attr="v"></tag>
 *   tag*3        → 重复 3 次
 *   tag{text}    → 内容 "text"
 *   >            → 子级嵌套
 *   +            → 同级兄弟
 *
 * 组合示例：
 *   div>span*2            → <div><span></span><span></span></div>
 *   table>tr*3>td*4       → 3 行 4 列表格
 *   div#main.container    → <div id="main" class="container"></div>
 */

export interface Node {
  tag: string;
  classes: string[];
  id: string;
  attrs: [string, string][];
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
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseGroup);
};

/** 解析 > 分隔的层级组 */
const parseGroup = (group: string): Node => {
  const parts = group
    .split(">")
    .map((s) => s.trim())
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

/** 解析单个元素：tag.class#id[attrs]{content}*n */
const parseElement = (raw: string): Node => {
  let s = raw;
  let i = 0;

  // ---- tag ----
  let tag = "";
  while (i < s.length && /^[a-z]$/i.test(s[i])) {
    tag += s[i++];
  }

  // ---- .class 和 #id ----
  const classes: string[] = [];
  let id = "";

  while (i < s.length) {
    if (s[i] === ".") {
      i++;
      let cls = "";
      while (i < s.length && /^[\w-]$/.test(s[i])) cls += s[i++];
      if (cls) classes.push(cls);
    } else if (s[i] === "#") {
      i++;
      id = "";
      while (i < s.length && /^[\w-]$/.test(s[i])) id += s[i++];
    } else {
      break;
    }
  }

  // ---- [attrs] ----
  const attrs: [string, string][] = [];
  if (s[i] === "[") {
    const end = s.indexOf("]", i);
    if (end > i) {
      const rawAttrs = s.slice(i + 1, end);
      const pairs = rawAttrs.match(/([\w-]+)\s*=\s*([^\]\s]+)/g) || [];
      for (const p of pairs) {
        const eq = p.indexOf("=");
        attrs.push([p.slice(0, eq).trim(), p.slice(eq + 1).trim()]);
      }
      i = end + 1;
    }
  }

  // ---- {content} ----
  let content = "";
  if (s[i] === "{") {
    const end = s.indexOf("}", i);
    if (end > i) {
      content = s.slice(i + 1, end);
      i = end + 1;
    }
  }

  // ---- *n ----
  let multiply = 1;
  if (s[i] === "*") {
    i++;
    let n = "";
    while (i < s.length && /^\d$/.test(s[i])) n += s[i++];
    multiply = +n || 1;
  }

  if (!tag) tag = "div";

  return { tag, classes, id, attrs, multiply, content, children: [] };
};

// ---------------------------------------------------------------------------
// 展开
// ---------------------------------------------------------------------------

/** 单节点 → HTML 字符串 */
const expandNode = (node: Node): string => {
  // ---- 属性串 ----
  const attrParts: string[] = [];

  if (node.id) attrParts.push(`id="${node.id}"`);
  if (node.classes.length) attrParts.push(`class="${node.classes.join(" ")}"`);
  for (const [k, v] of node.attrs) attrParts.push(`${k}="${v}"`);

  const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";

  const open = `<${node.tag}${attrStr}>`;
  const close = `</${node.tag}>`;

  // ---- 子节点 ----
  let body = node.content;
  for (const child of node.children) {
    body += expandNode(child);
  }

  // ---- 乘法 ----
  let one = open + body + close;
  if (node.multiply > 1) {
    one = Array(node.multiply).fill(one).join("\n");
  }

  return one;
};

/**
 * 顶层入口：兄弟节点数组 → HTML 字符串。
 */
export const expand = (nodes: Node[]): string => {
  return nodes.map(expandNode).join("\n");
};
