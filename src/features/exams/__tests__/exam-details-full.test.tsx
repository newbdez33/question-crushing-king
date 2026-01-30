import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExamDetails } from '../exam-details'
import { AuthContext } from '@/context/auth-ctx'
import { toast } from 'sonner'

// Mock router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

// Mock components
vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <div data-testid="header">{children}</div>,
}))
vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children: React.ReactNode }) => <main data-testid="main">{children}</main>,
}))
vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => <div data-testid="profile-dropdown" />,
}))
vi.mock('@/components/theme-switch', () => ({
  ThemeSwitch: () => <div data-testid="theme-switch" />,
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock firebase progress
const mockSubscribeExamProgress = vi.fn()
vi.mock('@/services/firebase-progress', () => ({
  saveExamSettings: vi.fn(async () => {}),
  subscribeExamProgress: (userId: string, examId: string, callback: (p: Record<string, unknown> | null) => void) => {
    mockSubscribeExamProgress(userId, examId, callback)
    return () => {}
  },
}))

// Mock progress service
const mockGetExamProgress = vi.fn()
const mockGetExamSettings = vi.fn()
const mockSaveExamSettings = vi.fn()

vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    getExamProgress: (...args: unknown[]) => mockGetExamProgress(...args),
    getExamSettings: (...args: unknown[]) => mockGetExamSettings(...args),
    saveExamSettings: (...args: unknown[]) => mockSaveExamSettings(...args),
  },
}))

// Mock useExams hook
vi.mock('@/hooks/use-exams', () => ({
  useExams: () => ({
    exams: [
      { id: 'test-exam', title: 'Test Exam', description: 'Test Description', questionCount: 50 },
    ],
    loading: false,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const renderWithAuth = (
  examId: string,
  authValue: { user: { uid: string } | null; guestId: string; loading: boolean }
) => {
  return render(
    <AuthContext.Provider
      value={{
        user: authValue.user as unknown as import('firebase/auth').User | null,
        guestId: authValue.guestId,
        loading: authValue.loading,
        logout: vi.fn(),
      }}
    >
      <ExamDetails examId={examId} />
    </AuthContext.Provider>
  )
}

describe('ExamDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetExamProgress.mockReturnValue({})
    mockGetExamSettings.mockReturnValue({})
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [] }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should render exam details', async () => {
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Test Exam')).toBeInTheDocument()
    })
  })

  it('should show join button when not owned', async () => {
    mockGetExamSettings.mockReturnValue({ owned: false })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Join My Exams/i })).toBeInTheDocument()
    })
  })

  it('should not show join button when owned', async () => {
    mockGetExamSettings.mockReturnValue({ owned: true })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Join My Exams/i })).not.toBeInTheDocument()
    })
  })

  it('should show error toast when join fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Join My Exams/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Join My Exams/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download exam data')
    })
  })

  it('should calculate progress stats correctly', async () => {
    mockGetExamProgress.mockReturnValue({
      q1: { status: 'correct', lastAnswered: Date.now() - 1000 },
      q2: { status: 'incorrect', lastAnswered: Date.now() },
    })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      // 2 of 50 = 4%
      expect(screen.getByText('4%')).toBeInTheDocument()
      expect(screen.getByText('2 of 50 completed')).toBeInTheDocument()
    })
  })

  it('should show last studied date when available', async () => {
    const lastStudied = new Date('2024-01-15').getTime()
    mockGetExamProgress.mockReturnValue({
      q1: { status: 'correct', lastAnswered: lastStudied },
    })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      // Should show formatted date
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
    })
  })

  it('should show Never when no last studied', async () => {
    mockGetExamProgress.mockReturnValue({})

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument()
    })
  })

  it('should subscribe to firebase progress for logged-in users', async () => {
    renderWithAuth('test-exam', {
      user: { uid: 'user-1' } as { uid: string },
      guestId: 'guest-1',
      loading: false,
    })

    await waitFor(() => {
      expect(mockSubscribeExamProgress).toHaveBeenCalledWith(
        'user-1',
        'test-exam',
        expect.any(Function)
      )
    })
  })

  it('should render study mode links', async () => {
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument()
      expect(screen.getByText('Study Mode')).toBeInTheDocument()
      expect(screen.getByText('My Mistakes')).toBeInTheDocument()
      expect(screen.getByText('My Bookmarks')).toBeInTheDocument()
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })
  })

  it('should open exam dialog when clicking Exam Mode', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByText('Start Exam Mode')).toBeInTheDocument()
      expect(screen.getByLabelText(/Question count/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Seed/i)).toBeInTheDocument()
    })
  })

  it('should change exam count in dialog', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByLabelText(/Question count/i)).toBeInTheDocument()
    })

    const countInput = screen.getByLabelText(/Question count/i)
    // Triple-click to select all, then type new value
    await user.tripleClick(countInput)
    await user.keyboard('20')

    expect(countInput).toHaveValue(20)
  })

  it('should change exam seed in dialog', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByLabelText(/Seed/i)).toBeInTheDocument()
    })

    const seedInput = screen.getByLabelText(/Seed/i)
    await user.type(seedInput, 'test-seed')

    expect(seedInput).toHaveValue('test-seed')
  })

  it('should close dialog when clicking Cancel', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByText('Start Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText('Start Exam Mode')).not.toBeInTheDocument()
    })
  })

  it('should navigate when clicking Start in exam dialog', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByText('Start Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Start' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/exams/$examId/exam',
        params: { examId: 'test-exam' },
        search: expect.any(Function),
      })
    })
  })

  it('should show available questions info in dialog', async () => {
    const user = userEvent.setup()
    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Exam Mode'))

    await waitFor(() => {
      expect(screen.getByText(/Available questions: 50/)).toBeInTheDocument()
    })
  })

  it('should handle progress with lastAnswered timestamps correctly', async () => {
    const now = Date.now()
    mockGetExamProgress.mockReturnValue({
      q1: { status: 'correct', lastAnswered: now - 10000 },
      q2: { status: 'incorrect', lastAnswered: now - 5000 },
      q3: { status: 'correct', lastAnswered: now }, // Most recent
    })

    renderWithAuth('test-exam', { user: null, guestId: 'guest-1', loading: false })

    await waitFor(() => {
      // Should show the most recent date
      const todayFormatted = new Date(now).toLocaleDateString()
      expect(screen.getByText(todayFormatted)).toBeInTheDocument()
    })
  })
})
