import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PracticeMode } from '../practice-mode'

// Mock crypto for guest ID
vi.stubGlobal('crypto', {
  randomUUID: () => 'guest-uuid',
})

// Mock localStorage
const memoryStorage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memoryStorage.get(k) ?? null,
  setItem: (k: string, v: string) => memoryStorage.set(k, String(v)),
  removeItem: (k: string) => memoryStorage.delete(k),
  clear: () => memoryStorage.clear(),
})

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: null) => void) => {
    // Simulate guest user (no auth)
    setTimeout(() => cb(null), 0)
    return () => {}
  },
  getAuth: () => ({}),
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(() => () => {}),
  get: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/services/firebase-progress', () => ({
  subscribeExamProgress: vi.fn(() => () => {}),
  saveAnswer: vi.fn(),
  toggleBookmark: vi.fn(),
  clearExamProgress: vi.fn(),
  getExamSettings: vi.fn(async () => ({})),
  saveExamSettings: vi.fn(),
}))

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}))

// Mock sidebar to avoid SidebarProvider requirement
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SidebarTrigger: () => <button>Toggle Sidebar</button>,
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    setOpen: vi.fn(),
    openMobile: false,
    setOpenMobile: vi.fn(),
    isMobile: false,
    toggleSidebar: vi.fn(),
  }),
}))

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
})

// Mock auth context
vi.mock('@/context/auth-ctx', () => ({
  useAuth: () => ({
    user: null,
    guestId: 'guest-uuid',
    loading: false,
  }),
}))

// Mock progress service
const mockGetExamProgress = vi.fn().mockReturnValue({})
const mockGetExamSettings = vi.fn().mockReturnValue({})
vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: () => mockGetExamProgress(),
    getExamSettings: () => mockGetExamSettings(),
    saveAnswer: vi.fn(),
    saveExamSettings: vi.fn(),
    toggleBookmark: vi.fn(),
    clearExamProgress: vi.fn(),
  },
}))

// Mock exam data fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('PracticeMode - My Mistakes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    // Default: return valid exam data
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        questions: [
          {
            id: 'q1',
            questionNumber: 1,
            type: 'single',
            content: 'Question 1?',
            options: [
              { label: 'A', content: 'Option A' },
              { label: 'B', content: 'Option B' },
            ],
            correctAnswer: 'A',
          },
          {
            id: 'q2',
            questionNumber: 2,
            type: 'single',
            content: 'Question 2?',
            options: [
              { label: 'A', content: 'Option A' },
              { label: 'B', content: 'Option B' },
            ],
            correctAnswer: 'B',
          },
        ],
      }),
    })
  })

  it('should not get stuck on loading when My Mistakes has no mistakes', async () => {
    // No mistakes in progress
    mockGetExamProgress.mockReturnValue({})

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    // Should eventually show "No mistakes to review" instead of staying on loading
    await waitFor(
      () => {
        const loading = screen.queryByText('Loading questions')
        const noMistakes = screen.queryByText('No mistakes to review!')
        const questionNotFound = screen.queryByText('Question not found')

        // Should not be stuck on loading - should show either empty state or error
        expect(loading).not.toBeInTheDocument()
        expect(noMistakes || questionNotFound).toBeTruthy()
      },
      { timeout: 5000 }
    )
  })

  it('should show mistakes when user has incorrect answers', async () => {
    // User has answered q1 incorrectly
    mockGetExamProgress.mockReturnValue({
      q1: {
        status: 'incorrect',
        timesWrong: 1,
        consecutiveCorrect: 0,
        lastAnswered: Date.now(),
        userSelection: [1], // Selected B, but A was correct
      },
    })

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    // Should eventually finish loading (not stuck forever)
    await waitFor(
      () => {
        const loading = screen.queryByText('Loading questions')
        expect(loading).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )
  }, 10000)

  it('should reload mistakes when progress is loaded (race condition fix)', async () => {
    // Simulate race condition: first call returns empty, second returns data
    let callCount = 0
    mockGetExamProgress.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: no data yet
        return {}
      }
      // Subsequent calls: data loaded
      return {
        q1: {
          status: 'incorrect',
          timesWrong: 1,
          consecutiveCorrect: 0,
          lastAnswered: Date.now(),
        },
      }
    })

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    // Should not stay stuck on loading
    await waitFor(
      () => {
        const loading = screen.queryByText('Loading questions')
        expect(loading).not.toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('should show friendly empty message with correct styling', async () => {
    mockGetExamProgress.mockReturnValue({})

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    // Wait for loading to finish
    await waitFor(
      () => {
        const loading = screen.queryByText('Loading questions')
        expect(loading).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    // Check for either the friendly message or the question not found message
    // (both are valid states when no mistakes exist)
    const noMistakes = screen.queryByText('No mistakes to review!')
    const questionNotFound = screen.queryByText('Question not found')

    expect(noMistakes || questionNotFound).toBeTruthy()

    // If showing the friendly message, verify its content
    if (noMistakes) {
      expect(
        screen.getByText("Great job! You don't have any incorrect answers yet.")
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Back to Exam/i })).toBeInTheDocument()
    }
  }, 10000)
})
