# My Exams & Dashboard Design

## Goal

- **Dashboard**: Display all available exams.
- **My Exams**: Display only exams owned by the user.
- **Exam Details**: Allow users to "Join" an exam, adding it to "My Exams".

## Data Model

We will leverage the existing `ProgressService` which uses LocalStorage (and can be synced). We will extend `ExamSettings` to include an `owned` boolean flag.

### `src/services/progress-service.ts`

```typescript
export interface ExamSettings {
  mistakesConsecutiveCorrect?: number
  owned?: boolean // New field
}
```

## Components & Logic

### 1. Shared Exam Data Hook (`src/hooks/use-exams.ts`)

We will centralize the logic for fetching demo exam counts and merging them with mock exams.

- **Input**: None
- **Output**:
  - `exams`: Array of all available exams (Mock + Demo).
  - `loading`: Boolean.

### 2. Dashboard (`src/features/dashboard/index.tsx`)

- **Display**: List all exams returned by `useExams()`.
- **Action**: Clicking an exam goes to Exam Details.

### 3. My Exams (`src/features/exams/index.tsx`)

- **Display**: Filter exams from `useExams()` where `ProgressService.getExamSettings(userId, examId).owned` is `true`.
- **Empty State**: If no exams are owned, prompt the user to go to Dashboard to explore exams.

### 4. Exam Details (`src/features/exams/exam-details.tsx`)

- **Check**: `ProgressService.getExamSettings(userId, examId).owned`.
- **UI**:
  - If `!owned`: Show "Join My Exams" button.
  - If `owned`: Show "Owned" indicator (optional) or just hide the button.
- **Action**:
  - On "Join": Call `ProgressService.saveExamSettings(userId, examId, { owned: true })`.
  - Trigger a re-render or state update to reflect the change.

## User Flow

1. User lands on **Dashboard**. Sees "SOA-C03 (Demo)" and other exams.
2. User clicks "SOA-C03".
3. User sees **Exam Details**. Clicks "Join My Exams".
4. User goes to **My Exams**. Sees "SOA-C03".
5. User goes back to **Dashboard**. Still sees "SOA-C03" (as it shows all exams).
