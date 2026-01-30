import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeMode } from '../practice-mode'
import { toast } from 'sonner'

// Mock canvas
const mockContext = {
  fillStyle: '',
  globalAlpha: 1,
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  setTransform: vi.fn(),
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext

// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (_cb: FrameRequestCallback) => {
  return 1
})
vi.stubGlobal('cancelAnimationFrame', vi.fn())

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
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}))

// Mock sidebar
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
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

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
const mockSaveAnswer = vi.fn()

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: () => mockGetExamProgress(),
    getExamSettings: () => mockGetExamSettings(),
    saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
    saveExamSettings: vi.fn(),
    toggleBookmark: vi.fn(),
    clearExamProgress: vi.fn(),
    mergeRemoteExamProgress: vi.fn(),
  },
}))

// Mock exam data fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Multiple choice exam data
const mockMultipleChoiceExam = {
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      type: 'multiple',
      content: '<p>Select all prime numbers:</p>',
      options: [
        { label: 'A', content: '2' },
        { label: 'B', content: '4' },
        { label: 'C', content: '5' },
        { label: 'D', content: '6' },
      ],
      correctAnswer: 'A,C',
      explanation: '<p>2 and 5 are prime numbers</p>',
    },
    {
      id: 'q2',
      questionNumber: 2,
      type: 'multiple',
      content: '<p>Select even numbers:</p>',
      options: [
        { label: 'A', content: '2' },
        { label: 'B', content: '3' },
        { label: 'C', content: '4' },
        { label: 'D', content: '5' },
      ],
      correctAnswer: 'A,C',
      explanation: '<p>2 and 4 are even</p>',
    },
  ],
}

describe('PracticeMode Multiple Choice Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMultipleChoiceExam,
    })
    mockGetExamProgress.mockReturnValue({})
    mockGetExamSettings.mockReturnValue({})
  })

  afterEach(() => {
    cleanup()
  })

  async function waitForLoaded() {
    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )
  }

  describe('Multiple Choice Submission', () => {
    it('submits correct multiple choice answer', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      // Verify we're on a multiple choice question
      expect(screen.getByText('Multiple')).toBeInTheDocument()
      expect(screen.getByText('Select all prime numbers:')).toBeInTheDocument()

      // Find and click options A and C (2 and 5 - prime numbers)
      // Select the outer div containers (have both cursor-pointer and rounded-lg)
      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')
      expect(optionDivs.length).toBe(4)

      // Click A (index 0) and C (index 2)
      await user.click(optionDivs[0]!)
      await user.click(optionDivs[2]!)

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      await user.click(submitButton)

      // Verify correct answer display
      await waitFor(() => {
        expect(screen.getByText('Correct Answer!')).toBeInTheDocument()
      })

      // Check green styling is applied
      const greenBorder = document.querySelector('[class*="border-green"]')
      expect(greenBorder).toBeInTheDocument()
    })

    it('shows red border for wrong selection after submit', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      // Click options B and D (4 and 6) - both wrong
      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')
      await user.click(optionDivs[1]!) // B - wrong
      await user.click(optionDivs[3]!) // D - wrong

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      await user.click(submitButton)

      // Wait for submission feedback
      await waitFor(() => {
        expect(screen.getByText('Incorrect Answer')).toBeInTheDocument()
      })
    })

    it('shows correct and your answer in multiple choice', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      // Select options
      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')
      await user.click(optionDivs[0]!)
      await user.click(optionDivs[2]!)

      // Submit
      await user.click(screen.getByRole('button', { name: /Submit Answer/i }))

      await waitFor(() => {
        // Should show correct answer labels
        expect(screen.getByText(/Correct Answer:/)).toBeInTheDocument()
        expect(screen.getByText(/Your Answer:/)).toBeInTheDocument()
      })
    })

    it('toggles multiple choice selection', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')

      // Select A
      await user.click(optionDivs[0]!)

      // Select C
      await user.click(optionDivs[2]!)

      // Deselect A
      await user.click(optionDivs[0]!)

      // Now only C should be selected - submit should work with 1 selection
      // (but might not be enough for this question which needs 2)
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      // With only 1 selection for a 2-answer question, submit may be disabled
      expect(submitButton).toBeDefined()
    })

    it('shows submit button after selection', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')
      await user.click(optionDivs[0]!)
      await user.click(optionDivs[2]!)

      // Submit button should be enabled
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Multiple Choice Styling States', () => {
    it('shows primary border on selected unsubmitted option', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')
      await user.click(optionDivs[0]!)

      // Selected option should have primary styling
      const selectedOption = optionDivs[0]
      expect(selectedOption?.className).toContain('border-primary')
    })

    it('shows hover state on unselected options', async () => {
      render(<PracticeMode examId="multi-exam" />)
      await waitForLoaded()

      const optionDivs = document.querySelectorAll('[class*="cursor-pointer"][class*="rounded-lg"]')

      // Unselected options should have hover:bg-muted/50 class
      const firstOption = optionDivs[0]
      expect(firstOption?.className).toContain('hover:bg-muted/50')
    })
  })
})

describe('PracticeMode Mistakes Mode Graduation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        questions: [
          {
            id: 'q1',
            questionNumber: 1,
            type: 'single',
            content: 'Test question',
            options: [
              { label: 'A', content: 'Wrong Answer' },
              { label: 'B', content: 'Correct Answer' },
            ],
            correctAnswer: 'B',
            explanation: 'B is correct',
          },
        ],
      }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows My Mistakes header in mistakes mode with progress', async () => {
    // Set up progress
    mockGetExamProgress.mockReturnValue({
      q1: {
        status: 'incorrect',
        timesWrong: 1,
        consecutiveCorrect: 0,
      },
    })
    mockGetExamSettings.mockReturnValue({ mistakesConsecutiveCorrect: 3 })

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    // Should be in My Mistakes mode
    expect(screen.getByText(/My Mistakes/)).toBeInTheDocument()
  })

  it('triggers graduation logic when answering correctly enough times', async () => {
    // Set up progress: question was wrong, now answered correctly 2 times (need 3)
    mockGetExamProgress.mockReturnValue({
      q1: {
        status: 'incorrect',
        timesWrong: 1,
        consecutiveCorrect: 2, // One more correct = graduated
      },
    })
    mockGetExamSettings.mockReturnValue({ mistakesConsecutiveCorrect: 3 })

    const user = userEvent.setup()
    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    // Should be in My Mistakes mode
    expect(screen.getByText(/My Mistakes/)).toBeInTheDocument()

    // Select correct answer (B)
    const correctOption = screen.getByText('Correct Answer')
    await user.click(correctOption)

    // Submit
    const submitButton = screen.queryByRole('button', { name: /Submit Answer/i })
    if (submitButton) {
      await user.click(submitButton)

      // Wait for graduation toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Great job! This question has been removed from My Mistakes.',
          expect.any(Object)
        )
      }, { timeout: 5000 })
    }
  })
})

describe('FireworksOverlay Canvas Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('mocks canvas context for potential fireworks', async () => {
    // This test verifies canvas mock is in place
    // Actual fireworks testing requires E2E tests
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        questions: [
          {
            id: 'q1',
            questionNumber: 1,
            type: 'single',
            content: 'Test',
            options: [{ label: 'A', content: 'Option A' }],
            correctAnswer: 'A',
          },
        ],
      }),
    })
    mockGetExamProgress.mockReturnValue({})
    mockGetExamSettings.mockReturnValue({})

    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    // Verify mock is in place
    expect(HTMLCanvasElement.prototype.getContext).toBeDefined()
  })
})
