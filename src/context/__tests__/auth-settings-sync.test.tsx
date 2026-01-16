import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AuthProvider } from '../auth-context'

vi.stubGlobal('crypto', {
  randomUUID: () => 'guest-uuid',
} as any)

const memoryStorage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (memoryStorage.has(k) ? memoryStorage.get(k)! : null),
  setItem: (k: string, v: string) => {
    memoryStorage.set(k, String(v))
  },
  removeItem: (k: string) => {
    memoryStorage.delete(k)
  },
} as any)

vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: (_auth: unknown, cb: (u: any) => void) => {
      cb({ uid: 'u1' })
      return () => {}
    },
    getAuth: () => ({}),
    initializeAuth: () => ({}),
    signOut: vi.fn(),
  }
})

vi.mock('@/services/firebase-progress', () => {
  return {
    mergeLocalIntoRemote: vi.fn(async () => {}),
    mergeLocalSettingsIntoRemote: vi.fn(async () => {}),
    getUserSettings: vi.fn(async () => ({ 'SOA-C03': { owned: true } })),
  }
})

vi.mock('@/services/progress-service', () => {
  return {
    ProgressService: {
      mergeProgress: vi.fn(() => {}),
      getUserProgress: vi.fn(() => ({})),
      mergeSettings: vi.fn(() => {}),
      getUserSettings: vi.fn(() => ({ 'SOA-C03': { owned: true } })),
      saveUserSettings: vi.fn(() => {}),
    },
  }
})

describe('Auth settings sync on login', () => {
  it('merges guest settings, pushes to cloud, hydrates local from cloud', async () => {
    localStorage.setItem('examtopics_guest_id', 'guest-uuid')
    render(<AuthProvider><div /></AuthProvider>)

    const Remote = await import('@/services/firebase-progress')
    const Local = await import('@/services/progress-service')

    expect(Local.ProgressService.mergeSettings).toHaveBeenCalledWith('guest-uuid', 'u1')
    expect(Remote.mergeLocalSettingsIntoRemote).toHaveBeenCalledWith('u1', { 'SOA-C03': { owned: true } })
    expect(Remote.getUserSettings).toHaveBeenCalledWith('u1')
    expect(Local.ProgressService.saveUserSettings).toHaveBeenCalledWith('u1', { 'SOA-C03': { owned: true } })
  })
})
