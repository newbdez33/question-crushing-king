# Exam Topics Practice App

Question bank practice application based on Shadcn Admin Dashboard, designed to load local JSON question banks and provide practice and study modes.

## Features

- **Question Bank Management**: Load JSON question banks from `/public/data`
- **Practice Mode**: Answer questions one by one, instant grading, and navigation (previous/next)
- **Study Mode**: Show correct answers and explanations, support previous/next navigation, desktop Answer Sheet with Settings (Font size), mobile Answer Card sheet
- **Rich Content**: Question stem and options support HTML content (including images)
- **Image Mapping**: Image static resources mapped to `public/data/images`
- **UI/UX**: Retains dark mode, responsive layout, and sidebar capabilities from the original template
- **Exam Mode**: Simulated exam by randomly selecting a specified number of questions. See functional and technical docs: [EXAM_MODE_PLAN.md](./EXAM_MODE_PLAN.md), [EXAM_MODE_TECH.md](./EXAM_MODE_TECH.md)
- **My Exams**: Personalized list of joined exams. Users can browse all available exams in the Dashboard and "Join" them from the details page.

## Auth & Persistence (Firebase + LocalStorage + Realtime DB)

### Authentication
- **Firebase Auth**:
  - Email + password Sign Up / Sign In flows.
  - Google Sign-In available on both Sign In and Sign Up screens.
- **Guest Mode**: Users can access content without logging in. A persistent UUID is generated and stored in `localStorage` for guests.
- **Data Merging & Sync**: When a guest signs up or logs in, their local progress is merged into their account and then pushed to Firebase Realtime Database for cross-device sync.

### Local Storage Structure
The application uses `localStorage` to persist user progress and settings. The key structure is designed to be compatible with Firebase Realtime Database paths.

Key: `examtopics_progress`
Value (JSON Object):
```
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

### Realtime Sync (Authenticated Users)
- **Path**: `examtopics_progress/{uid}/{examId}/{questionId}`
- **Fields**:
  - `status`: `"correct" | "incorrect" | "skipped"`
  - `lastAnswered`: number (ms)
  - `userSelection`: number[]
  - `consecutiveCorrect`: number
  - `timesWrong`: number
  - `bookmarked`: boolean
- **Write Points**:
  - Practice Mode submit: writes status, selections, timestamps, counts.
  - Bookmark toggle: writes `bookmarked`.
  - Clear Progress: clears answer-related fields, preserves `bookmarked`.
- **Subscriptions**:
  - Practice/Study Mode subscribe to `examtopics_progress/{uid}/{examId}` to reflect remote changes live.
- **Merge Strategy on Login**:
  - Merge local Guest → local User:
    - If User has data for a question, keep User’s existing data.
    - If User lacks data, copy Guest’s data.
    - `bookmarked` uses logical OR.
  - After merge, push the User’s local progress to Firebase for cross-device availability.

### Firebase Setup
- **Environment Variables**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`
  - `VITE_FIREBASE_DATABASE_URL` (Realtime DB)
