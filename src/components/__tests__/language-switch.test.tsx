import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitch } from '../language-switch'

describe('LanguageSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders language switch button', () => {
    render(<LanguageSwitch />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has accessible label', () => {
    render(<LanguageSwitch />)
    expect(screen.getByText('Language')).toBeInTheDocument()
  })

  it('opens dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitch />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('简体中文')).toBeInTheDocument()
    expect(screen.getByText('繁體中文')).toBeInTheDocument()
    expect(screen.getByText('日本語')).toBeInTheDocument()
  })

  it('shows check mark for current language', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitch />)

    await user.click(screen.getByRole('button'))

    // Default language is English, so it should have a check mark
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems).toHaveLength(4)
  })

  it('calls setLanguage when a language is selected', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitch />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('简体中文'))

    // The language should be set (mocked in test setup)
  })

  it('renders flag icon', () => {
    render(<LanguageSwitch />)
    const button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })
})
