import { useEffect, useState, type ReactNode } from 'react'
import {
  mergeLocalIntoRemote,
  mergeLocalSettingsIntoRemote,
  getUserSettings as getRemoteUserSettings,
} from '@/services/firebase-progress'
import { ProgressService } from '@/services/progress-service'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthContext } from './auth-ctx'

const GUEST_ID_KEY = 'examtopics_guest_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestId] = useState<string>(() => {
    /* istanbul ignore if -- SSR check */
    if (typeof window === 'undefined') return ''
    let storedGuestId = localStorage.getItem(GUEST_ID_KEY)
    if (!storedGuestId) {
      storedGuestId = crypto.randomUUID()
      localStorage.setItem(GUEST_ID_KEY, storedGuestId)
    }
    return storedGuestId
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        /* istanbul ignore if -- guestId always exists in browser */
        if (guestId) {
          ProgressService.mergeProgress(guestId, currentUser.uid)
          const merged = ProgressService.getUserProgress(currentUser.uid)
          void mergeLocalIntoRemote(currentUser.uid, merged)
          ProgressService.mergeSettings(guestId, currentUser.uid)
          const localSettings = ProgressService.getUserSettings(currentUser.uid)
          void mergeLocalSettingsIntoRemote(currentUser.uid, localSettings)
          void getRemoteUserSettings(currentUser.uid).then((remote) => {
            ProgressService.saveUserSettings(currentUser.uid, remote)
          })
        }
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [guestId])

  const logout = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, guestId, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export {}
