# Exam Topics Practice App

基于 Shadcn Admin Dashboard 改造的题库练习应用，用于加载本地 JSON 题库并提供练习模式和学习模式。

## 功能特性

- 题库管理：从 `/public/data` 加载 JSON 题库
- 练习模式：逐题作答、即时判分与上一题/下一题跳转
- 学习模式：展示正确答案与解析，支持上一题/下一题浏览
- 题干与选项支持 HTML 内容（含图片）
- 图片静态资源映射到 `public/data/images`
- 保留原模板的深色模式、响应式布局和侧边栏等能力

## Auth & Persistence (Firebase + LocalStorage)

### Authentication
- **Firebase Auth**: Used for Sign Up, Sign In, Logout, and Forgot Password.
- **Guest Mode**: Users can access content without logging in. A persistent UUID is generated and stored in `localStorage` for guests.
- **Data Merging**: When a guest signs up or logs in, their local progress is merged into their account (future: synced to Firebase Realtime DB).

### Local Storage Structure
The application uses `localStorage` to persist user progress and settings. The key structure is designed to be compatible with Firebase Realtime Database paths.

Key: `examtopics_progress`
Value (JSON Object):
```json
{
  "userId_or_guestId": {
    "examId": {
      "questionId": {
        "status": "correct" | "incorrect" | "skipped",
        "bookmarked": boolean,
        "lastAnswered": timestamp
      }
    }
  }
}
```

## 技术栈

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)  
**构建工具:** [Vite](https://vitejs.dev/)  
**路由:** [TanStack Router](https://tanstack.com/router/latest)  
**类型系统:** [TypeScript](https://www.typescriptlang.org/)  
**表单/状态等:** 参考根目录 [TEMPLATE.md](./TEMPLATE.md)

## 本地运行

Clone the project

```bash
  git clone <your-repo-url>
```

Go to the project directory

```bash
  cd examtopics
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## 题库 JSON 与 DEMO 数据

应用会尝试从 `public/data/{examId}.json` 加载 DEMO 题库：

- 在「My Question Banks」列表中，`examId` 会作为路由参数出现在 `/exams/$examId`
- 进入某个题库详情页后，可点击：
  - Practice Mode：`/exams/$examId/practice`
  - Study Mode：`/exams/$examId/study`
- 以上两个页面会优先尝试从 `/public/data/{examId}.json` 读取 DEMO 数据；
  - 如果不存在对应 JSON，则回退使用内置 mock 题库（`src/features/exams/data/mock-exams.ts`）

### JSON 结构（以 `SOA-C03.json` 为例）

- 文件路径：`public/data/SOA-C03.json`
- 顶层字段：
  - `questions`: DemoQuestion[]
- DemoQuestion 结构：
  - `id`: string
  - `questionNumber`: number
  - `type`: string
  - `content`: string（题干，支持 HTML）
  - `options`: { `label`: string; `content`: string }[]
  - `correctAnswer`: string（与 `label` 对应）
  - `explanation?`: string（解析，支持 HTML）

### 图片引用约定

题干或选项中的 HTML 可以包含图片，例如：

```html
<p>Refer to the following diagram:</p>
<img src="images/SOA-C03/q1_p1_1.png" alt="architecture diagram" />
```

约定如下：

- 所有图片文件放在：`public/data/images/...`
- JSON 中 `src` 可以写成：
  - `images/...`（推荐）
  - 绝对 URL（`https://...`）
  - 以 `/` 开头的静态路径
- 前端会将 `images/...` 自动映射为 `/data/images/...`，以便通过 Vite 静态资源服务访问。

相关实现可参考：

- 练习模式组件：[practice-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx)
- 学习模式组件：[study-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/study-mode.tsx)

## 练习模式说明

路由：`/exams/$examId/practice`

- **布局**：
  - 顶部：题目编号、类型（Single/Multiple Choice）
  - 中间：题干（HTML/图片）、选项列表
  - 底部：导航栏（Previous/Next 图标按钮）、Submit Answer 按钮
  - 侧边栏（Desktop）/ 抽屉（Mobile）：答题卡（Color-coded）、设置面板
- **设置面板**：
  - **Auto next**: 答对自动跳转
  - **Eye protection**: 护眼模式
  - **Font size**: 字体大小调节
  - **Consecutive correct**: 错题移除阈值（针对 My Mistakes 模式）
- **交互**：
  - 提交后立即判分
  - 显示解析
  - 自动记录进度

## 学习模式说明

路由：`/exams/$examId/study`

- **布局**：简化版练习界面
- **特性**：
  - 自动显示正确答案
  - 自动展开解析
  - 仅保留导航功能

## My Mistakes 模式

路由：`/exams/$examId/practice?mode=mistakes`

- **入口**：Exam Details 页面的 "My Mistakes" 卡片
- **逻辑**：仅加载历史错题或未掌握的题目（基于 `timesWrong` 和 `consecutiveCorrect` 过滤）

更多关于整体技术栈和目录结构的说明，见 [TEMPLATE.md](./TEMPLATE.md)。
