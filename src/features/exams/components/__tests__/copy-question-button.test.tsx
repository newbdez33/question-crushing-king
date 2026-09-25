import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CopyQuestionButton } from '../copy-question-button'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CopyQuestionButton', () => {
  const question = {
    text: 'What is 1+1?',
    options: [{ text: '1' }, { text: '2' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders an accessible copy button', () => {
    render(<CopyQuestionButton question={question} />)
    expect(
      screen.getByRole('button', { name: 'Copy question and options' })
    ).toBeInTheDocument()
  })

  it('copies the question and options and shows a success toast', async () => {
    const user = userEvent.setup()
    render(<CopyQuestionButton question={question} />)

    await user.click(
      screen.getByRole('button', { name: 'Copy question and options' })
    )

    expect(await navigator.clipboard.readText()).toBe(
      'What is 1+1?\n\nA. 1\nB. 2'
    )
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
  })

  it('shows an error toast when the clipboard write fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
      new Error('denied')
    )
    render(<CopyQuestionButton question={question} />)

    await user.click(
      screen.getByRole('button', { name: 'Copy question and options' })
    )

    expect(toast.error).toHaveBeenCalledWith('Copy failed')
    expect(toast.success).not.toHaveBeenCalled()
  })
})
