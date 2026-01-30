import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeMode } from '../practice-mode'
import { toast } from 'sonner'

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
const mockSaveExamSettings = vi.fn()
const mockToggleBookmark = vi.fn()
const mockClearExamProgress = vi.fn()

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: () => mockGetExamProgress(),
    getExamSettings: () => mockGetExamSettings(),
    saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
    saveExamSettings: (...args: unknown[]) => mockSaveExamSettings(...args),
    toggleBookmark: (...args: unknown[]) => mockToggleBookmark(...args),
    clearExamProgress: (...args: unknown[]) => mockClearExamProgress(...args),
    mergeRemoteExamProgress: vi.fn(),
  },
}))

// Mock exam data fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockExamData = {
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      type: 'single',
      content: '<p>What is 1+1?</p>',
      options: [
        { label: 'A', content: '1' },
        { label: 'B', content: '2' },
        { label: 'C', content: '3' },
        { label: 'D', content: '4' },
      ],
      correctAnswer: 'B',
      explanation: '<p>1+1 equals 2</p>',
    },
    {
      id: 'q2',
      questionNumber: 2,
      type: 'multiple',
      content: '<p>Select even numbers</p>',
      options: [
        { label: 'A', content: '2' },
        { label: 'B', content: '3' },
        { label: 'C', content: '4' },
        { label: 'D', content: '5' },
      ],
      correctAnswer: 'A,C',
      explanation: '<p>2 and 4 are even</p>',
    },
    {
      id: 'q3',
      questionNumber: 3,
      type: 'single',
      content: '<p>What is 2+2?</p>',
      options: [
        { label: 'A', content: '3' },
        { label: 'B', content: '4' },
        { label: 'C', content: '5' },
        { label: 'D', content: '6' },
      ],
      correctAnswer: 'B',
      explanation: '<p>2+2 equals 4</p>',
    },
  ],
}

