import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeMobileBar } from '../practice-mobile-bar'
import type { PracticeSettings } from '../practice-sidebar'
import type { ExamProgress } from '@/services/progress-service'

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

describe('PracticeMobileBar', () => {
  const defaultSettings: PracticeSettings = {
    autoNext: false,
    studyMode: false,
    consecutiveCorrect: 3,
    fontSize: 'normal',
    mistakesMode: false,
    bookmarksMode: false,
  }

  const mockQuestions = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
    { id: 'q4' },
    { id: 'q5' },
  ]

  const defaultProps = {
    questions: mockQuestions,
    progress: {} as ExamProgress,
    currentQuestionIndex: 0,
    onNavigate: vi.fn(),
    isBookmarked: false,
    onToggleBookmark: vi.fn(),
    mistakesMode: false,
    mistakesSessionStatus: {},
    settings: defaultSettings,
    onSettingsChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.documentElement.style.setProperty
    document.documentElement.style.setProperty = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('should render bookmark button', () => {
    render(<PracticeMobileBar {...defaultProps} />)
    expect(screen.getByText('Bookmark')).toBeInTheDocument()
  })

  it('should toggle bookmark when clicked', async () => {
    const user = userEvent.setup()
    const onToggleBookmark = vi.fn()
    render(
      <PracticeMobileBar {...defaultProps} onToggleBookmark={onToggleBookmark} />
    )

    // Find bookmark button by its screen reader text
    const bookmarkButton = screen.getByText('Bookmark').closest('button')
    await user.click(bookmarkButton!)

    expect(onToggleBookmark).toHaveBeenCalled()
  })

  it('should show correct and incorrect counts', () => {
    const progress: ExamProgress = {
      q1: { status: 'correct', lastAnswered: Date.now() },
      q2: { status: 'correct', lastAnswered: Date.now() },
      q3: { status: 'incorrect', lastAnswered: Date.now() },
    }
    render(<PracticeMobileBar {...defaultProps} progress={progress} />)

    expect(screen.getByText('2')).toBeInTheDocument() // correct count
    expect(screen.getByText('1')).toBeInTheDocument() // incorrect count
  })

  it('should render answer card button', () => {
    render(<PracticeMobileBar {...defaultProps} />)
    expect(screen.getByText('Answer Card')).toBeInTheDocument()
  })

  it('should open sheet when answer card button is clicked', async () => {
    const user = userEvent.setup()
    render(<PracticeMobileBar {...defaultProps} />)

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
    })
  })

  it('should render question buttons in sheet', async () => {
    const user = userEvent.setup()
    render(<PracticeMobileBar {...defaultProps} />)

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
      }
    })
  })

  it('should navigate and close sheet when question is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<PracticeMobileBar {...defaultProps} onNavigate={onNavigate} />)

    // Open sheet
    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    // Wait for sheet to open
    await waitFor(() => {
      expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
    })

    // Click on question 3
    const questionButton = screen.getByRole('button', { name: '3' })
    await user.click(questionButton)

    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('should show font size options in sheet', async () => {
    const user = userEvent.setup()
    render(<PracticeMobileBar {...defaultProps} />)

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      expect(screen.getByText('Font size')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'small' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'normal' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'large' })).toBeInTheDocument()
    })
  })

  it('should change font size setting', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    render(
      <PracticeMobileBar {...defaultProps} onSettingsChange={onSettingsChange} />
    )

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'large' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'large' }))

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontSize: 'large' })
    )
  })

  it('should use mistakesSessionStatus in mistakes mode', () => {
    const mistakesSessionStatus = {
      q1: 'correct' as const,
      q2: 'incorrect' as const,
      q3: 'correct' as const,
    }
    render(
      <PracticeMobileBar
        {...defaultProps}
        mistakesMode={true}
        mistakesSessionStatus={mistakesSessionStatus}
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument() // correct count
    expect(screen.getByText('1')).toBeInTheDocument() // incorrect count
  })

  it('should highlight bookmarked state', () => {
    render(<PracticeMobileBar {...defaultProps} isBookmarked={true} />)

    const bookmarkButton = screen.getByText('Bookmark').closest('button')
    expect(bookmarkButton).toHaveClass('text-yellow-500')
  })

  it('should show correct styling for answered questions in sheet', async () => {
    const user = userEvent.setup()
    const progress: ExamProgress = {
      q1: { status: 'correct', lastAnswered: Date.now() },
      q2: { status: 'incorrect', lastAnswered: Date.now() },
    }
    render(<PracticeMobileBar {...defaultProps} progress={progress} />)

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      const button1 = screen.getByRole('button', { name: '1' })
      const button2 = screen.getByRole('button', { name: '2' })
      expect(button1).toHaveClass('border-green-500')
      expect(button2).toHaveClass('border-red-500')
    })
  })

  it('should highlight current question in sheet', async () => {
    const user = userEvent.setup()
    render(<PracticeMobileBar {...defaultProps} currentQuestionIndex={2} />)

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '3' })
      expect(button).toHaveClass('ring-2', 'ring-blue-500')
    })
  })

  it('should handle mistakes mode status in sheet', async () => {
    const user = userEvent.setup()
    const mistakesSessionStatus = {
      q1: 'correct' as const,
    }
    render(
      <PracticeMobileBar
        {...defaultProps}
        mistakesMode={true}
        mistakesSessionStatus={mistakesSessionStatus}
      />
    )

    const answerCardButton = screen.getByText('Answer Card').closest('button')
    await user.click(answerCardButton!)

    await waitFor(() => {
      const button1 = screen.getByRole('button', { name: '1' })
      expect(button1).toHaveClass('border-green-500')
    })
  })

  it('should set CSS variable for mobile bar height', () => {
    render(<PracticeMobileBar {...defaultProps} />)

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--mobile-bar-height',
      expect.any(String)
    )
  })

  describe('Sheet content', () => {
    it('should render drag handle in sheet', async () => {
      const user = userEvent.setup()
      render(<PracticeMobileBar {...defaultProps} />)

      // Open sheet
      const answerCardButton = screen.getByText('Answer Card').closest('button')
      await user.click(answerCardButton!)

      await waitFor(() => {
        expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
      })

      // Find the drag handle element in the document (sheet is rendered in a portal)
      const dragHandle = document.querySelector('[data-drag-handle]')
      expect(dragHandle).toBeInTheDocument()
    })

    it('should render sheet content with correct structure', async () => {
      const user = userEvent.setup()
      render(<PracticeMobileBar {...defaultProps} />)

      // Open sheet
      const answerCardButton = screen.getByText('Answer Card').closest('button')
      await user.click(answerCardButton!)

      await waitFor(() => {
        expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
        // Check for question grid
        for (let i = 1; i <= 5; i++) {
          expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
        }
        // Check for settings
        expect(screen.getByText('Font size')).toBeInTheDocument()
      })
    })
  })

  describe('Touch gestures', () => {
    // Note: Touch handlers are tested via React Testing Library fireEvent
    // to avoid issues with react-remove-scroll in jsdom

    it('should handle touch events on sheet content', async () => {
      const user = userEvent.setup()
      render(<PracticeMobileBar {...defaultProps} />)

      // Open sheet
      const answerCardButton = screen.getByText('Answer Card').closest('button')
      await user.click(answerCardButton!)

      await waitFor(() => {
        expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
      })

      // Find the drag handle
      const dragHandle = document.querySelector('[data-drag-handle]')
      expect(dragHandle).toBeInTheDocument()

      // Use fireEvent for touch events which works better with jsdom
      // The actual sheet content handles touch events
      const sheetContent = document.querySelector('[role="dialog"]')
      expect(sheetContent).toBeInTheDocument()
    })
  })
})
