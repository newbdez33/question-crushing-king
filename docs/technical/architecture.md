# Project Structure & Template Notes

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 7
- **Package Manager:** pnpm 9.15.0
- **Styling:** Tailwind CSS 4, shadcn/ui (Radix UI primitives)
- **Routing:** TanStack Router (File-based routing)
- **State Management:** Zustand + React Context
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form, Zod
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Icons:** Lucide React, Radix Icons
- **Auth:** Firebase Auth
- **Persistence:** LocalStorage for guests; Firebase Realtime Database for authenticated users
- **Localization:** `LanguageProvider` with English, Simplified Chinese, Traditional Chinese, and Japanese

## Project Structure

- **`src/features`**: Feature-based architecture. Each feature folder (e.g., `auth`, `dashboard`, `exams`, `settings`) contains its own components, data, and logic.
- **`src/routes`**: File-based routing configuration used by TanStack Router.
- **`src/components`**: Shared components.
  - `ui`: Generic UI components (shadcn/ui).
  - `layout`: Layout components (Sidebar, Header).
- **`src/hooks`**: Custom React hooks.
- **`src/lib`**: Utility functions and configurations.
- **`src/stores`**: Legacy/global client-side stores; prefer feature-local state or context unless a cross-cutting store is needed.
- **`src/services`**: Local and remote data services, including progress, Firebase progress sync, and profile persistence.
- **`src/context/language-provider.tsx`**: UI translations, language persistence, and explanation fallback logic.
- **`public/data`**: Exam registry and question bank JSON files.
- **`public/data/images`** and **`public/images`**: Static question images, depending on JSON path style.

## Current App Features

- **Authentication**: Firebase email/password and Google sign-in, plus guest mode.
- **Dashboard**: User progress summary, recent activity, and registered exam discovery.
- **My Exams**: Joined exam list based on per-user settings.
- **Practice/Study/My Mistakes/Exam Mode**: Core exam learning flows.
- **Settings**: Profile, Account, Appearance.
- **Theming**: Dark/Light mode support.
- **Localization**: Language switcher, cookie-backed language preference, translated UI copy, and localized explanations when available in question data.

## Exams Feature

### Routes

- Exams list: `src/routes/_authenticated/exams/index.tsx` → `/exams`
- Exam details: `src/routes/_authenticated/exams/$examId/index.tsx` → `/exams/$examId`
- Practice mode: `src/routes/_authenticated/exams/$examId/practice.tsx` → `/exams/$examId/practice`
- Study mode: `src/routes/_authenticated/exams/$examId/study.tsx` → `/exams/$examId/study`
- Exam mode: `src/routes/_authenticated/exams/$examId/exam.tsx` → `/exams/$examId/exam`

Other route groups include auth (`/sign-in`, `/sign-up`, `/forgot-password`, `/otp`), settings (`/settings`, `/settings/account`, `/settings/appearance`), `/help-center`, and error pages.

### Data Loading Priority

- Dashboard/My Exams 读取 `public/data/index.json` 获得当前可见考试的列表与元信息（`id`, `title`, `description`, `questionCount`）
- Practice/Study/Exam Mode 进入具体考试时从 `/data/${examId}.json`（对应 `public/data/${examId}.json`）加载题库
- JSON 文件只有加入 `public/data/index.json` 后才会出现在应用题库列表
- 若 `{examId}.json` 不存在，则回退到内置 mock 数据（`src/features/exams/data/mock-exams.ts`，当前为空）
- 新增或替换题库时，需要保持 `index.json` 中的 `questionCount` 与实际 `questions.length` 一致

### HTML + Images Rendering

题干与选项允许为 HTML 字符串（例如包含 `<p>`, `<ul>`, `<strong>`, `<img>` 等）。前端会解析 HTML 并渲染为 React 节点，同时支持图片路径映射：

- `https://...`：保持原样
- `/...`：保持原样（视为站内绝对路径）
- `images/...`：映射为 `/data/images/...`（对应文件 `public/data/images/...`）
- `/images/...`：保持原样（对应文件 `public/images/...`）
- 其他相对路径：映射为 `/data/...`

### Localized Explanations

题库可以提供多语言解释字段：

- `explanation`: legacy/default explanation. The app infers Chinese vs English based on content.
- `explanation_en`, `explanation_zh`, `explanation_ja`: explicit language-specific fields.
- `explanations`: object format with `en`, `zh`, and `ja` keys.

`zh-TC` currently falls back to `zh` explanations, then English, then any available explanation.

### Question Types & Interaction

应用支持两种基本题型，根据 JSON 中的 `type` 字段区分：

- **Single Choice** (`type: "single"`):
  - 使用 `RadioGroup` 组件渲染选项
  - 用户选中即更新状态
- **Multiple Choice** (`type: "multiple"`):
  - 使用 `Checkbox` 组件渲染选项
  - **校验逻辑**：用户必须选中与正确答案数量一致的选项（例如正确答案 "ABC" 长度为3，则必须选3项）才能激活提交按钮
  - 这种校验逻辑复用于 Practice Mode 与 Exam Mode 的提交逻辑中

相关实现位置：

- Practice mode: [src/features/exams/practice-mode.tsx](src/features/exams/practice-mode.tsx)
- Study mode: [src/features/exams/study-mode.tsx](src/features/exams/study-mode.tsx)
- Exam mode: [src/features/exams/exam-mode.tsx](src/features/exams/exam-mode.tsx)

