import { get, ref, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { AiSettings } from './ai-settings'

const FIREBASE_PATH = 'examtopics_ai_settings'

export async function fetchRemoteAiSettings(
  userUid: string
): Promise<Partial<AiSettings> | null> {
  const snap = await get(ref(db, `${FIREBASE_PATH}/${userUid}`))
  const val = snap.val() as Partial<AiSettings> | null
  return val
}

export async function saveRemoteAiSettings(
  userUid: string,
  settings: AiSettings
) {
  await update(ref(db, `${FIREBASE_PATH}/${userUid}`), settings)
}
