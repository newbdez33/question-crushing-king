import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeSidebar, type PracticeSettings } from '../practice-sidebar'
import type { ExamProgress } from '@/services/progress-service'

describe('PracticeSidebar', () => {
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
    onClearProgress: vi.fn(),
    settings: defaultSettings,
    onSettingsChange: vi.fn(),
    mistakesSessionStatus: {},
  }

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render the answer sheet title', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Answer Sheet')).toBeInTheDocument()
  })

  it('should render clear progress button', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Clear Progress')).toBeInTheDocument()
  })

  it('should call onClearProgress when clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClearProgress = vi.fn()
    render(<PracticeSidebar {...defaultProps} onClearProgress={onClearProgress} />)

    await user.click(screen.getByText('Clear Progress'))
    expect(onClearProgress).toHaveBeenCalled()
  })

  it('should render question buttons for each question', () => {
    render(<PracticeSidebar {...defaultProps} />)

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
  })

  it('should call onNavigate when question button is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<PracticeSidebar {...defaultProps} onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: '3' }))
    expect(onNavigate).toHaveBeenCalledWith(2) // 0-indexed
  })

  it('should show correct and incorrect counts', () => {
    const progress: ExamProgress = {
      q1: { status: 'correct', lastAnswered: Date.now() },
      q2: { status: 'correct', lastAnswered: Date.now() },
      q3: { status: 'incorrect', lastAnswered: Date.now() },
    }
    render(<PracticeSidebar {...defaultProps} progress={progress} />)

    expect(screen.getByText('Correct: 2')).toBeInTheDocument()
    expect(screen.getByText('Incorrect: 1')).toBeInTheDocument()
  })

  it('should calculate accuracy correctly', () => {
    const progress: ExamProgress = {
      q1: { status: 'correct', lastAnswered: Date.now() },
      q2: { status: 'correct', lastAnswered: Date.now() },
      q3: { status: 'incorrect', lastAnswered: Date.now() },
      q4: { status: 'correct', lastAnswered: Date.now() },
    }
    render(<PracticeSidebar {...defaultProps} progress={progress} />)

    expect(screen.getByText('Accuracy: 75%')).toBeInTheDocument()
  })

  it('should show 0% accuracy when no answers', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Accuracy: 0%')).toBeInTheDocument()
  })

  it('should render settings section', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render auto next toggle', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Auto next when correct')).toBeInTheDocument()
  })

  it('should toggle autoNext setting', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    render(
      <PracticeSidebar {...defaultProps} onSettingsChange={onSettingsChange} />
    )

    const switchEl = screen.getByRole('switch')
    await user.click(switchEl)

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ autoNext: true })
    )
  })

  it('should render font size buttons', () => {
    render(<PracticeSidebar {...defaultProps} />)
    expect(screen.getByText('Font size')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'small' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'normal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'large' })).toBeInTheDocument()
  })

  it('should change font size setting', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    render(
      <PracticeSidebar {...defaultProps} onSettingsChange={onSettingsChange} />
    )

    await user.click(screen.getByRole('button', { name: 'large' }))

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontSize: 'large' })
    )
  })

  it('should show consecutive correct controls in mistakes mode', () => {
    const mistakesSettings: PracticeSettings = {
      ...defaultSettings,
      mistakesMode: true,
    }
    render(<PracticeSidebar {...defaultProps} settings={mistakesSettings} />)

    expect(screen.getByText('Consecutive correct')).toBeInTheDocument()
    // Check for the helper text that appears with consecutive correct controls
    expect(screen.getByText('Auto remove wrong questions based on consecutive correct count')).toBeInTheDocument()
  })

  it('should increment consecutive correct', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const mistakesSettings: PracticeSettings = {
      ...defaultSettings,
      mistakesMode: true,
    }
    render(
      <PracticeSidebar
        {...defaultProps}
        settings={mistakesSettings}
        onSettingsChange={onSettingsChange}
      />
    )

    const buttons = screen.getAllByRole('button', { name: '+' })
    await user.click(buttons[0])

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ consecutiveCorrect: 4 })
    )
  })

  it('should decrement consecutive correct', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const mistakesSettings: PracticeSettings = {
      ...defaultSettings,
      mistakesMode: true,
    }
    render(
      <PracticeSidebar
        {...defaultProps}
        settings={mistakesSettings}
        onSettingsChange={onSettingsChange}
      />
    )

    const buttons = screen.getAllByRole('button', { name: '-' })
    await user.click(buttons[0])

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ consecutiveCorrect: 2 })
    )
  })

  it('should not decrement consecutive correct below 1', async () => {
    const user = userEvent.setup()
    const onSettingsChange = vi.fn()
    const mistakesSettings: PracticeSettings = {
      ...defaultSettings,
      mistakesMode: true,
      consecutiveCorrect: 1,
    }
    render(
      <PracticeSidebar
        {...defaultProps}
        settings={mistakesSettings}
        onSettingsChange={onSettingsChange}
      />
    )

    const buttons = screen.getAllByRole('button', { name: '-' })
    await user.click(buttons[0])

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ consecutiveCorrect: 1 })
    )
  })

  it('should use mistakesSessionStatus in mistakes mode', () => {
    const mistakesSettings: PracticeSettings = {
      ...defaultSettings,
      mistakesMode: true,
    }
    const mistakesSessionStatus = {
      q1: 'correct' as const,
      q2: 'incorrect' as const,
    }
    render(
      <PracticeSidebar
        {...defaultProps}
        settings={mistakesSettings}
        mistakesSessionStatus={mistakesSessionStatus}
      />
    )

    expect(screen.getByText('Correct: 1')).toBeInTheDocument()
    expect(screen.getByText('Incorrect: 1')).toBeInTheDocument()
  })

  it('should highlight current question', () => {
    render(<PracticeSidebar {...defaultProps} currentQuestionIndex={2} />)

    const button = screen.getByRole('button', { name: '3' })
    expect(button).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('should apply correct status styling', () => {
    const progress: ExamProgress = {
      q1: { status: 'correct', lastAnswered: Date.now() },
    }
    render(<PracticeSidebar {...defaultProps} progress={progress} />)

    const button = screen.getByRole('button', { name: '1' })
    expect(button).toHaveClass('bg-green-500')
  })

  it('should apply incorrect status styling', () => {
    const progress: ExamProgress = {
      q1: { status: 'incorrect', lastAnswered: Date.now() },
    }
    render(<PracticeSidebar {...defaultProps} progress={progress} />)

    const button = screen.getByRole('button', { name: '1' })
    expect(button).toHaveClass('bg-red-500')
  })
})
