import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import markedFootnote from 'marked-footnote';
import { codeToHtml } from 'shiki';

/* ---- callout icons ---- */

const ICONS: Record<string, string> = {
  pencil:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg>',
  flame:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-flame"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path></svg>',
  alert:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>',
  check:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>',
  bug: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bug"><path d="M12 20v-9"></path><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"></path><path d="M14.12 3.88 16 2"></path><path d="M21 21a4 4 0 0 0-3.81-4"></path><path d="M21 5a4 4 0 0 1-3.55 3.97"></path><path d="M22 13h-4"></path><path d="M3 21a4 4 0 0 1 3.81-4"></path><path d="M3 5a4 4 0 0 0 3.55 3.97"></path><path d="M6 13H2"></path><path d="m8 2 1.88 1.88"></path><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"></path></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><path d="M3 5h.01"></path><path d="M3 12h.01"></path><path d="M3 19h.01"></path><path d="M8 5h13"></path><path d="M8 12h13"></path><path d="M8 19h13"></path></svg>',
  quote:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-quote"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>',
};

const CALLOUTS: Record<string, { color: string; icon: string; label: string }> = {
  note: { color: '8, 109, 221', icon: ICONS.pencil, label: 'Note' },
  tip: { color: '0, 191, 188', icon: ICONS.flame, label: 'Tip' },
  warning: { color: '236, 117, 0', icon: ICONS.alert, label: 'Warning' },
  danger: { color: '233, 49, 71', icon: ICONS.zap, label: 'Danger' },
  success: { color: '8, 185, 78', icon: ICONS.check, label: 'Success' },
  bug: { color: '233, 49, 71', icon: ICONS.bug, label: 'Bug' },
  example: { color: '120, 82, 238', icon: ICONS.list, label: 'Example' },
  quote: { color: '158, 158, 158', icon: ICONS.quote, label: 'Quote' },
  info: { color: '8, 109, 221', icon: ICONS.pencil, label: 'Info' },
};

const CALLOUT_ALIASES: Record<string, string> = {
  abstract: 'note',
  summary: 'note',
  tldr: 'note',
  todo: 'info',
  hint: 'tip',
  important: 'tip',
  check: 'success',
  done: 'success',
  question: 'info',
  help: 'info',
  faq: 'info',
  caution: 'warning',
  attention: 'warning',
  failure: 'danger',
  fail: 'danger',
  missing: 'danger',
  error: 'danger',
  cite: 'quote',
};

/* ---- init marked ---- */

marked.use(markedKatex({ throwOnError: false }));
marked.use(markedFootnote());

/* ---- Obsidian syntax pre-processing ---- */

const convertCallouts = (md: string): string => {
  const lines = md.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^>\s*\[!([A-Za-z][\w-]*)(?:[+-])?\]\s*(.*)$/);

    if (!match) {
      out.push(lines[i]);
      continue;
    }

    const rawType = match[1].toLowerCase();
    const type = CALLOUT_ALIASES[rawType] || rawType;
    const cfg = CALLOUTS[type] || CALLOUTS.note;
    const heading = match[2].trim() || cfg.label;
    const body: string[] = [];

    while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
      i++;
      body.push(lines[i].replace(/^>\s?/, ''));
    }

    const content = body.join('\n').trim();
    out.push(
      [
        `<div class="callout" style="--callout-color: ${cfg.color}" data-callout="${rawType}">`,
        `  <div class="callout-title">`,
        `    <div class="callout-icon">${cfg.icon}</div>`,
        `    <div class="callout-title-inner">${heading}</div>`,
        `  </div>`,
        `  <div class="callout-content">`,
        ``,
        content,
        ``,
        `  </div>`,
        `</div>`,
      ].join('\n'),
    );
  }

  return out.join('\n');
};

/* ---- Expand Markdown To Fit Obsidian ---- */
const preprocessMarkdown = (md: string): string => {
  md = convertCallouts(md);
  md = md.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
  md = md.replace(/(!?)\[\[([^\]]+)\]\]/g, (_: string, bang: string, raw: string) => {
    if (bang) return _;
    const hashIdx = raw.indexOf('#');
    const page = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const heading = hashIdx >= 0 ? raw.slice(hashIdx + 1) : '';
    const href = heading ? `${page}#${heading}` : page;
    const display = heading ? `${page} → ${heading}` : raw;
    return `<a class="internal-link" href="${href}">${display}</a>`;
  });
  return md;
};

/* ---- Shiki highlight ---- */

const highlightCodeBlocks = async (html: string): Promise<string> => {
  const regex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  const matches: { full: string; lang: string; code: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    matches.push({ full: m[0], lang: m[1], code: m[2] });
  }
  for (const match of matches) {
    const decoded = match.code
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const highlighted = await codeToHtml(decoded, {
      lang: match.lang,
      theme: 'github-light-default',
    });
    html = html.replace(match.full, highlighted);
  }
  return html;
};

export const markdownToHtml = async (md: string): Promise<string> => {
  md = preprocessMarkdown(md);
  let html = await marked.parse(md);

  /* mermaid — keep raw syntax in <pre class="mermaid"> */
  html = html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_: string, code: string) => `<pre class="mermaid">${code}</pre>`,
  );

  html = await highlightCodeBlocks(html);
  return html;
};
