import { describe, it, expect } from 'vitest';
import { parse, expand } from '../src/emmet';

describe('emmet parse & expand', () => {
  it('div>span*2 → <div><span></span><span></span></div>', () => {
    const html = expand(parse('div>span*2'));
    expect(html).toBe('<div>\n  <span></span>\n  <span></span>\n</div>');
  });

  it('table>tr*3>td*4 → 3行4列表格', () => {
    const html = expand(parse('table>tr*3>td*4'));
    const row = '  <tr>\n    <td></td>\n    <td></td>\n    <td></td>\n    <td></td>\n  </tr>';
    expect(html).toBe(`<table>\n${row}\n${row}\n${row}\n</table>`);
  });

  it('ul>li*3{Item} → 3个带文本的<li>', () => {
    const html = expand(parse('ul>li*3{Item}'));
    expect(html).toBe('<ul>\n  <li>Item</li>\n  <li>Item</li>\n  <li>Item</li>\n</ul>');
  });

  it('div>p*2>span* 10 → 2 P 各含 10 span（Obsidian 空格插入）', () => {
    const html = expand(parse('div>p*2>span* 10'));
    const spans = (html.match(/<span>/g) || []).length;
    expect(spans).toBe(20); // 2 P × 10 span
  });

  it('div+p → <div></div><p></p> 同级兄弟', () => {
    const html = expand(parse('div+p'));
    expect(html).toBe('<div></div>\n<p></p>');
  });
});
