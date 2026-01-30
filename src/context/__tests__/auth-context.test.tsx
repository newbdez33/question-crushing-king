import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../auth-context'
import { useAuth } from '../auth-ctx'

// Mock Firebase auth
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChanged = vi.fn((_auth, callback) => {
  // Simulate initial auth check - no user logged in
  callback(null)
  return mockUnsubscribe
})
const mockSignOut = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) =>
    mockOnAuthStateChanged(_auth, callback),
  signOut: () => mockSignOut(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: {},
}))

// Mock progress service
vi.mock('@/services/progress-service', () => ({
  ProgressService: {
    mergeProgress: vi.fn(),
    getUserProgress: vi.fn().mockReturnValue({}),
    mergeSettings: vi.fn(),
    getUserSettings: vi.fn().mockReturnValue({}),
    saveUserSettings: vi.fn(),
  },
}))

// Mock firebase progress
vi.mock('@/services/firebase-progress', () => ({
  mergeLocalIntoRemote: vi.fn().mockResolvedValue(undefined),
  mergeLocalSettingsIntoRemote: vi.fn().mockResolvedValue(undefined),
  getUserSettings: vi.fn().mockResolvedValue({}),
}))

function TestComponent() {
  const { user, guestId, loading, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="guest-id">{guestId}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset to default behavior
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('should provide auth context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
  })

  it('should generate guest ID if not exists', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('guest-id')).not.toBeEmptyDOMElement()
    })

    // Check localStorage was updated
    const storedGuestId = localStorage.getItem('examtopics_guest_id')
    expect(storedGuestId).toBeTruthy()
  })

  it('should use existing guest ID from localStorage', async () => {
    const existingGuestId = 'existing-guest-123'
    localStorage.setItem('examtopics_guest_id', existingGuestId)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('guest-id')).toHaveTextContent(existingGuestId)
    })
  })

  it('should show logged out state initially', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('logged-out')
    })
  })

  it('should call logout function', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should update user state when auth changes', async () => {
    const mockUser = { uid: 'test-user-123' }
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      // First call with user logged in
      callback(mockUser)
      return mockUnsubscribe
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('logged-in')
    })
  })

  it('should clean up subscription on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
