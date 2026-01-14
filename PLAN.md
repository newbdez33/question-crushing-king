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
    - **Exam Mode**: (Coming Soon) Timed simulation.

### 4.3 Practice Mode
- **Interface**:
  - **Question Area**: Displays Question Text (supports HTML/Images), Options (Radio/Checkbox), and Type Tag (Single/Multiple Choice).
  - **Footer Navigation**: "Previous" (Icon), "Next" (Icon), "Submit Answer" (Text).
  - **Responsive**:
    - **Desktop (≥ lg)**: 右侧 Sidebar，包含答题卡与设置面板（Auto next、Font size、Consecutive correct）
    - **Mobile (< lg)**: 隐藏右侧 Sidebar，显示底部 Tabbar（Bookmark、Correct、Wrong、Answer Card）。点击 Answer Card 打开底部弹层 Sheet，展示答题卡网格并支持跳题
- **Interaction**:
  - User selects answer(s) and clicks "Submit".
  - **Immediate Feedback**:
    - Correct/Incorrect status displayed.
    - Explanation/Reference text revealed.
    - Answer Sheet updates color.
    - Progress saved to Local Storage.

### 4.4 Study Mode
- **Purpose**: Review content without testing.
- **Behavior**:
  - Correct answer is automatically highlighted.
  - Explanation is visible by default.
  - Navigation allows browsing through all questions.

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

## 5. Data Specifications
- **Source**: JSON files located in `public/data/`.
- **Format**:
  - `id`: Unique identifier.
  - `content`: HTML string for the question.
  - `options`: Array of objects with `label` and `content`.
  - `correctAnswer`: Label(s) of the correct option.
  - `explanation`: HTML string for the answer explanation.
- **Images**: Stored in `public/data/images/` and referenced relatively in JSON.
