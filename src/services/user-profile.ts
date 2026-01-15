import { db } from '@/lib/firebase'
import { get, ref, update } from 'firebase/database'

export type UserProfileData = {
  username?: string
  bio?: string
  urls?: { value: string }[]
}

const BASE = 'users'
const PROFILE = 'profile'

export async function getUserProfile(userId: string): Promise<UserProfileData> {
  const r = ref(db, `${BASE}/${userId}/${PROFILE}`)
  const snap = await get(r)
  const val = (snap.val() as UserProfileData | null) || {}
  return val
}

export async function saveUserProfile(userId: string, data: UserProfileData) {
  await update(ref(db, `${BASE}/${userId}/${PROFILE}`), data)
}
