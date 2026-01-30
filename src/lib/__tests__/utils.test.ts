import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, sleep, getPageNumbers } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const condition = false
      expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle mixed inputs', () => {
      expect(cn('foo', ['bar', 'baz'], { qux: true })).toBe('foo bar baz qux')
    })
  })

  describe('sleep', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should resolve after the specified time', async () => {
      vi.useFakeTimers()
      const promise = sleep(1000)
      vi.advanceTimersByTime(1000)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should default to 1000ms', async () => {
      vi.useFakeTimers()
      const promise = sleep()
      vi.advanceTimersByTime(999)
      // Should not have resolved yet
      let resolved = false
      promise.then(() => { resolved = true })
      await vi.advanceTimersByTimeAsync(0)
      expect(resolved).toBe(false)

      vi.advanceTimersByTime(1)
      await vi.advanceTimersByTimeAsync(0)
      expect(resolved).toBe(true)
    })

    it('should work with different durations', async () => {
      vi.useFakeTimers()
      const promise = sleep(500)
      vi.advanceTimersByTime(500)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('getPageNumbers', () => {
    it('should return all pages for small datasets (<=5 pages)', () => {
      expect(getPageNumbers(1, 3)).toEqual([1, 2, 3])
      expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
      expect(getPageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5])
    })

    it('should return single page for 1 total page', () => {
      expect(getPageNumbers(1, 1)).toEqual([1])
    })

    it('should handle near beginning (currentPage <= 3)', () => {
      expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, '...', 10])
      expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 4, '...', 10])
      expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, '...', 10])
    })

    it('should handle near end (currentPage >= totalPages - 2)', () => {
      expect(getPageNumbers(8, 10)).toEqual([1, '...', 7, 8, 9, 10])
      expect(getPageNumbers(9, 10)).toEqual([1, '...', 7, 8, 9, 10])
      expect(getPageNumbers(10, 10)).toEqual([1, '...', 7, 8, 9, 10])
    })

    it('should handle middle pages', () => {
      expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
      expect(getPageNumbers(6, 10)).toEqual([1, '...', 5, 6, 7, '...', 10])
    })

    it('should handle edge case of 6 pages', () => {
      expect(getPageNumbers(1, 6)).toEqual([1, 2, 3, 4, '...', 6])
      expect(getPageNumbers(4, 6)).toEqual([1, '...', 3, 4, 5, 6])
      expect(getPageNumbers(6, 6)).toEqual([1, '...', 3, 4, 5, 6])
    })

    it('should handle larger datasets', () => {
      expect(getPageNumbers(50, 100)).toEqual([1, '...', 49, 50, 51, '...', 100])
    })
  })
})
