# User Data Documentation

This document describes the structure of user data stored locally in the application. The application currently uses `localStorage` for data persistence.

## Storage Keys

| Key | Description |
| --- | --- |
| `examtopics_guest_id` | Stores a persistent unique identifier (UUID) for guest users. |
| `examtopics_progress` | Stores the main application state, including user progress, answers, and bookmarks for all exams. |

## Data Structure

### 1. Guest Identity (`examtopics_guest_id`)

- **Type**: `string` (UUID)
- **Example**: `"550e8400-e29b-41d4-a716-446655440000"`
- **Purpose**: To track progress for users who are not logged in.

### 2. Progress Data (`examtopics_progress`)

This item stores a JSON object containing progress for all users (both guest and authenticated).

#### Schema Hierarchy

```typescript
interface AppProgress {
  [userId: string]: UserProgress
}

interface UserProgress {
  [examId: string]: ExamProgress
}

interface ExamProgress {
  [questionId: string]: QuestionProgress
}

interface QuestionProgress {
  status?: 'correct' | 'incorrect' | 'skipped'
  bookmarked?: boolean
  lastAnswered?: number        // Timestamp (ms)
  consecutiveCorrect?: number  // Count of consecutive correct answers (for spaced repetition/mistakes logic)
  userSelection?: number[]     // Array of selected option indices (e.g., [0, 2])
  timesWrong?: number          // Cumulative count of incorrect attempts
}
```

#### JSON Example

```json
{
  "550e8400-e29b-41d4-a716-446655440000": {
    "SOA-C03": {
      "q1": {
        "status": "correct",
        "lastAnswered": 1715421234567,
        "consecutiveCorrect": 1,
        "userSelection": [2],
        "bookmarked": false
      },
      "q2": {
        "status": "incorrect",
        "lastAnswered": 1715421299999,
        "consecutiveCorrect": 0,
        "timesWrong": 3,
        "userSelection": [0],
        "bookmarked": true
      }
    },
    "SAA-C03": {
      "q10": {
        "bookmarked": true
      }
    }
  }
}
```

## Logic & Behavior

### Guest vs. Authenticated User
- **Guest User**:
  - Automatically assigned a persistent random UUID (v4) upon first visit.
  - ID is stored in `localStorage` key `examtopics_guest_id`.
  - All progress (answers, bookmarks, stats) is saved locally under this Guest UUID.
  - Allows immediate usage without sign-up.

- **Authenticated User**:
  - Identified by their unique Firebase User UID.
  - Progress is saved locally under this Firebase UID.
  - Enables persistent identity (though currently data is still local-only).

### Guest Data Merge Process (On Login)
When a guest user logs in or signs up:
1. **Trigger**: The application detects an authentication state change (via `onAuthStateChanged`).
2. **Action**: The system invokes `ProgressService.mergeProgress(guestId, userId)`.
3. **Merge Strategy**:
   - The system iterates through all exam progress stored under the `guestId`.
   - **Data Preservation**: 
     - If the User account (Target) already has data for a specific question, the **User's existing data is preserved** (Target overwrites Source).
     - If the User account has no data for a question, the **Guest's data is copied over**.
   - **Bookmarks**: Special logic applies. A question is marked as bookmarked if it was bookmarked in **either** the Guest session OR the User account (Logical OR).
   - **Result**: The User account ends up with a superset of their previous data plus any new non-conflicting progress from the guest session.

- **Progress Tracking**:
  - `status`: Updated immediately upon submitting an answer.
  - `consecutiveCorrect`: 
    - Increments when `status` becomes `'correct'`.
    - Resets to `0` when `status` becomes `'incorrect'`.
  - `timesWrong`: Increments when `status` becomes `'incorrect'`.
  - `userSelection`: Persists the user's last selected options to restore state when revisiting a question.

- **Clearing Progress**:
  - When "Clear Progress" is triggered for an exam, answer-related fields (`status`, `lastAnswered`, `consecutiveCorrect`, `userSelection`) are removed, but `bookmarked` status is preserved.
