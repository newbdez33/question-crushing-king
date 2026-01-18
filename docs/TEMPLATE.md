# Project Template Analysis

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4, shadcn/ui (Radix UI primitives)
- **Routing:** TanStack Router (File-based routing)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form, Zod
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Icons:** Lucide React, Radix Icons
- **Auth:** Clerk / Custom Auth

## Project Structure

- **`src/features`**: Feature-based architecture. Each feature folder (e.g., `auth`, `dashboard`, `tasks`) contains its own components, data, and logic.
- **`src/routes`**: File-based routing configuration used by TanStack Router.
- **`src/components`**: Shared components.
  - `ui`: Generic UI components (shadcn/ui).
  - `layout`: Layout components (Sidebar, Header).
- **`src/stores`**: Global state management (Zustand).
- **`src/hooks`**: Custom React hooks.
- **`src/lib`**: Utility functions and configurations.

## Key Features in Template

- **Authentication**: Pre-built Login/Signup forms (Custom & Clerk).
- **Dashboard**: Analytics charts and overview cards.
- **Data Tables**: Advanced tables with filtering, sorting, pagination (Tasks, Users).
- **Settings**: Profile, Appearance, Notifications forms.
- **Theming**: Dark/Light mode support.

## Exams Feature

### Routes

- Exams list: `src/routes/_authenticated/exams/index.tsx` → `/exams`
- Exam details: `src/routes/_authenticated/exams/$examId/index.tsx` → `/exams/$examId`
- Practice mode: `src/routes/_authenticated/exams/$examId/practice.tsx` → `/exams/$examId/practice`
- Study mode: `src/routes/_authenticated/exams/$examId/study.tsx` → `/exams/$examId/study`

### Data Loading Priority

- 读取 `public/data/index.json` 获得当前可用考试的列表与元信息（`id`, `title`, `description`）
- 对每个考试从 `/data/${examId}.json`（对应 `public/data/${examId}.json`）加载题库，并基于 `questions.length` 计算题量
- 若 `{examId}.json` 不存在，则回退到内置 mock 数据（`src/features/exams/data/mock-exams.ts`）

### HTML + Images Rendering

题干与选项允许为 HTML 字符串（例如包含 `<p>`, `<ul>`, `<strong>`, `<img>` 等）。前端会解析 HTML 并渲染为 React 节点，同时支持图片路径映射：

- `https://...`：保持原样
- `/...`：保持原样（视为站内绝对路径）
- `images/...`：映射为 `/data/images/...`（对应文件 `public/data/images/...`）
- 其他相对路径：映射为 `/data/...`

### Question Types & Interaction

应用支持两种基本题型，根据 JSON 中的 `type` 字段区分：

- **Single Choice** (`type: "single"`):
  - 使用 `RadioGroup` 组件渲染选项
  - 用户选中即更新状态
- **Multiple Choice** (`type: "multiple"`):
  - 使用 `Checkbox` 组件渲染选项
  - **校验逻辑**：用户必须选中与正确答案数量一致的选项（例如正确答案 "ABC" 长度为3，则必须选3项）才能激活提交按钮
  - 这种校验逻辑复用于 Practice Mode 的提交与 Study Mode 的展示逻辑中

相关实现位置：

- Practice mode: [practice-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx)
- Study mode: [study-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/study-mode.tsx)