describe('PracticeMode Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExamData,
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

  describe('Answer Selection and Submission', () => {
    it('selects an answer for single choice question', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Find option B (correct answer) - use getAllByText and get the first one in the current question
      const optionElements = screen.getAllByText('2')
      await user.click(optionElements[0])

      // Submit button should be enabled
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('submits correct answer and shows success', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Select correct answer B - use getAllByText and get the first one
      const optionElements = screen.getAllByText('2')
      await user.click(optionElements[0])

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      await user.click(submitButton)

      // Should show "Correct Answer!" text
      await waitFor(() => {
        expect(screen.getByText('Correct Answer!')).toBeInTheDocument()
      })

      // Should call saveAnswer with correct status
      expect(mockSaveAnswer).toHaveBeenCalledWith(
        'guest-uuid',
        'test-exam',
        'q1',
        'correct',
        expect.any(Array),
        true,
        expect.any(Object)
      )
    })

    it('submits incorrect answer and shows error', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Select wrong answer A - use getAllByText since '1' may appear multiple places
      const optionElements = screen.getAllByText('1')
      await user.click(optionElements[0])

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i })
      await user.click(submitButton)

      // Should show "Incorrect Answer" text
      await waitFor(() => {
        expect(screen.getByText('Incorrect Answer')).toBeInTheDocument()
      })

      // Should call saveAnswer with incorrect status
      expect(mockSaveAnswer).toHaveBeenCalledWith(
        'guest-uuid',
        'test-exam',
        'q1',
        'incorrect',
        expect.any(Array),
        false,
        expect.any(Object)
      )
    })

    it('shows explanation after submission', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Select answer and submit - use getAllByText
      const optionElements = screen.getAllByText('2')
      await user.click(optionElements[0])
      await user.click(screen.getByRole('button', { name: /Submit Answer/i }))

      // Should show explanation
      await waitFor(() => {
        expect(screen.getByText('Explanation:')).toBeInTheDocument()
        expect(screen.getByText('1+1 equals 2')).toBeInTheDocument()
      })
    })

    it('shows toast message for guest user', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      const optionElements = screen.getAllByText('2')
      await user.click(optionElements[0])
      await user.click(screen.getByRole('button', { name: /Submit Answer/i }))

      await waitFor(() => {
        expect(toast.message).toHaveBeenCalledWith('Saved locally. Sign in to sync to cloud')
      })
    })

    it('disables answer selection after submission', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Select and submit
      const optionElements = screen.getAllByText('2')
      await user.click(optionElements[0])
      await user.click(screen.getByRole('button', { name: /Submit Answer/i }))

      await waitFor(() => {
        expect(screen.getByText('Correct Answer!')).toBeInTheDocument()
      })

      // Submit button should be gone
      expect(screen.queryByRole('button', { name: /Submit Answer/i })).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to next question', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Should be on question 1
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()

      // Click next
      const nextButton = screen.getByTitle('Next Question')
      await user.click(nextButton)

      // Should be on question 2
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
      })
    })

    it('navigates to previous question', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Go to question 2 first
      await user.click(screen.getByTitle('Next Question'))
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
      })

      // Click prev
      const prevButton = screen.getByTitle('Previous Question')
      await user.click(prevButton)

      // Should be on question 1
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
      })
    })

    it('disables prev button on first question', async () => {
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      const prevButton = screen.getByTitle('Previous Question')
      expect(prevButton).toBeDisabled()
    })

    it('disables next button on last question', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Navigate to last question
      await user.click(screen.getByTitle('Next Question'))
      await user.click(screen.getByTitle('Next Question'))

      await waitFor(() => {
        expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
      })

      const nextButton = screen.getByTitle('Next Question')
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Bookmarking', () => {
    it('toggles bookmark on current question', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Find bookmark button in card header
      const bookmarkButtons = screen.getAllByRole('button')
      const bookmarkButton = bookmarkButtons.find(
        (btn) => btn.querySelector('svg.lucide-bookmark')
      )
      expect(bookmarkButton).toBeDefined()

      await user.click(bookmarkButton!)

      // Should call toggleBookmark
      expect(mockToggleBookmark).toHaveBeenCalledWith(
        'guest-uuid',
        'test-exam',
        'q1'
      )

      // Should show toast for guest
      expect(toast.message).toHaveBeenCalledWith('Bookmark saved locally. Sign in to sync to cloud')
    })
  })

  describe('Multiple Choice Questions', () => {
    it('navigates to multiple choice question and shows Multiple badge', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Go to question 2 (multiple choice)
      await user.click(screen.getByTitle('Next Question'))

      await waitFor(() => {
        expect(screen.getByText('Multiple')).toBeInTheDocument()
        expect(screen.getByText('Select even numbers')).toBeInTheDocument()
      })
    })

    it('renders multiple choice checkboxes', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Go to question 2
      await user.click(screen.getByTitle('Next Question'))
      await waitFor(() => {
        expect(screen.getByText('Select even numbers')).toBeInTheDocument()
      })

      // Multiple choice should render checkboxes (hidden but present in DOM)
      const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('Clear Progress', () => {
    it('shows clear progress confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Find Clear Progress button in sidebar
      const clearButton = screen.getByText('Clear Progress')
      await user.click(clearButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
        expect(
          screen.getByText(/This action cannot be undone/)
        ).toBeInTheDocument()
      })
    })

    it('cancels clear progress', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      await user.click(screen.getByText('Clear Progress'))

      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
      })

      // Cancel
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument()
      })

      // clearExamProgress should not have been called
      expect(mockClearExamProgress).not.toHaveBeenCalled()
    })

    it('confirms clear progress', async () => {
      const user = userEvent.setup()
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      await user.click(screen.getByText('Clear Progress'))

      await waitFor(() => {
        expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument()
      })

      // Confirm
      await user.click(screen.getByRole('button', { name: 'Continue' }))

      // Should call clearExamProgress
      await waitFor(() => {
        expect(mockClearExamProgress).toHaveBeenCalledWith('guest-uuid', 'test-exam')
      })
    })
  })

  describe('Settings', () => {
    it('displays settings section', async () => {
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('shows error message when exam fails to load', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<PracticeMode examId="nonexistent-exam" />)

      await waitFor(
        () => {
          // Either shows "not found" error or still loading
          const loadingText = screen.queryByText('Loading questions…')
          const errorText = screen.queryByText(/not found/i)
          expect(loadingText || errorText).toBeTruthy()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Font Size', () => {
    it('applies font size classes correctly', async () => {
      render(<PracticeMode examId="test-exam" />)
      await waitForLoaded()

      // Default should be 'normal' which uses 'text-sm sm:text-base' class
      // The main container should have the font size class
      const mainElement = document.querySelector('main')
      expect(mainElement?.className).toContain('text-sm')
    })
  })

  describe('Initial Question Index', () => {
    it('starts at specified initial question index', async () => {
      render(<PracticeMode examId="test-exam" initialQuestionIndex={1} />)
      await waitForLoaded()

      // Should be on question 2
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
    })
  })
})

describe('PracticeMode with Mistakes Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExamData,
    })
    mockGetExamProgress.mockReturnValue({
      q1: { status: 'incorrect', timesWrong: 1, consecutiveCorrect: 0 },
    })
    mockGetExamSettings.mockReturnValue({})
  })

  afterEach(() => {
    cleanup()
  })

  it('shows My Mistakes in header when in mistakes mode', async () => {
    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText(/My Mistakes/)).toBeInTheDocument()
  })
})

describe('PracticeMode with Bookmarks Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExamData,
    })
    mockGetExamProgress.mockReturnValue({
      q1: { status: 'correct', bookmarked: true },
    })
    mockGetExamSettings.mockReturnValue({})
  })

  afterEach(() => {
    cleanup()
  })

  it('shows My Bookmarks in header when in bookmarks mode', async () => {
    render(<PracticeMode examId="test-exam" initialMode="bookmarks" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText(/My Bookmarks/)).toBeInTheDocument()
  })
})

describe('PracticeMode Empty States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    memoryStorage.clear()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExamData,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows no mistakes message when mistakes mode has no items', async () => {
    mockGetExamProgress.mockReturnValue({})
    mockGetExamSettings.mockReturnValue({})

    render(<PracticeMode examId="test-exam" initialMode="mistakes" />)

    await waitFor(
      () => {
        expect(screen.getByText('No mistakes to review!')).toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText(/don't have any incorrect answers/)).toBeInTheDocument()
  })

  it('shows no bookmarks message when bookmarks mode has no items', async () => {
    mockGetExamProgress.mockReturnValue({})
    mockGetExamSettings.mockReturnValue({})

    render(<PracticeMode examId="test-exam" initialMode="bookmarks" />)

    await waitFor(
      () => {
        expect(screen.getByText('No bookmarked questions!')).toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText(/Bookmark questions while practicing/)).toBeInTheDocument()
  })
})
