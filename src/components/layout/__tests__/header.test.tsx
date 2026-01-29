import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { Header } from '../header'

// Mock the sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ variant, className }: { variant: string; className: string }) => (
    <button data-testid="sidebar-trigger" data-variant={variant} className={className}>
      Menu
    </button>
  ),
}))

describe('Header', () => {
  beforeEach(() => {
    // Reset scroll position
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render header with children', () => {
    render(
      <Header>
        <span>Test Content</span>
      </Header>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render sidebar trigger', () => {
    render(<Header />)

    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
  })

  it('should apply fixed class when fixed prop is true', () => {
    render(<Header fixed data-testid="header" />)

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('header-fixed', 'sticky', 'top-0')
  })

  it('should not apply fixed class when fixed prop is false', () => {
    render(<Header fixed={false} data-testid="header" />)

    const header = screen.getByTestId('header')
    expect(header).not.toHaveClass('header-fixed')
  })

  it('should apply custom className', () => {
    render(<Header className="custom-header" data-testid="header" />)

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header')
  })

  it('should apply shadow when scrolled and fixed', () => {
    render(<Header fixed data-testid="header" />)

    // Simulate scroll
    act(() => {
      document.documentElement.scrollTop = 20
      document.dispatchEvent(new Event('scroll'))
    })

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('shadow')
  })

  it('should not apply shadow when not scrolled enough', () => {
    render(<Header fixed data-testid="header" />)

    // Simulate small scroll
    act(() => {
      document.documentElement.scrollTop = 5
      document.dispatchEvent(new Event('scroll'))
    })

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('shadow-none')
  })

  it('should not apply shadow when not fixed', () => {
    render(<Header data-testid="header" />)

    // Simulate scroll
    act(() => {
      document.documentElement.scrollTop = 20
      document.dispatchEvent(new Event('scroll'))
    })

    const header = screen.getByTestId('header')
    expect(header).not.toHaveClass('shadow')
  })

  it('should clean up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = render(<Header />)
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('should pass through additional props', () => {
    render(<Header data-testid="header" id="main-header" role="banner" />)

    const header = screen.getByTestId('header')
    expect(header).toHaveAttribute('id', 'main-header')
    expect(header).toHaveAttribute('role', 'banner')
  })

  it('should render separator', () => {
    render(<Header />)

    // Check for separator - it has data-slot attribute
    const separators = document.querySelectorAll('[data-slot="separator"]')
    expect(separators.length).toBeGreaterThan(0)
  })

  it('should use body.scrollTop as fallback', () => {
    render(<Header fixed data-testid="header" />)

    // Simulate scroll using body.scrollTop
    act(() => {
      Object.defineProperty(document.body, 'scrollTop', {
        value: 15,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(document.documentElement, 'scrollTop', {
        value: 0,
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('scroll'))
    })

    const header = screen.getByTestId('header')
    expect(header).toHaveClass('shadow')
  })
})
