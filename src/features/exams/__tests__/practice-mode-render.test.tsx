import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
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

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: () => mockGetExamProgress(),
    getExamSettings: () => mockGetExamSettings(),
    saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
    saveExamSettings: (...args: unknown[]) => mockSaveExamSettings(...args),
    toggleBookmark: vi.fn(),
    clearExamProgress: vi.fn(),
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
  ],
}

describe('PracticeMode Basic Rendering', () => {
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

  it('renders loading state initially', () => {
    render(<PracticeMode examId="test-exam" />)
    expect(screen.getByText('Loading questions…')).toBeInTheDocument()
  })

  it('renders question after loading', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText('What is 1+1?')).toBeInTheDocument()
  })

  it('shows Single type indicator', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText(/Single/i)).toBeInTheDocument()
  })

  it('renders sidebar with Answer Sheet', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
  })

  it('renders settings section', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders clear progress button', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(screen.getByText('Clear Progress')).toBeInTheDocument()
  })

  it('calls getExamProgress on mount', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(mockGetExamProgress).toHaveBeenCalled()
  })

  it('calls getExamSettings on mount', async () => {
    render(<PracticeMode examId="test-exam" />)

    await waitFor(
      () => {
        expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument()
      },
      { timeout: 8000 }
    )

    expect(mockGetExamSettings).toHaveBeenCalled()
  })
})
