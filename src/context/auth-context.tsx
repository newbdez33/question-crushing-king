import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ProgressService } from '@/services/progress-service'

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
  const [guestId, setGuestId] = useState<string>('')

  useEffect(() => {
    // Initialize Guest ID
    let storedGuestId = localStorage.getItem(GUEST_ID_KEY)
    if (!storedGuestId) {
      storedGuestId = crypto.randomUUID()
      localStorage.setItem(GUEST_ID_KEY, storedGuestId)
    }
    setGuestId(storedGuestId)

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User just logged in or session restored
        // Merge guest progress into user progress
        if (storedGuestId) {
          ProgressService.mergeProgress(storedGuestId, currentUser.uid)
        }
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
