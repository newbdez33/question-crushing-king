import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayoutProvider, useLayout } from '../layout-provider'

// Mock cookies module
vi.mock('@/lib/cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}))

import { getCookie, setCookie } from '@/lib/cookies'

// Test component that uses layout context
function TestComponent() {
  const {
    collapsible,
    setCollapsible,
    variant,
    setVariant,
    resetLayout,
    defaultCollapsible,
    defaultVariant,
  } = useLayout()

  return (
    <div>
      <span data-testid="collapsible">{collapsible}</span>
      <span data-testid="variant">{variant}</span>
      <span data-testid="default-collapsible">{defaultCollapsible}</span>
      <span data-testid="default-variant">{defaultVariant}</span>
      <button onClick={() => setCollapsible('offcanvas')}>Set Offcanvas</button>
      <button onClick={() => setCollapsible('icon')}>Set Icon</button>
      <button onClick={() => setCollapsible('none')}>Set None</button>
      <button onClick={() => setVariant('sidebar')}>Set Sidebar</button>
      <button onClick={() => setVariant('floating')}>Set Floating</button>
      <button onClick={() => setVariant('inset')}>Set Inset</button>
      <button onClick={() => resetLayout()}>Reset</button>
    </div>
  )
}

describe('LayoutProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should provide default values', () => {
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    expect(screen.getByTestId('collapsible')).toHaveTextContent('icon')
    expect(screen.getByTestId('variant')).toHaveTextContent('inset')
    expect(screen.getByTestId('default-collapsible')).toHaveTextContent('icon')
    expect(screen.getByTestId('default-variant')).toHaveTextContent('inset')
  })

  it('should load collapsible from cookie', () => {
    vi.mocked(getCookie).mockImplementation((name: string) => {
      if (name === 'layout_collapsible') return 'offcanvas'
      return undefined
    })

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    expect(screen.getByTestId('collapsible')).toHaveTextContent('offcanvas')
  })

  it('should load variant from cookie', () => {
    vi.mocked(getCookie).mockImplementation((name: string) => {
      if (name === 'layout_variant') return 'floating'
      return undefined
    })

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    expect(screen.getByTestId('variant')).toHaveTextContent('floating')
  })

  it('should allow setting collapsible', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    await user.click(screen.getByText('Set Offcanvas'))

    expect(screen.getByTestId('collapsible')).toHaveTextContent('offcanvas')
    expect(setCookie).toHaveBeenCalledWith('layout_collapsible', 'offcanvas', 604800)
  })

  it('should allow setting variant', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    await user.click(screen.getByText('Set Floating'))

    expect(screen.getByTestId('variant')).toHaveTextContent('floating')
    expect(setCookie).toHaveBeenCalledWith('layout_variant', 'floating', 604800)
  })

  it('should reset layout to defaults', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockImplementation((name: string) => {
      if (name === 'layout_collapsible') return 'offcanvas'
      if (name === 'layout_variant') return 'floating'
      return undefined
    })

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    expect(screen.getByTestId('collapsible')).toHaveTextContent('offcanvas')
    expect(screen.getByTestId('variant')).toHaveTextContent('floating')

    await user.click(screen.getByText('Reset'))

    expect(screen.getByTestId('collapsible')).toHaveTextContent('icon')
    expect(screen.getByTestId('variant')).toHaveTextContent('inset')
  })

  it('should cycle through collapsible options', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    await user.click(screen.getByText('Set Offcanvas'))
    expect(screen.getByTestId('collapsible')).toHaveTextContent('offcanvas')

    await user.click(screen.getByText('Set None'))
    expect(screen.getByTestId('collapsible')).toHaveTextContent('none')

    await user.click(screen.getByText('Set Icon'))
    expect(screen.getByTestId('collapsible')).toHaveTextContent('icon')
  })

  it('should cycle through variant options', async () => {
    const user = userEvent.setup()
    vi.mocked(getCookie).mockReturnValue(undefined)

    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    )

    await user.click(screen.getByText('Set Sidebar'))
    expect(screen.getByTestId('variant')).toHaveTextContent('sidebar')

    await user.click(screen.getByText('Set Floating'))
    expect(screen.getByTestId('variant')).toHaveTextContent('floating')

    await user.click(screen.getByText('Set Inset'))
    expect(screen.getByTestId('variant')).toHaveTextContent('inset')
  })

  it('should throw error when useLayout is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useLayout must be used within a LayoutProvider')

    consoleSpy.mockRestore()
  })
})
