# Obsidian Emmet

Emmet 缩写展开插件，快速生成 HTML 结构。

## 功能特性

在编辑器里输入缩写，一键展开为 HTML：

- `div>span*2` → `<div><span></span><span></span></div>`
- `table>tr*3>td*4` → 3 行 4 列的表格
- `ul>li*3{Item}` → 3 个带文本的 `<li>`
- `div+p` → `<div></div><p></p>` 同级兄弟

## 语法参考

### 基本语法

| 语法        | 说明      | 示例                           |
| ----------- | --------- | ------------------------------ |
| `tag`       | 生成标签  | `div` → `<div></div>`          |
| `tag*n`     | 重复 n 次 | `span*3` → 3 个 `<span>`       |
| `tag{text}` | 添加内容  | `p{Hello}` → `<p>Hello</p>`    |
| `>`         | 子级嵌套  | `div>p` → `<div><p></p></div>` |
| `+`         | 同级兄弟  | `div+p` → `<div></div><p></p>` |

### 组合使用

语法可以自由组合，构建复杂结构：

```
div>span*2           → 嵌套 + 重复
table>tr*3>td*4      → 多层嵌套 + 重复
ul>li*3{Item $}      → 重复 + 内容
div>p+span           → 嵌套 + 同级
```

## 使用方法

### 展开缩写

1. 在编辑器中输入 Emmet 缩写
2. 打开命令面板（`Ctrl+P` / `Cmd+P`）
3. 搜索并执行 **Expand Emmet abbreviation**

### 两种输入方式

**方式一：光标前识别**

```
输入：div>span*2|
执行命令后自动识别光标前的缩写并展开
```

**方式二：选中文本**

```
选中：div>span*2
执行命令后直接展开选中的文本
```

## 常见示例

### 表格结构

```
table>tr*3>td*4
```

展开为：

```html
<table>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>
```

### 列表结构

```
ul>li*3{Item}
```

展开为：

```html
<ul>
  <li>Item</li>
  <li>Item</li>
  <li>Item</li>
</ul>
```

### 嵌套布局

```
div>header+main+footer
```

展开为：

```html
<div>
  <header></header>
  <main></main>
  <footer></footer>
</div>
```
