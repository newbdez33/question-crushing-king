# Unit Test Coverage Plan - 100% Target

## Current State

- **Test Framework:** Vitest + React Testing Library
- **Current Coverage:** ~2.9% (5 test files out of ~173 source files)
- **Current Thresholds:** 80% lines, 75% branches, 80% functions, 80% statements

## Phase Overview

| Phase | Focus Area | Files | Priority | Est. Test Files |
|-------|-----------|-------|----------|-----------------|
| 1 | Core Services & Hooks | 8 | CRITICAL | 8 |
| 2 | Context Providers | 7 | HIGH | 7 |
| 3 | Feature Components | 35 | HIGH | 20 |
| 4 | Main Components | 15 | MEDIUM | 12 |
| 5 | UI Components | 30 | MEDIUM | 15 |
| 6 | Data Table & Layout | 13 | MEDIUM | 8 |
| 7 | Utilities & Stores | 6 | LOWER | 5 |

**Total Estimated:** ~75 new test files

---

## Phase 1: Core Services & Hooks (CRITICAL)

These contain critical business logic and must be tested first.

### 1.1 Services

#### `src/services/progress-service.ts` (Expand existing tests)
**File:** `src/services/__tests__/progress-service.test.ts`

Functions to add tests for:
- [ ] `getAllProgress()` - localStorage retrieval
- [ ] `getUserProgress(userId)` - user-specific progress
- [ ] `getExamProgress(userId, examId)` - exam-specific progress
- [ ] `saveAnswer(userId, examId, questionIndex, answer, options)` - all flag combinations
- [ ] `toggleBookmark(userId, examId, questionIndex)` - bookmark toggling
- [ ] `clearExamProgress(userId, examId)` - clearing progress
- [ ] `mergeProgress(userId, local, remote)` - merge logic
- [ ] `getSettings(userId)` - settings retrieval
- [ ] `saveSettings(userId, settings)` - settings persistence
- [ ] `mergeSettings(local, remote)` - settings merge

#### `src/services/firebase-progress.ts` (NEW)
**File:** `src/services/__tests__/firebase-progress.test.ts`

Functions to test:
- [ ] `pushProgressToCloud(userId, progress)` - cloud upload
- [ ] `pullProgressFromCloud(userId)` - cloud download
- [ ] `syncProgress(userId)` - bidirectional sync
- [ ] `pushSettingsToCloud(userId, settings)` - settings upload
- [ ] `pullSettingsFromCloud(userId)` - settings download
- [ ] Error handling scenarios
- [ ] Network failure scenarios

#### `src/services/user-profile.ts` (NEW)
**File:** `src/services/__tests__/user-profile.test.ts`

Functions to test:
- [ ] `getUserProfile(userId)` - profile retrieval
- [ ] `updateUserProfile(userId, data)` - profile updates
- [ ] `deleteUserProfile(userId)` - profile deletion

### 1.2 Hooks

#### `src/hooks/use-exams.ts` (NEW)
**File:** `src/hooks/__tests__/use-exams.test.ts`

Test scenarios:
- [ ] Initial loading state
- [ ] Successful exam list fetch
- [ ] Mock exams loading
- [ ] Error handling
- [ ] Caching behavior

#### `src/hooks/use-table-url-state.ts` (NEW)
**File:** `src/hooks/__tests__/use-table-url-state.test.ts`

Test scenarios:
- [ ] URL param parsing
- [ ] State to URL serialization
- [ ] Pagination state management
- [ ] Filter state management
- [ ] Sorting state management
- [ ] Default values

#### `src/hooks/use-mobile.tsx` (NEW)
**File:** `src/hooks/__tests__/use-mobile.test.tsx`

Test scenarios:
- [ ] Desktop viewport detection
- [ ] Mobile viewport detection
- [ ] Resize handling
- [ ] SSR compatibility

#### `src/hooks/use-dialog-state.tsx` (NEW)
**File:** `src/hooks/__tests__/use-dialog-state.test.tsx`

Test scenarios:
- [ ] Open/close state
- [ ] Multiple dialog management
- [ ] Callback execution

---

## Phase 2: Context Providers (HIGH)

### 2.1 Auth Context (Expand existing)

#### `src/context/auth-context.tsx`
**File:** `src/context/__tests__/auth-context.test.tsx`

