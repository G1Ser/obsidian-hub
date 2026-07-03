import fs from 'fs';
import postcss from 'postcss';
import prefixSelector from 'postcss-prefix-selector';

const loadCss = async (path: string, prefix?: string) => {
  const css = fs.readFileSync(path, 'utf-8');
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
