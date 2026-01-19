import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth, deleteUser } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const analytics =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !!firebaseConfig.measurementId
    ? getAnalytics(app)
    : null
export const db = getDatabase(app)
export async function deleteCurrentUser() {
  const u = auth.currentUser
  if (u) {
    await deleteUser(u)
  }
}
if (typeof window !== 'undefined') {
  ;(window as unknown as { __deleteCurrentUser?: () => Promise<void> }).__deleteCurrentUser =
    deleteCurrentUser
}