- **Analytics in Development**:
  - To avoid certificate issues when loading Google Tag Manager (`gtag.js`) locally, Firebase Analytics is disabled in development.
  - Production-only initialization conditions: `import.meta.env.PROD` + browser environment + non-empty `measurementId`.
  - Implementation: [firebase.ts](file:///c:/Users/newbd/projects/dev/examtopics/src/lib/firebase.ts#L17-L22)
- **ENV Guidance**:
  - Development: No need to set `VITE_FIREBASE_MEASUREMENT_ID` (even if set, Analytics won’t initialize).
  - Production: Set `VITE_FIREBASE_MEASUREMENT_ID` to enable Analytics; leave empty to disable.
- **Troubleshooting (Local)**:
  - Error: `net::ERR_CERT_AUTHORITY_INVALID` from `https://www.googletagmanager.com/gtag/js?...`
  - Causes: corporate proxy MITM/self-signed certs, incorrect system time, security software/network filtering.
  - Fixes: use dev-time Analytics disable (already implemented), import corporate root CA into trust store, correct system clock, verify filters aren’t blocking `*.google*`.
- **Database Rules** (example):
```json
{
  "rules": {
    "examtopics_progress": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### Sync Hooks

- Auth context listens to Firebase Auth and merges local guest progress into the user account on login, then syncs to Realtime DB.
- Practice/Study modes subscribe to `examtopics_progress/{uid}/{examId}` and update local state when remote progress changes.
- Progress service exposes helpers to read/write progress in a way that is compatible with both localStorage and Firebase.

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)  
**Build Tool:** [Vite](https://vitejs.dev/)  
**Routing:** [TanStack Router](https://tanstack.com/router/latest)  
**Type System:** [TypeScript](https://www.typescriptlang.org/)  
**Forms/State/Etc:** See root directory [TEMPLATE.md](./TEMPLATE.md)

## Local Development

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

Type-check

```bash
  pnpm typecheck
```

Start the server (pre-check runs automatically)

```bash
  pnpm dev
```

## Question Bank JSON & DEMO Data

The application attempts to load DEMO question banks from `public/data/{examId}.json`:

- In the "My Question Banks" list, `examId` appears as a route parameter at `/exams/$examId`
- After entering an exam details page, you can click:
  - Practice Mode: `/exams/$examId/practice`
  - Study Mode: `/exams/$examId/study`
- Both pages prioritize reading DEMO data from `/public/data/{examId}.json`;
  - If the corresponding JSON does not exist, it falls back to the built-in mock question bank (`src/features/exams/data/mock-exams.ts`)

### JSON Structure (using `SOA-C03.json` as an example)

- File Path: `public/data/SOA-C03.json`
- Top-level Fields:
  - `questions`: DemoQuestion[]
- DemoQuestion Structure:
  - `id`: string
  - `questionNumber`: number
  - `type`: string
  - `content`: string (Question stem, supports HTML)
  - `options`: { `label`: string; `content`: string }[]
  - `correctAnswer`: string (Corresponds to `label`)
  - `explanation?`: string (Explanation, supports HTML)

### Image Reference Convention

HTML in question stems or options can include images, for example:

```html
<p>Refer to the following diagram:</p>
<img src="images/SOA-C03/q1_p1_1.png" alt="architecture diagram" />
```

Conventions:

- All image files are placed in: `public/data/images/...`
- In JSON, `src` can be written as:
  - `images/...` (Recommended)
  - Absolute URL (`https://...`)
  - Static path starting with `/`
- The frontend automatically maps `images/...` to `/data/images/...` for access via Vite static asset service.

Relevant implementations can be found in:

- Practice Mode Component: [practice-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx)
- Study Mode Component: [study-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/study-mode.tsx)

## Practice Mode Guide

Route: `/exams/$examId/practice`

- **Layout**:
  - **Top**: Question number, type (Single/Multiple Choice)
  - **Middle**: Question stem (HTML/Image), options list
  - **Bottom**: Navigation bar (Previous/Next icon buttons), Submit Answer button（含图标）
  - **Responsive**:
    - **Desktop (≥ lg)**: 右侧 Sidebar 显示答题卡与设置面板
    - **Mobile (< lg)**: 隐藏右侧 Sidebar，显示底部 Tabbar（Bookmark、Correct 数、Wrong 数、Answer Card）。Tabbar 等宽居中分布；点击 Answer Card 打开底部弹层 Sheet 显示答题卡网格，可跳题
- **Settings Panel**:
  - **Auto next**: Auto-jump on correct answer
  - **Font size**: Font size adjustment
  - **Consecutive correct**: Wrong answer removal threshold (for My Mistakes mode)
- **Interaction**:
  - Instant grading after submission
  - Show explanation
  - Auto-record progress
  - **Auto-Navigation**:
    - When entering Practice Mode (without `?q=` param), it automatically jumps to the **highest question number** you have previously answered.
    - If `?q=` param is present (e.g. refresh page), it stays on the specified question.

## Study Mode Guide

Route: `/exams/$examId/study`

- **Layout**: 与 Practice 一致的页面骨架
  - **Header**: 固定头部，返回详情页按钮与标题
  - **Main Card**:
    - 顶部以 Badge 显示题号与题型（Single/Multiple）
    - 题干支持 HTML/图片；右上角 Bookmark（绝对定位于卡片右上角，与题号顶部对齐）
    - 选项列表中自动高亮正确选项
    - Explanation 区块默认展开
  - **Footer**: Previous/Next 图标按钮
  - **Responsive**:
    - **Desktop (≥ lg)**: 右侧 Sidebar 显示答题卡（题号网格）与 Settings（Font size）
    - **Mobile (< lg)**: 显示底部栏；点击 Answer Card 打开底部 Sheet 答题卡网格，可跳题
- **Features**:
  - 自动展示正确答案与解释
  - 导航与跳题（答题卡）
  - Settings：Font size（small/normal/large）

## My Mistakes Mode

Route: `/exams/$examId/practice?mode=mistakes`

- **Entry Point**: "My Mistakes" card on Exam Details page
- **Header Title**: When in My Mistakes mode, the Practice page header displays “My Mistakes”
- **Logic**:
  - Only loads historical wrong answers or unmastered questions (filtered based on `timesWrong` and `consecutiveCorrect`).
  - Uses the **Consecutive correct** setting as the graduation threshold:
    - Each correct attempt in My Mistakes mode increases `consecutiveCorrect` for that question.
    - Any incorrect attempt resets `consecutiveCorrect` to `0` and increments `timesWrong`.
    - When `consecutiveCorrect` for a question reaches the configured threshold，该题被视为已掌握：
      - 该题会被移出 My Mistakes 池，并在本地和云端进度中记录为“已毕业”（状态标记为 `correct`，错误计数清零）。
      - 之后即使调整 **Consecutive correct** 数值，这道已经毕业的题也不会因为阈值变化重新出现在 My Mistakes 中，除非用户在之后又把它答错。
  - In My Mistakes mode, the answer sheet shows per-session answer status:
  - Initially, all questions appear as "unanswered".
  - After answering in this session, tiles turn green/red based on the current attempt result, independent of the global stored status.
  - The **Consecutive correct** value is persisted per user+exam in `localStorage` and, for authenticated users, also synced to Firebase for cross-device consistency.

For more details on the overall tech stack and directory structure, see [TEMPLATE.md](./TEMPLATE.md).

## Recent UI Updates

- **Mobile Tabbar**
  - 等宽居中分布的四项：Bookmark、Correct 数、Wrong 数、Answer Card
  - 移除“Correct/Wrong”文案，仅保留图标与数字，提升空间利用与辨识度
  - 实时测量底栏高度并写入 `--mobile-bar-height`，主内容通过 `pb-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom))]` 与底部占位块组合，彻底避免遮挡
- **Study/Practice 内容区**
  - 题干与选项在小屏使用更紧凑的内外边距，提升信息密度
  - Bookmark 图标绝对定位到卡片右上角，并与题号行顶边对齐
  - Practice 模式的 Submit Answer 按钮加入图标
  - Practice 模式卡片底部背景改为透明
- **安全区适配**
  - 小屏在 iOS 安全区使用 `env(safe-area-inset-bottom)` 自动适配

## Deployment Notes (Cloudflare Workers)

- Cloudflare build runs: `tsc -b && vite build`, enforcing strict TypeScript checks.
- Recommended local flow:
  - `pnpm typecheck` to ensure no TS errors
  - `pnpm build` to validate production build
- Routing
  - Use union paths with params for TanStack Router:
    - `to="/exams/$examId/practice"` with `params={{ examId }}`
    - Avoid template strings like ``/exams/${id}/practice`` which are not part of the generated unions.
- Types
  - Keep UI types in sync with data (e.g., SidebarData requires `teams: Team[]`).
  - Avoid implicit `any[]`; annotate arrays like fireworks `Particle[][]`.
  - For `navigate({ search })`, let the updater infer or match the route’s validated search keys.
