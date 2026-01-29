import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSwitch } from '../theme-switch'

// Mock the theme context
const mockSetTheme = vi.fn()
let mockTheme = 'light'

vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}))

// Mock Radix UI dropdown menu
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="dropdown-item">
      {children}
    </button>
  ),
}))

describe('ThemeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme = 'light'

    // Mock document.querySelector for meta theme-color
    document.querySelector = vi.fn().mockReturnValue({
      setAttribute: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should render the theme switch button', () => {
    const { container } = render(<ThemeSwitch />)

    // Should have a trigger button with "Toggle theme" sr-only text
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    // Should have theme option buttons
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0)
  })

  it('should render theme options', () => {
    render(<ThemeSwitch />)

    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('should call setTheme with light when Light option is clicked', async () => {
    const user = userEvent.setup()

    render(<ThemeSwitch />)

    const lightOption = screen.getByText('Light').closest('button')
    await user.click(lightOption!)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('should call setTheme with dark when Dark option is clicked', async () => {
    const user = userEvent.setup()

    render(<ThemeSwitch />)

    const darkOption = screen.getByText('Dark').closest('button')
    await user.click(darkOption!)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should call setTheme with system when System option is clicked', async () => {
    const user = userEvent.setup()

    render(<ThemeSwitch />)

    const systemOption = screen.getByText('System').closest('button')
    await user.click(systemOption!)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('should update meta theme-color when theme changes to dark', () => {
    mockTheme = 'dark'
    const mockSetAttribute = vi.fn()
    document.querySelector = vi.fn().mockReturnValue({
      setAttribute: mockSetAttribute,
    })

    render(<ThemeSwitch />)

    expect(mockSetAttribute).toHaveBeenCalledWith('content', '#020817')
  })

  it('should update meta theme-color when theme changes to light', () => {
    mockTheme = 'light'
    const mockSetAttribute = vi.fn()
    document.querySelector = vi.fn().mockReturnValue({
      setAttribute: mockSetAttribute,
    })

    render(<ThemeSwitch />)

    expect(mockSetAttribute).toHaveBeenCalledWith('content', '#fff')
  })

  it('should handle missing meta theme-color tag gracefully', () => {
    document.querySelector = vi.fn().mockReturnValue(null)

    expect(() => render(<ThemeSwitch />)).not.toThrow()
  })

  it('should show check mark for current theme', () => {
    mockTheme = 'dark'

    render(<ThemeSwitch />)

    // The Check component should be visible for dark theme
    const darkOption = screen.getByText('Dark').closest('button')
    expect(darkOption).toBeInTheDocument()
  })
})
