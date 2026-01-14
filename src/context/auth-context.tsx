import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ProgressService } from '@/services/progress-service'
import { mergeLocalIntoRemote } from '@/services/firebase-progress'

interface AuthContextType {
  user: User | null
  guestId: string
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const GUEST_ID_KEY = 'examtopics_guest_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestId] = useState<string>(() => {
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
        if (guestId) {
          ProgressService.mergeProgress(guestId, currentUser.uid)
          const merged = ProgressService.getUserProgress(currentUser.uid)
          void mergeLocalIntoRemote(currentUser.uid, merged)
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
