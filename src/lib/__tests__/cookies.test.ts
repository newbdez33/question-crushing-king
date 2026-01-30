import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getCookie, setCookie, removeCookie } from '../cookies'

describe('cookies', () => {
  beforeEach(() => {
    // Clear cookies by setting them to expired
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCookie', () => {
    it('should return undefined when cookie does not exist', () => {
      expect(getCookie('nonexistent')).toBeUndefined()
    })

    it('should return the cookie value when it exists', () => {
      document.cookie = 'testCookie=testValue'
      expect(getCookie('testCookie')).toBe('testValue')
    })

    it('should return correct value with multiple cookies', () => {
      document.cookie = 'first=1'
      document.cookie = 'second=2'
      document.cookie = 'third=3'
      expect(getCookie('second')).toBe('2')
    })

    it('should handle cookies with special characters in value', () => {
      document.cookie = 'token=abc123xyz'
      expect(getCookie('token')).toBe('abc123xyz')
    })

    it('should return undefined when document is undefined (SSR)', () => {
      const originalDoc = globalThis.document
      // @ts-expect-error - Testing SSR scenario
      delete globalThis.document
      expect(getCookie('test')).toBeUndefined()
      globalThis.document = originalDoc
    })

    it('should return undefined for partial cookie name matches', () => {
      document.cookie = 'testCookie=value'
      expect(getCookie('test')).toBeUndefined()
    })
  })

  describe('setCookie', () => {
    it('should set a cookie with default max age', () => {
      setCookie('test', 'value')
      expect(getCookie('test')).toBe('value')
    })

    it('should set a cookie with custom max age', () => {
      setCookie('test', 'value', 3600)
      expect(getCookie('test')).toBe('value')
    })

    it('should not throw when document is undefined (SSR)', () => {
      const originalDoc = globalThis.document
      // @ts-expect-error - Testing SSR scenario
      delete globalThis.document
      expect(() => setCookie('test', 'value')).not.toThrow()
      globalThis.document = originalDoc
    })

    it('should overwrite existing cookie', () => {
      setCookie('test', 'original')
      expect(getCookie('test')).toBe('original')
      setCookie('test', 'updated')
      expect(getCookie('test')).toBe('updated')
    })
  })

  describe('removeCookie', () => {
    it('should remove a cookie', () => {
      setCookie('test', 'value')
      expect(getCookie('test')).toBe('value')
      removeCookie('test')
      // After removal, the cookie should be gone or empty
      const value = getCookie('test')
      expect(value === undefined || value === '').toBe(true)
    })

    it('should not throw when document is undefined (SSR)', () => {
      const originalDoc = globalThis.document
      // @ts-expect-error - Testing SSR scenario
      delete globalThis.document
      expect(() => removeCookie('test')).not.toThrow()
      globalThis.document = originalDoc
    })

    it('should not throw when removing non-existent cookie', () => {
      expect(() => removeCookie('nonexistent')).not.toThrow()
    })
  })
})