Test scenarios:
- [ ] Login flow (email/password)
- [ ] Logout flow
- [ ] Session persistence
- [ ] Auth state changes
- [ ] Error handling
- [ ] Token refresh

### 2.2 Theme & Appearance

#### `src/context/theme-provider.tsx` (NEW)
**File:** `src/context/__tests__/theme-provider.test.tsx`

Test scenarios:
- [ ] Light theme application
- [ ] Dark theme application
- [ ] System preference detection
- [ ] Theme persistence
- [ ] Theme toggle

#### `src/context/font-provider.tsx` (NEW)
**File:** `src/context/__tests__/font-provider.test.tsx`

Test scenarios:
- [ ] Font loading
- [ ] Font family switching
- [ ] Font size preferences

#### `src/context/direction-provider.tsx` (NEW)
**File:** `src/context/__tests__/direction-provider.test.tsx`

Test scenarios:
- [ ] LTR direction
- [ ] RTL direction
- [ ] Direction toggle

### 2.3 Layout & Search

#### `src/context/layout-provider.tsx` (NEW)
**File:** `src/context/__tests__/layout-provider.test.tsx`

Test scenarios:
- [ ] Sidebar collapsed state
- [ ] Sidebar expanded state
- [ ] Layout persistence

#### `src/context/search-provider.tsx` (NEW)
**File:** `src/context/__tests__/search-provider.test.tsx`

Test scenarios:
- [ ] Search query handling
- [ ] Search results filtering
- [ ] Clear search

### 2.4 Store

#### `src/stores/auth-store.ts` (NEW)
**File:** `src/stores/__tests__/auth-store.test.ts`

Test scenarios:
- [ ] Initial state
- [ ] Set auth action
- [ ] Clear auth action
- [ ] Cookie integration
- [ ] Persistence

---

## Phase 3: Feature Components (HIGH)

### 3.1 Auth Features

#### Sign In
**File:** `src/features/auth/__tests__/sign-in.test.tsx`
- [ ] Form rendering
- [ ] Validation (email, password)
- [ ] Submit handling
- [ ] Error display
- [ ] Loading state
- [ ] Success redirect

#### Sign Up
**File:** `src/features/auth/__tests__/sign-up.test.tsx`
- [ ] Form rendering
- [ ] All field validation
- [ ] Password confirmation
- [ ] Submit handling
- [ ] Success flow

#### Forgot Password
**File:** `src/features/auth/__tests__/forgot-password.test.tsx`
- [ ] Form rendering
- [ ] Email validation
- [ ] Submit handling
- [ ] Success message

#### OTP Verification
**File:** `src/features/auth/__tests__/otp.test.tsx`
- [ ] OTP input rendering
- [ ] Input handling
- [ ] Verification
- [ ] Resend functionality

### 3.2 Exam Features (Expand existing)

#### Exam Details
**File:** `src/features/exams/__tests__/exam-details.test.tsx`
- [ ] Exam info display
- [ ] Start exam button
- [ ] Resume exam functionality
- [ ] Progress display

#### Study Mode
**File:** `src/features/exams/__tests__/study-mode.test.tsx`
- [ ] Question navigation
- [ ] Answer reveal
- [ ] Explanation display
- [ ] Bookmark functionality

#### Practice Mode (Expand existing)
- [ ] Question answering
- [ ] Score tracking
- [ ] Time tracking
- [ ] Results display

#### Exam Mode
**File:** `src/features/exams/__tests__/exam-mode.test.tsx`
- [ ] Timer functionality
- [ ] Question navigation
- [ ] Answer submission
- [ ] Exam completion

#### Supporting Components
**Files:**
- `src/features/exams/__tests__/practice-sidebar.test.tsx`
- `src/features/exams/__tests__/practice-mobile-bar.test.tsx`
- `src/features/exams/__tests__/study-sidebar.test.tsx`
- `src/features/exams/__tests__/study-mobile-bar.test.tsx`

### 3.3 Settings Features

#### Profile Settings
**File:** `src/features/settings/__tests__/profile.test.tsx`
- [ ] Form rendering
- [ ] Profile data display
- [ ] Update handling
- [ ] Avatar upload

#### Account Settings
**File:** `src/features/settings/__tests__/account.test.tsx`
- [ ] Email change
- [ ] Password change
- [ ] Delete account

