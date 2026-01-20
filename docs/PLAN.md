# Exam Topics - Functional Specifications

## 1. Overview

Exam Topics is a web-based application designed to help users practice for certification exams using local JSON question banks. It provides a robust practice environment with features like immediate feedback, progress tracking, and specialized study modes.

## 2. User Roles

- **Guest**: Can access all features without registration. Progress is saved locally using a persistent Guest ID.
- **Registered User**: (Planned) Can sync progress across devices. Currently functions similarly to Guest with authentication UI placeholders.

## 3. Layout & Navigation

### 3.1 Sidebar Navigation

- **Dashboard**: The landing page displaying user statistics.
- **My Exams**: A list of available question banks.

### 3.2 Responsive Design

- **Desktop**: Full sidebar and multi-column layouts.
- **Mobile**: Collapsible sidebar, stacked layouts, optimized touch targets.

## 4. Functional Modules

### 4.1 Dashboard

- **User Statistics**:
  - **Total Questions Answered**: Cumulative count of answered questions.
  - **Correct Answers**: Cumulative count of correct answers.
  - **Overall Accuracy**: Percentage of correct answers vs. total answered.
  - **Exams Started**: Number of unique exams interacted with.
- **Recent Activity**: A list of recently accessed exams with progress bars and "Last Active" timestamps.

### 4.2 Exam Management (My Exams)

- **Exam List**: Displays cards for each available exam (e.g., AWS, SOA).
- **Exam Details**:
  - **Stats**: Total Questions, Last Studied Date, Progress Bar.
  - **Entry Points**:
    - **Practice Mode**: Standard practice session.
    - **Study Mode**: View questions with answers revealed.
    - **My Mistakes**: Practice session filtered to show only incorrect/missed questions.
    - **Exam Mode**: Simulated exam with random question selection. No timer (planned for future).

### 4.3 Practice Mode

- **Interface**:
  - **Question Area**: Displays Question Text (supports HTML/Images), Options (Radio/Checkbox), and Type Tag (Single/Multiple Choice).
  - **Footer Navigation**: "Previous" (Icon), "Next" (Icon), "Submit Answer" (Text).
  - **Responsive**:
    - **Desktop (≥ lg)**: 右侧 Sidebar，包含答题卡与设置面板（Auto next、Font size、Consecutive correct）
    - **Mobile (< lg)**: 隐藏右侧 Sidebar，显示底部 Tabbar（Bookmark、Correct、Wrong、Answer Card）。点击 Answer Card 打开底部弹层 Sheet，展示答题卡网格、Font size 设置，并支持跳题。Sheet 支持下滑关闭
- **Interaction**:
  - User selects answer(s) and clicks "Submit".
  - **Immediate Feedback**:
    - Correct/Incorrect status displayed.
    - Explanation/Reference text revealed.
    - Answer Sheet updates color.
    - Progress saved to Local Storage.

### 4.4 Study Mode

- **Purpose**: Review content without testing.
- **Layout**: 与 Practice Mode 对齐
  - **Header**: 固定头部，返回详情页按钮与考试标题
  - **Main Card**:
    - CardHeader 左侧以 Badge 显示题号与题型
    - 题干支持 HTML/图片；右侧 Bookmark
    - 选项中自动高亮正确答案
    - Explanation 默认展开
  - **Footer**: Previous/Next 图标按钮
  - **Responsive**:
    - **Desktop (≥ lg)**: 右侧 Sidebar 提供 Answer Sheet（题号跳转）与 Settings（Font size）
    - **Mobile (< lg)**: 底部栏包含 Answer Card 入口，点击打开 Sheet 显示答题卡网格与 Font size 设置。Sheet 支持下滑关闭
- **Behavior**:
  - 自动展示正确答案与解释
  - 支持通过答题卡跳题
  - Settings：Font size（small/normal/large）

### 4.5 My Mistakes Mode

- **Entry**: Accessible via "My Mistakes" card on Exam Details.
- **Logic**:
  - Filters the question list to include only questions marked as "incorrect" or "timesWrong > 0".
  - Uses the per-exam **Consecutive correct** threshold to determine when a question graduates out of the mistakes pool:
    - Each correct attempt increases `consecutiveCorrect` for that question.
    - Any incorrect attempt resets `consecutiveCorrect` to `0` and increments `timesWrong`.
    - Once `consecutiveCorrect` reaches the configured threshold, the question is considered mastered and is removed from My Mistakes on the next session/load.
      - In My Mistakes mode the answer sheet reflects only the current session’s answers (initially all unanswered; tiles change to green/red after answering), while the underlying global status is still used for filtering across sessions.

### 4.6 Progress Tracking

- **Persistence**: All data is stored in browser `localStorage`.
- **Data Points**:
  - Status (correct/incorrect).
  - User Selection (indices).
  - Last Answered Timestamp.
  - Bookmarked State.
  - Consecutive Correct Count.
  - Times Wrong Count.
- **Bookmark System**: Users can toggle bookmarks on any question for later review.

### 4.7 Exam Mode

- **Purpose**: Simulated exam with random question selection by count.
- **Route**: `/exams/$examId/exam`
- **Features**:
  - Random question selection with optional reproducible seed
  - Session-based statistics (total, answered, correct, wrong, accuracy)
  - Real-time result page with review entry
  - No timer (planned for future iterations)
- **Docs**: See [EXAM_MODE_PLAN.md](./EXAM_MODE_PLAN.md) for user-facing design and [EXAM_MODE_TECH.md](./EXAM_MODE_TECH.md) for technical details.

## 5. Data Specifications

- **Sources**:
  - `public/data/index.json`: Exam registry containing `{ id, title, description }` entries.
  - `public/data/{examId}.json`: Question bank for each exam; contains only `questions` array.
- **Question Format** (`questions[]`):
  - `id`: Unique identifier.
  - `questionNumber`: number.
  - `type`: `"single"` | `"multiple"`.
  - `content`: HTML string for the question.
  - `options`: Array of objects `{ label: string; content: string }`.
  - `correctAnswer`: Label(s) of the correct option, e.g. `"A"` or `"BD"`.
  - `explanation?`: Optional HTML explanation.
- **Images**: Stored in `public/data/images/` and referenced relatively (e.g. `images/...`) in JSON.

