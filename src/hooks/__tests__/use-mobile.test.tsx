import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth
  const originalMatchMedia = window.matchMedia

  let changeListeners: ((e: MediaQueryListEvent) => void)[] = []

  const createMatchMedia = (matches: boolean) => {
    return vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          changeListeners.push(listener)
        }
      }),
      removeEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
        const index = changeListeners.indexOf(listener)
        if (index > -1) changeListeners.splice(index, 1)
      }),
      dispatchEvent: vi.fn(),
    }))
  }

  beforeEach(() => {
    changeListeners = []
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    })
    window.matchMedia = originalMatchMedia
  })

  it('should return false for desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true for mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return false at exactly 768px (breakpoint)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 })
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true at 767px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 })
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should update when viewport changes via matchMedia listener', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate resize to mobile by triggering the change listener
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })
      changeListeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent)
      })
    })

    expect(result.current).toBe(true)
  })

  it('should handle initial undefined state', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    // The hook returns !!isMobile, so undefined becomes false
    expect(result.current).toBe(false)
  })

  it('should call matchMedia on mount', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    const mockMatchMedia = createMatchMedia(false)
    window.matchMedia = mockMatchMedia

    renderHook(() => useIsMobile())

    // matchMedia should be called during hook initialization
    expect(mockMatchMedia).toHaveBeenCalled()
  })

  it('should toggle from mobile to desktop', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    // Simulate resize to desktop
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
      changeListeners.forEach(listener => {
        listener({ matches: false } as MediaQueryListEvent)
      })
    })

    expect(result.current).toBe(false)
  })
})