#### Appearance Settings
**File:** `src/features/settings/__tests__/appearance.test.tsx`
- [ ] Theme selection
- [ ] Font selection
- [ ] Preview functionality

### 3.4 Dashboard

#### Dashboard Index
**File:** `src/features/dashboard/__tests__/index.test.tsx`
- [ ] Stats display
- [ ] Recent activity
- [ ] Quick actions

### 3.5 Error Pages

**File:** `src/features/errors/__tests__/error-pages.test.tsx`
- [ ] 401 Unauthorized
- [ ] 403 Forbidden
- [ ] 404 Not Found
- [ ] 500 General Error
- [ ] 503 Maintenance
- [ ] Environment Error

---

## Phase 4: Main Components (MEDIUM)

### 4.1 Navigation & Layout

#### Profile Dropdown
**File:** `src/components/__tests__/profile-dropdown.test.tsx`
- [ ] User info display
- [ ] Menu items
- [ ] Sign out handling

#### Theme Switch
**File:** `src/components/__tests__/theme-switch.test.tsx`
- [ ] Current theme display
- [ ] Theme toggle

#### Command Menu
**File:** `src/components/__tests__/command-menu.test.tsx`
- [ ] Keyboard shortcut activation
- [ ] Search functionality
- [ ] Navigation

#### Navigation Progress
**File:** `src/components/__tests__/navigation-progress.test.tsx`
- [ ] Progress bar display
- [ ] Route change handling

### 4.2 Form Components

#### Password Input
**File:** `src/components/__tests__/password-input.test.tsx`
- [ ] Input rendering
- [ ] Show/hide toggle
- [ ] Value handling

#### Date Picker
**File:** `src/components/__tests__/date-picker.test.tsx`
- [ ] Calendar display
- [ ] Date selection
- [ ] Format handling

#### Select Dropdown
**File:** `src/components/__tests__/select-dropdown.test.tsx`
- [ ] Options display
- [ ] Selection handling
- [ ] Placeholder

#### Search
**File:** `src/components/__tests__/search.test.tsx`
- [ ] Input handling
- [ ] Search trigger
- [ ] Clear functionality

### 4.3 Dialogs & Modals

#### Confirm Dialog
**File:** `src/components/__tests__/confirm-dialog.test.tsx`
- [ ] Content display
- [ ] Confirm action
- [ ] Cancel action

#### Sign Out Dialog
**File:** `src/components/__tests__/sign-out-dialog.test.tsx`
- [ ] Dialog content
- [ ] Sign out handling

#### Config Drawer
**File:** `src/components/__tests__/config-drawer.test.tsx`
- [ ] Drawer open/close
- [ ] Settings display

### 4.4 Utility Components

#### Long Text
**File:** `src/components/__tests__/long-text.test.tsx`
- [ ] Truncation
- [ ] Expand functionality

#### Coming Soon
**File:** `src/components/__tests__/coming-soon.test.tsx`
- [ ] Display rendering

#### Learn More
**File:** `src/components/__tests__/learn-more.test.tsx`
- [ ] Link rendering

#### Skip to Main
**File:** `src/components/__tests__/skip-to-main.test.tsx`
- [ ] Accessibility focus

---

## Phase 5: UI Components (MEDIUM)

Radix UI wrapper components - test custom styling and props forwarding.

### 5.1 Core UI

**Files to create:**
- `src/components/ui/__tests__/alert.test.tsx`
- `src/components/ui/__tests__/alert-dialog.test.tsx`
- `src/components/ui/__tests__/avatar.test.tsx`
- `src/components/ui/__tests__/badge.test.tsx`
- `src/components/ui/__tests__/card.test.tsx`
- `src/components/ui/__tests__/checkbox.test.tsx`
- `src/components/ui/__tests__/dialog.test.tsx`
- `src/components/ui/__tests__/input.test.tsx`
- `src/components/ui/__tests__/label.test.tsx`
- `src/components/ui/__tests__/select.test.tsx`
- `src/components/ui/__tests__/textarea.test.tsx`

### 5.2 Navigation UI

**Files to create:**
- `src/components/ui/__tests__/dropdown-menu.test.tsx`
- `src/components/ui/__tests__/tabs.test.tsx`
- `src/components/ui/__tests__/sheet.test.tsx`
- `src/components/ui/__tests__/sidebar.test.tsx`

