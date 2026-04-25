# User Data Documentation

This document describes the structure of user data stored locally in the application, and its mapping to Firebase Realtime Database for authenticated users.

## Storage Keys

| Key | Description |
| --- | --- |
| `examtopics_guest_id` | Stores a persistent unique identifier (UUID) for guest users. |
| `examtopics_progress` | Stores answer progress and bookmarks for all users. |
| `examtopics_settings` | Stores per-exam settings such as joined exams and My Mistakes thresholds. |

## Data Structure

### 1. Guest Identity (`examtopics_guest_id`)

- **Type**: `string` (UUID)
- **Example**: `"550e8400-e29b-41d4-a716-446655440000"`
- **Purpose**: To track progress for users who are not logged in.

### 2. Progress Data (`examtopics_progress`)

This item stores a JSON object containing progress for all users (both guest and authenticated). For authenticated users, the same structure is mirrored in Firebase Realtime Database for cross-device sync.

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

### 3. Settings Data (`examtopics_settings`)

This item stores a JSON object containing per-user settings. For authenticated users, the same settings are mirrored in Firebase under `examtopics_progress/{uid}/_settings`.

```typescript
interface AppSettings {
  [userId: string]: UserSettings
}

interface UserSettings {
  [examId: string]: ExamSettings
}

interface ExamSettings {
  owned?: boolean                         // Whether the exam appears in My Exams
  mistakesConsecutiveCorrect?: number     // Graduation threshold for My Mistakes
}
```

#### Settings JSON Example

```json
{
  "550e8400-e29b-41d4-a716-446655440000": {
    "SOA-C03": {
      "owned": true,
      "mistakesConsecutiveCorrect": 3
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
  - Progress is saved locally under this Firebase UID and also synced to Firebase Realtime Database under `examtopics_progress/{uid}`.
  - Screens subscribe to `examtopics_progress/{uid}/{examId}` and reflect remote changes in real-time.
  - Joined exams and per-exam settings are stored under `examtopics_settings` locally and `examtopics_progress/{uid}/_settings` remotely.

### Guest Data Merge Process (On Login)

When a guest user logs in or signs up:

1. **Trigger**: The application detects an authentication state change (via `onAuthStateChanged`).
2. **Action**: The system invokes `ProgressService.mergeProgress(guestId, userId)` to merge Guest data into the User’s local progress, then pushes the merged result to Firebase.
3. **Merge Strategy (Local)**:
   - The system iterates through all exam progress stored under the `guestId`.
   - **Data Preservation**:
     - If the User account (Target) already has data for a specific question, the **User's existing data is preserved** (Target overwrites Source).
     - If the User account has no data for a question, the **Guest's data is copied over**.
   - **Bookmarks**: Special logic applies. A question is marked as bookmarked if it was bookmarked in **either** the Guest session OR the User account (Logical OR).
   - **Result**: The User account ends up with a superset of their previous data plus any new non-conflicting progress from the guest session.
4. **Sync to Firebase**:
   - After merge, the system writes the merged local User data to `examtopics_progress/{uid}` in Firebase so it’s available across devices.

### Guest Settings Merge Process (On Login)

When a guest user logs in or signs up:

1. The app invokes `ProgressService.mergeSettings(guestId, userId)`.
2. The merged settings are pushed to Firebase with `mergeLocalSettingsIntoRemote(uid, localSettings)`.
3. Remote settings are read back with `getUserSettings(uid)` and saved locally with `ProgressService.saveUserSettings(uid, remote)`.
4. `owned` determines whether an exam appears in My Exams. If either guest or user settings mark an exam as owned, the merged settings keep it owned.

- **Progress Tracking**:
  - `status`: Updated immediately upon submitting an answer.
  - `consecutiveCorrect`:
    - Increments when `status` becomes `'correct'`.
    - Resets to `0` when `status` becomes `'incorrect'`.
  - `timesWrong`: Increments when `status` becomes `'incorrect'`.
  - `userSelection`: Persists the user's last selected options to restore state when revisiting a question.

- **Clearing Progress**:
  - When "Clear Progress" is triggered for an exam, answer-related fields (`status`, `lastAnswered`, `consecutiveCorrect`, `userSelection`) are removed, but `bookmarked` status is preserved.
  - For authenticated users, the same clear operation is applied in Firebase under `examtopics_progress/{uid}/{examId}`.

- **Joined Exams**:
  - Clicking "Join My Exams" writes `{ owned: true }` for that exam.
  - Guest users write local settings only.
  - Authenticated users write both local settings and Firebase settings.

- **Profile Data**:
  - Firebase Auth stores base fields such as `displayName`, `email`, and `photoURL`.
  - Custom profile fields are stored in Realtime Database under `users/{uid}/profile`.
  - Current custom fields are `username`, `bio`, and `urls`.

## Firebase Realtime Database

### Base Paths

- Progress: `examtopics_progress/{uid}/{examId}/{questionId}`
- Settings: `examtopics_progress/{uid}/_settings/{examId}`
- Custom Profile: `users/{uid}/profile`

### Fields

- `status`: `"correct" | "incorrect" | "skipped"`
- `lastAnswered`: number (timestamp ms)
- `userSelection`: number[]
- `consecutiveCorrect`: number
- `timesWrong`: number
- `bookmarked`: boolean

### Settings Fields

- `owned`: boolean
- `mistakesConsecutiveCorrect`: number

### Profile Fields

- `username`: string
- `bio`: string
- `urls`: `{ value: string }[]`

### Subscriptions

- Practice/Study/Exam UI subscribes to `examtopics_progress/{uid}/{examId}` via Firebase listeners and updates local UI state when remote data changes.
- My Exams loads `examtopics_progress/{uid}/_settings` to filter owned exams for authenticated users.

### Rules (Example)

- Only the authenticated user can read/write their subtree:

```json
{
  "rules": {
    "examtopics_progress": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

