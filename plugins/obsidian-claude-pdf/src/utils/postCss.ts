import { App } from 'obsidian';
import postcss from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

const loadCss = async (app: App, path: string, prefix?: string) => {
  const css = await app.vault.adapter.read(path);
  if (!prefix) return css;
  const result = await postcss([
    prefixSelector({
      prefix,
      transform(prefix, selector) {
        if (selector === ':root') {
          return ':root';
        } else if (selector === '*') {
          return prefix;
        }
        return `${prefix} ${selector}`;
      },
    }),
  ]).process(css, { from: undefined });
  return result.css;
};

export { loadCss };