### 5.3 Data Display UI

**Files to create:**
- `src/components/ui/__tests__/table.test.tsx`
- `src/components/ui/__tests__/skeleton.test.tsx`
- `src/components/ui/__tests__/scroll-area.test.tsx`
- `src/components/ui/__tests__/tooltip.test.tsx`

---

## Phase 6: Data Table & Layout (MEDIUM)

### 6.1 Data Table Components

**Files to create:**
- `src/components/data-table/__tests__/data-table.test.tsx`
- `src/components/data-table/__tests__/bulk-actions.test.tsx`
- `src/components/data-table/__tests__/column-header.test.tsx`
- `src/components/data-table/__tests__/faceted-filter.test.tsx`
- `src/components/data-table/__tests__/pagination.test.tsx`
- `src/components/data-table/__tests__/toolbar.test.tsx`
- `src/components/data-table/__tests__/view-options.test.tsx`

### 6.2 Layout Components

**Files to create:**
- `src/components/layout/__tests__/app-sidebar.test.tsx`
- `src/components/layout/__tests__/authenticated-layout.test.tsx`
- `src/components/layout/__tests__/header.test.tsx`
- `src/components/layout/__tests__/nav-group.test.tsx`
- `src/components/layout/__tests__/nav-user.test.tsx`
- `src/components/layout/__tests__/top-nav.test.tsx`

---

## Phase 7: Utilities & Configuration (LOWER)

### 7.1 Utility Functions

#### `src/lib/utils.ts` (NEW)
**File:** `src/lib/__tests__/utils.test.ts`
- [ ] `cn()` - className merging
- [ ] `sleep()` - delay utility
- [ ] `getPageNumbers()` - pagination helper

#### `src/lib/cookies.ts` (NEW)
**File:** `src/lib/__tests__/cookies.test.ts`
- [ ] `getCookie()`
- [ ] `setCookie()`
- [ ] `removeCookie()`

#### `src/lib/handle-server-error.ts` (NEW)
**File:** `src/lib/__tests__/handle-server-error.test.ts`
- [ ] Error toast display
- [ ] Error message formatting

### 7.2 Configuration (Optional)

**Note:** Config files like `firebase.ts` and `fonts.ts` may not need unit tests if they're purely declarative. Consider integration tests instead.

---

## Testing Patterns & Best Practices

### Mocking Strategy

```typescript
// Firebase mocking pattern
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}))

// localStorage mocking pattern
const localStorageMap = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => localStorageMap.set(key, value),
  removeItem: (key: string) => localStorageMap.delete(key),
  clear: () => localStorageMap.clear()
})

// ResizeObserver mocking
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})
```

### Component Testing Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ComponentName', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    render(<ComponentName />)
    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument()
    })
  })
})
```

### Hook Testing Pattern

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'

describe('useCustomHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('updates state correctly', async () => {
    const { result } = renderHook(() => useCustomHook())
    act(() => {
      result.current.setValue('new value')
    })
    expect(result.current.value).toBe('new value')
  })
})
```

---

## Coverage Configuration Update

Update `vite.config.ts` for 100% coverage target:

```typescript
coverage: {
  thresholds: {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100
  },
  exclude: [
    // Exclude route files (test via E2E)
    'src/routes/**',
    // Exclude type definitions
    '**/*.d.ts',
    // Exclude config files
    'src/lib/firebase.ts',
    'src/lib/fonts.ts',
    // Test files themselves
    '**/__tests__/**',
    '**/test/**'
  ]
}
```

---

## Execution Order

1. **Week 1-2:** Phase 1 (Services & Hooks) - Foundation
2. **Week 3:** Phase 2 (Context Providers)
3. **Week 4-5:** Phase 3 (Feature Components)
4. **Week 6:** Phase 4 (Main Components)
5. **Week 7:** Phase 5 (UI Components)
6. **Week 8:** Phase 6 & 7 (Data Table, Layout, Utilities)
7. **Week 9:** Gap analysis and edge cases

---

## Success Criteria

- [ ] All test files created and passing
- [ ] Coverage report shows 100% on all metrics
- [ ] CI pipeline passes with new coverage thresholds
- [ ] No flaky tests
- [ ] All edge cases documented and tested
- [ ] Mocking patterns documented for future tests
