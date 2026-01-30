import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../theme-provider'

// Mock the cookies module
vi.mock('@/lib/cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  removeCookie: vi.fn(),
}))

import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

// Test component that uses the theme context
function TestComponent() {
  const { theme, resolvedTheme, setTheme, resetTheme, defaultTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <span data-testid="default-theme">{defaultTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={() => resetTheme()}>Reset</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  const originalMatchMedia = window.matchMedia
  let mediaQueryListeners: ((e: MediaQueryListEvent) => void)[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    mediaQueryListeners = []

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? false : false, // Default to light system theme
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener)
      }),
      removeEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        const index = mediaQueryListeners.indexOf(listener)
        if (index > -1) mediaQueryListeners.splice(index, 1)
      }),
      dispatchEvent: vi.fn(),
    }))

    // Reset document classes
    document.documentElement.classList.remove('light', 'dark')
  })

  afterEach(() => {
    cleanup()
    window.matchMedia = originalMatchMedia
    document.documentElement.classList.remove('light', 'dark')
  })

  it('should provide default theme as system', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('default-theme')).toHaveTextContent('system')
  })

  it('should load theme from cookie', () => {
    vi.mocked(getCookie).mockReturnValue('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should allow setting theme to light', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Set Light'))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(setCookie).toHaveBeenCalledWith('vite-ui-theme', 'light', expect.any(Number))
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('should allow setting theme to dark', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Set Dark'))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should reset theme to default', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await user.click(screen.getByText('Reset'))

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(removeCookie).toHaveBeenCalledWith('vite-ui-theme')
  })

  it('should resolve system theme to light when system prefers light', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // prefers-color-scheme: dark is false = light
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener)
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
  })

  it('should resolve system theme to dark when system prefers dark', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true, // prefers-color-scheme: dark is true
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener)
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
  })

  it('should respond to system theme changes when in system mode', async () => {
    vi.mocked(getCookie).mockReturnValue(undefined)
    let currentMatches = false

    const mockMediaQuery = {
      get matches() { return currentMatches },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery)

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('light')).toBe(true)

    // Get the registered listener and call it with updated matches
    const addEventListenerCall = mockMediaQuery.addEventListener.mock.calls[0]
    if (addEventListenerCall) {
      const listener = addEventListenerCall[1]
      currentMatches = true
      act(() => {
        listener({ matches: true } as MediaQueryListEvent)
      })
    }

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should accept custom default theme', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should accept custom storage key', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <ThemeProvider storageKey="custom-theme-key">
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Set Dark'))

    expect(setCookie).toHaveBeenCalledWith('custom-theme-key', 'dark', expect.any(Number))
  })

  it('should clean up event listener on unmount', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    const mockRemoveEventListener = vi.fn()
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: mockRemoveEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should use default value when used outside provider', () => {
    // The context has a default value, so it will return the initial state
    // when used outside the provider (no-op functions)
    const { container } = render(<TestComponent />)

    const themeEl = container.querySelector('[data-testid="theme"]')
    const defaultThemeEl = container.querySelector('[data-testid="default-theme"]')
    const resolvedThemeEl = container.querySelector('[data-testid="resolved-theme"]')

    expect(themeEl).toHaveTextContent('system')
    expect(defaultThemeEl).toHaveTextContent('system')
    expect(resolvedThemeEl).toHaveTextContent('light')
  })
})
