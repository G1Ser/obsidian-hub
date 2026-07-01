所有callout元素都是

```html
<div class="callout">
  <div class="callout-title">
    <div class="callout-icon"><svg class="svg-icon"></svg></div>
    <div class="callout-title-inner">{{callout的类型 'note' | 'example' | '...'}}</div>
  </div>
  <div class="callout-content"><p>{{callout的内容}}</p></div>
</div>
<style>
  .markdown-rendered .callout {
    margin-top: 0 !important;
    margin-bottom: 0.75rem !important;
    padding-left: 0.5rem !important;
    padding-right: 2rem !important;
  }
  .callout {
    border-radius: 8px !important;
    border: 1px solid #1f1e1d1a !important;
    border-left: 3px solid rgb(var(--callout-color)) !important;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.18)),
      linear-gradient(90deg, rgba(var(--callout-color), 0.1), transparent 32%) !important;
    box-shadow: 0 12px 28px -26px rgba(31, 30, 29, 0.12) !important;
    padding: 0.8rem 1rem !important;
  }
  .callout-title {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.3;
    font-family: var(--pdf-font-sans) !important;
    font-weight: 700 !important;
    font-size: 0.82em !important;
    color: rgb(var(--callout-color)) !important;
    margin-bottom: 0.35rem !important;
  }
  .callout-icon {
    flex: 0 0 auto;
    display: flex;
    align: center;
  }
  .callout-icon .svg-icon {
    color: rgb(var(--callout-color));
  }
  svg .svg-icon {
    height: 18px;
    width: 18px;
    stroke-width: 1.75px;
  }
  .callout-title-inner{
    font-weight: var(calc(400 + 200))
    color: inherit;
  }
  .callout-content{
    font-size: 0.95em !important;
    line-height: 1.6 !important;
    overflow-x:auto;
    padding: 0;
    background: transpraent;
  }
</style>
```

# note

```css
--callout-color: 8, 109, 221;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg>
```

# tip

```css
--callout-color: 0, 191, 188;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-flame"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path></svg>
```

# warning

```css
--callout-color: 236, 117, 0;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
```

# danger

```css
--callout-color: 233, 49, 71;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
```

# success

```css
--callout-color: 8, 185, 78;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
```

# bug

```css
--callout-color: 233, 49, 71;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bug"><path d="M12 20v-9"></path><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"></path><path d="M14.12 3.88 16 2"></path><path d="M21 21a4 4 0 0 0-3.81-4"></path><path d="M21 5a4 4 0 0 1-3.55 3.97"></path><path d="M22 13h-4"></path><path d="M3 21a4 4 0 0 1 3.81-4"></path><path d="M3 5a4 4 0 0 0 3.55 3.97"></path><path d="M6 13H2"></path><path d="m8 2 1.88 1.88"></path><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"></path></svg>
```

# example

```css
--callout-color: 120, 82, 238;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><path d="M3 5h.01"></path><path d="M3 12h.01"></path><path d="M3 19h.01"></path><path d="M8 5h13"></path><path d="M8 12h13"></path><path d="M8 19h13"></path></svg>
```

# quote

```css
--callout-color: 158, 158, 158;
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-quote"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>
```
