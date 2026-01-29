import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDialogState from '../use-dialog-state'

describe('useDialogState', () => {
  it('should initialize with null by default', () => {
    const { result } = renderHook(() => useDialogState())
    expect(result.current[0]).toBeNull()
  })

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() => useDialogState('approve'))
    expect(result.current[0]).toBe('approve')
  })

  it('should toggle to the value when called with a new value', () => {
    const { result } = renderHook(() => useDialogState<'approve' | 'reject'>())

    act(() => {
      result.current[1]('approve')
    })

    expect(result.current[0]).toBe('approve')
  })

  it('should toggle to null when called with the same value', () => {
    const { result } = renderHook(() => useDialogState<'approve' | 'reject'>())

    act(() => {
      result.current[1]('approve')
    })
    expect(result.current[0]).toBe('approve')

    act(() => {
      result.current[1]('approve')
    })
    expect(result.current[0]).toBeNull()
  })

  it('should switch between different values', () => {
    const { result } = renderHook(() => useDialogState<'approve' | 'reject'>())

    act(() => {
      result.current[1]('approve')
    })
    expect(result.current[0]).toBe('approve')

    act(() => {
      result.current[1]('reject')
    })
    expect(result.current[0]).toBe('reject')
  })

  it('should handle boolean type', () => {
    const { result } = renderHook(() => useDialogState<boolean>())

    act(() => {
      result.current[1](true)
    })
    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1](true)
    })
    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1](false)
    })
    expect(result.current[0]).toBe(false)
  })

  it('should set to null explicitly', () => {
    const { result } = renderHook(() => useDialogState<'approve'>('approve'))

    expect(result.current[0]).toBe('approve')

    act(() => {
      result.current[1](null)
    })

    expect(result.current[0]).toBeNull()
  })

  it('should return setOpen function as second element', () => {
    const { result } = renderHook(() => useDialogState<'test'>())

    expect(typeof result.current[1]).toBe('function')
  })

  it('should handle multiple toggle cycles', () => {
    const { result } = renderHook(() => useDialogState<'dialog'>())

    // Open
    act(() => { result.current[1]('dialog') })
    expect(result.current[0]).toBe('dialog')

    // Close
    act(() => { result.current[1]('dialog') })
    expect(result.current[0]).toBeNull()

    // Open again
    act(() => { result.current[1]('dialog') })
    expect(result.current[0]).toBe('dialog')

    // Close again
    act(() => { result.current[1]('dialog') })
    expect(result.current[0]).toBeNull()
  })
})
