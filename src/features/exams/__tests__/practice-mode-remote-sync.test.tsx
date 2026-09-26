import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, act } from '@testing-library/react'
import { PracticeMode } from '../practice-mode'

// Mock localStorage
const memoryStorage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memoryStorage.get(k) ?? null,
  setItem: (k: string, v: string) => memoryStorage.set(k, String(v)),
  removeItem: (k: string) => memoryStorage.delete(k),
  clear: () => memoryStorage.clear(),
})

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(() => () => {}),
  get: vi.fn(),
  update: vi.fn(),
}))

// Signed-in user: this is the only case where practice mode waits for the
// remote progress subscription before rendering.
vi.mock('@/context/auth-ctx', () => ({
  useAuth: () => ({
    user: { uid: 'user-1' },
    guestId: 'guest-uuid',
    loading: false,
  }),
}))

type ProgressCallback = (progress: Record<string, unknown> | null) => void
type ErrorCallback = (error: Error) => void
const mockSubscribeExamProgress = vi.fn<
  (
    uid: string,
    examId: string,
    onChange: ProgressCallback,
    onError?: ErrorCallback
  ) => () => void
>()

vi.mock('@/services/firebase-progress', () => ({
  subscribeExamProgress: (...args: Parameters<typeof mockSubscribeExamProgress>) =>
    mockSubscribeExamProgress(...args),
  saveAnswer: vi.fn(),
  toggleBookmark: vi.fn(),
  clearExamProgress: vi.fn(),
  getExamSettings: vi.fn(async () => ({})),
  saveExamSettings: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}))

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

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    // No local progress yet: first visit to this exam
    getExamProgress: () => ({}),
    getExamSettings: () => ({}),
    saveAnswer: vi.fn(),
    saveExamSettings: vi.fn(),
    toggleBookmark: vi.fn(),
    clearExamProgress: vi.fn(),
    mergeRemoteExamProgress: vi.fn(),
  },
}))

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
      ],
      correctAnswer: 'B',
    },
  ],
}

describe('PracticeMode remote progress sync', () => {
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
    vi.useRealTimers()
  })

  it('stops waiting for the remote subscription after a timeout and renders local data', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Remote never answers (offline / blocked network)
    mockSubscribeExamProgress.mockImplementation(() => () => {})

    render(<PracticeMode examId='test-exam' />)

    await waitFor(() => {
      expect(mockSubscribeExamProgress).toHaveBeenCalled()
    })
    expect(screen.getByText('Loading questions…')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText('What is 1+1?')).toBeInTheDocument()
    })
  })

  it('renders local data when the remote subscription reports an error', async () => {
    // Remote read rejected (e.g. security rules)
    mockSubscribeExamProgress.mockImplementation((_uid, _examId, _onChange, onError) => {
      onError?.(new Error('permission_denied'))
      return () => {}
    })

    render(<PracticeMode examId='test-exam' />)

    await waitFor(() => {
      expect(screen.getByText('What is 1+1?')).toBeInTheDocument()
    })
  })

  it('still merges remote progress that arrives after the timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let deliver: ProgressCallback = () => {}
    mockSubscribeExamProgress.mockImplementation((_uid, _examId, onChange) => {
      deliver = onChange
      return () => {}
    })

    render(<PracticeMode examId='test-exam' />)
    await waitFor(() => {
      expect(mockSubscribeExamProgress).toHaveBeenCalled()
    })

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    await waitFor(() => {
      expect(screen.getByText('What is 1+1?')).toBeInTheDocument()
    })

    // Late remote snapshot says q1 was already answered correctly
    await act(async () => {
      deliver({
        q1: { status: 'correct', userSelection: [1], lastAnswered: Date.now() },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Correct: 1')).toBeInTheDocument()
    })
  })
})
