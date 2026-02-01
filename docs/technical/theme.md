# THEME 主题指南

本项目的可定制样式集中在 CSS 变量与少量自定义工具类中，配合 Tailwind 默认主题使用。本文档汇总颜色、变量、字体、圆角以及依赖的刻度，供后续开发参考与扩展。

## 结构与来源
- 主题变量与别名：见 [theme.css](../src/styles/theme.css)
- 全局样式与实用类：见 [index.css](../src/styles/index.css)
- 字体名单：见 [fonts.ts](../src/config/fonts.ts)
- 主题切换逻辑：见 [theme-provider.tsx](../src/context/theme-provider.tsx)
- Tailwind 默认刻度与预设：见 [default-theme.js](../node_modules/tailwindcss/dist/default-theme.js)

## 主题切换
 - 通过在根元素添加 `.light` 或 `.dark` 类控制主题变量生效，具体实现参考 [theme-provider.tsx](../src/context/theme-provider.tsx#L55-L76)。

## 颜色系统
- 颜色采用 oklch/rgb/hsl 表示，分为「亮色」与「暗色」两套变量。
- 亮色变量源：[theme.css:L1-L35](../src/styles/theme.css#L1-L35)
  - background, foreground, card, card-foreground, popover, popover-foreground
  - primary, primary-foreground, secondary, secondary-foreground
  - muted, muted-foreground, accent, accent-foreground, destructive
  - border, input, ring
  - chart-1, chart-2, chart-3, chart-4, chart-5
- 暗色变量源：[theme.css:L37-L61](../src/styles/theme.css#L37-L61)
  - 与亮色同名变量一一对应，数值为深色优化版本
- 侧边栏配色：
  - sidebar, sidebar-foreground, sidebar-primary, sidebar-primary-foreground
  - sidebar-accent, sidebar-accent-foreground, sidebar-border, sidebar-ring
- 变量声明位置见 [theme.css](../src/styles/theme.css#L1-L35)

### 亮色色值（:root）
- background: #fafbfc
- foreground: #2c3338
- card: #ffffff
- card-foreground: #2c3338
- popover: #ffffff
- popover-foreground: #2c3338
- primary: #2563eb
- primary-foreground: #ffffff
- secondary: #f3f4f6
- secondary-foreground: #374151
- muted: #f9fafb
- muted-foreground: #6b7280
- accent: oklch(0.96 0.012 240)
- accent-foreground: oklch(0.25 0.05 260)
- destructive: #dc2626
- border: #e5e7eb
- input: #ffffff
- ring: #3b82f6
- chart-1: #3b82f6
- chart-2: #10b981
- chart-3: #f59e0b
- chart-4: #8b5cf6
- chart-5: #ec4899

### 暗色色值（.dark）
- background: #0a0e14
- foreground: #e4e7eb
- card: #131820
- card-foreground: #e4e7eb
- popover: #131820
- popover-foreground: #e4e7eb
- primary: #4f87ff
- primary-foreground: #ffffff
- secondary: #1a1f2b
- secondary-foreground: #d1d5db
- muted: #1a1f2b
- muted-foreground: #9ca3af
- accent: oklch(0.25 0.04 250)
- accent-foreground: oklch(0.98 0.005 240)
- destructive: #f87171
- border: #2d3748
- input: #131820
- ring: #60a5fa
- chart-1: #60a5fa
- chart-2: #34d399
- chart-3: #fbbf24
- chart-4: #a78bfa
- chart-5: #f472b6

## CSS 变量总表
- 结构与主题变量
  - --radius（圆角基准）
  - 颜色相关：--background, --foreground, --card, --popover, --primary, --secondary, --muted, --accent, --destructive, --border, --input, --ring
  - 图表配色：--chart-1..--chart-5
- 侧边栏变量
  - --sidebar, --sidebar-foreground, --sidebar-primary, --sidebar-primary-foreground
  - --sidebar-accent, --sidebar-accent-foreground, --sidebar-border, --sidebar-ring
- 主题别名（便于语义化引用），见 [theme.css:L63-L102](../src/styles/theme.css#L63-L102)
  - 字体：--font-inter, --font-manrope
  - 圆角派生：--radius-sm, --radius-md, --radius-lg, --radius-xl
  - 颜色别名：--color-background..--color-sidebar-ring（映射到上述主变量）

## 字体
- 家族变量（在 CSS 中作为别名）：见 [theme.css:L64-L66](../src/styles/theme.css#L64-L66)
  - --font-inter: 'Inter', 'sans-serif'
  - --font-manrope: 'Manrope', 'sans-serif'
- 项目字体名单：见 [fonts.ts](../src/config/fonts.ts)
  - inter, manrope, system
- 特殊字号规则：移动端表单元素强制 `font-size: 16px`，见 [index.css:L32-L38](../src/styles/index.css#L32-L38)

## 圆角（Radii）
- 基准：`--radius: 0.625rem`，见 [theme.css:L2](../src/styles/theme.css#L2)
- 派生：`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`，见 [theme.css:L67-L71](../src/styles/theme.css#L67-L71)

## 间距/阴影/断点/z-index
- 间距（spacing）：未在项目中自定义，使用 Tailwind 默认刻度，见 [default-theme.js](../node_modules/tailwindcss/dist/default-theme.js)
- 阴影（shadows）：使用 Tailwind 默认刻度，见 [default-theme.js](../node_modules/tailwindcss/dist/default-theme.js)
- 断点（breakpoints）：除 `max-width: 767px` 的自定义媒体查询外，沿用 Tailwind 默认，参考 [index.css:L32-L38](../src/styles/index.css#L32-L38)
- z-index：未自定义，依赖 Tailwind 默认刻度

## 自定义 Utility
- 在 [index.css](../src/styles/index.css#L41-L58) 中定义：
  - `.container`、`.no-scrollbar`、`.faded-bottom`（使用 `var(--background)` 渐变）
- Tailwind 引入：`@import 'tailwindcss'` 与动画库 `@import 'tw-animate-css'`，见 [index.css](../src/styles/index.css#L1-L2)

## 使用建议
- 新增可定制项时，优先在 `theme.css` 声明 CSS 变量并提供亮/暗两套值；组件内部使用变量而非直接色值。
- 若需要扩展刻度（spacing、shadows、z-index、breakpoints），通过 Tailwind 配置进行扩展，保持与默认主题的语义一致。
- 统一通过别名变量（如 `--color-*`、`--radius-*`、`--font-*`）进行引用，降低重构成本。
