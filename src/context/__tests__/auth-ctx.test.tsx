import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, renderHook } from '@testing-library/react'
import { AuthContext, useAuth } from '../auth-ctx'

describe('auth-ctx', () => {
  afterEach(() => {
    cleanup()
  })

  describe('useAuth', () => {
    it('should throw error when used outside AuthProvider', () => {
      // renderHook will catch the error
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should return context value when inside provider', () => {
      const mockContextValue = {
        user: null,
        guestId: 'test-guest-id',
        loading: false,
        logout: async () => {},
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContextValue}>
          {children}
        </AuthContext.Provider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.guestId).toBe('test-guest-id')
      expect(result.current.loading).toBe(false)
      expect(typeof result.current.logout).toBe('function')
    })
  })

  describe('AuthContext', () => {
    it('should have undefined as default value', () => {
      // Just render the context consumer to verify it doesn't throw
      render(
        <AuthContext.Consumer>
          {(value) => (
            <div data-testid="context-value">
              {value === undefined ? 'undefined' : 'defined'}
            </div>
          )}
        </AuthContext.Consumer>
      )

      expect(screen.getByTestId('context-value')).toHaveTextContent('undefined')
    })

    it('should provide value when Provider is used', () => {
      const mockValue = {
        user: { uid: 'test-123' } as any,
        guestId: 'guest-456',
        loading: true,
        logout: async () => {},
      }

      render(
        <AuthContext.Provider value={mockValue}>
          <AuthContext.Consumer>
            {(value) => (
              <>
                <span data-testid="user-uid">{value?.user?.uid}</span>
                <span data-testid="guest-id">{value?.guestId}</span>
                <span data-testid="loading">{value?.loading?.toString()}</span>
              </>
            )}
          </AuthContext.Consumer>
        </AuthContext.Provider>
      )

      expect(screen.getByTestId('user-uid')).toHaveTextContent('test-123')
      expect(screen.getByTestId('guest-id')).toHaveTextContent('guest-456')
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })
  })
})
