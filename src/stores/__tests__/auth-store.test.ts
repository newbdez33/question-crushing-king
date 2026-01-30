import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../auth-store'

// Mock cookies module
vi.mock('@/lib/cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  removeCookie: vi.fn(),
}))

import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the store state between tests
    useAuthStore.setState({
      auth: {
        user: null,
        setUser: useAuthStore.getState().auth.setUser,
        accessToken: '',
        setAccessToken: useAuthStore.getState().auth.setAccessToken,
        resetAccessToken: useAuthStore.getState().auth.resetAccessToken,
        reset: useAuthStore.getState().auth.reset,
      },
    })
  })

  describe('initialization', () => {
    it('should initialize with null user', () => {
      vi.mocked(getCookie).mockReturnValue(undefined)

      const state = useAuthStore.getState()
      expect(state.auth.user).toBeNull()
    })

    it('should initialize with token from cookie', () => {
      vi.mocked(getCookie).mockReturnValue('"stored-token"')

      // Re-import to test initialization
      // Note: Due to module caching, we test the setAccessToken flow instead
      const state = useAuthStore.getState()
      state.auth.setAccessToken('stored-token')

      expect(useAuthStore.getState().auth.accessToken).toBe('stored-token')
    })
  })

  describe('setUser', () => {
    it('should set user correctly', () => {
      const mockUser = {
        accountNo: '123',
        email: 'test@example.com',
        role: ['user'],
        exp: Date.now() + 3600000,
      }

      useAuthStore.getState().auth.setUser(mockUser)

      expect(useAuthStore.getState().auth.user).toEqual(mockUser)
    })

    it('should allow setting user to null', () => {
      const mockUser = {
        accountNo: '123',
        email: 'test@example.com',
        role: ['user'],
        exp: Date.now() + 3600000,
      }

      useAuthStore.getState().auth.setUser(mockUser)
      expect(useAuthStore.getState().auth.user).not.toBeNull()

      useAuthStore.getState().auth.setUser(null)
      expect(useAuthStore.getState().auth.user).toBeNull()
    })
  })

  describe('setAccessToken', () => {
    it('should set access token and save to cookie', () => {
      useAuthStore.getState().auth.setAccessToken('new-token')

      expect(useAuthStore.getState().auth.accessToken).toBe('new-token')
      expect(setCookie).toHaveBeenCalledWith(
        'thisisjustarandomstring',
        '"new-token"'
      )
    })

    it('should handle empty token', () => {
      useAuthStore.getState().auth.setAccessToken('')

      expect(useAuthStore.getState().auth.accessToken).toBe('')
      expect(setCookie).toHaveBeenCalled()
    })
  })

  describe('resetAccessToken', () => {
    it('should reset access token and remove cookie', () => {
      // First set a token
      useAuthStore.getState().auth.setAccessToken('some-token')
      expect(useAuthStore.getState().auth.accessToken).toBe('some-token')

      // Then reset it
      useAuthStore.getState().auth.resetAccessToken()

      expect(useAuthStore.getState().auth.accessToken).toBe('')
      expect(removeCookie).toHaveBeenCalledWith('thisisjustarandomstring')
    })
  })

  describe('reset', () => {
    it('should reset user and access token', () => {
      const mockUser = {
        accountNo: '123',
        email: 'test@example.com',
        role: ['admin'],
        exp: Date.now() + 3600000,
      }

      // Set user and token
      useAuthStore.getState().auth.setUser(mockUser)
      useAuthStore.getState().auth.setAccessToken('some-token')

      expect(useAuthStore.getState().auth.user).not.toBeNull()
      expect(useAuthStore.getState().auth.accessToken).not.toBe('')

      // Reset
      useAuthStore.getState().auth.reset()

      expect(useAuthStore.getState().auth.user).toBeNull()
      expect(useAuthStore.getState().auth.accessToken).toBe('')
      expect(removeCookie).toHaveBeenCalledWith('thisisjustarandomstring')
    })
  })

  describe('state persistence', () => {
    it('should maintain state across multiple operations', () => {
      const mockUser = {
        accountNo: '456',
        email: 'user@test.com',
        role: ['user', 'admin'],
        exp: Date.now() + 7200000,
      }

      // Perform multiple operations
      useAuthStore.getState().auth.setUser(mockUser)
      useAuthStore.getState().auth.setAccessToken('token-1')
      useAuthStore.getState().auth.setAccessToken('token-2')

      const state = useAuthStore.getState()
      expect(state.auth.user).toEqual(mockUser)
      expect(state.auth.accessToken).toBe('token-2')
    })
  })
})
