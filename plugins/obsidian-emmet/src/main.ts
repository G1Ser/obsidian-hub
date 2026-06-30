import { Plugin, Editor, Notice } from 'obsidian';
import { parse, expand } from './emmet';

const ABBREV_RE = /([a-z][\w*>{}+\-]+)$/i;

export default class ObsidianEmmetPlugin extends Plugin {
  onload = (): void => {
    this.addCommand({
      id: 'expand-abbreviation',
      name: 'Expand Emmet abbreviation',
      editorCallback: (editor: Editor) => this.expandAtCursor(editor),
    });
  };

  private expandAtCursor = (editor: Editor): void => {
    const selection = editor.getSelection();
    let abbrev: string;
    let from = editor.getCursor('from');
    let to = editor.getCursor('to');

    if (selection) {
      abbrev = selection.trim();
    } else {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);
      const textBefore = line.slice(0, cursor.ch);
      const match = textBefore.match(ABBREV_RE);
      if (!match) {
        new Notice('No Emmet abbreviation found before cursor.');
        return;
      }

      abbrev = match[1];
      from = { line: cursor.line, ch: cursor.ch - abbrev.length };
      to = cursor;
    }

    try {
      const html = expand(parse(abbrev));
      editor.replaceRange(html, from, to);
    } catch (e) {
      new Notice(`Emmet: ${e}`);
    }
  };
}
