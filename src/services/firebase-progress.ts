import { db } from '@/lib/firebase'
import { ref, onValue, update, get } from 'firebase/database'
import type { UserProgress, ExamProgress, QuestionProgress } from './progress-service'
import { toast } from 'sonner'

const BASE = 'examtopics_progress'

export function subscribeExamProgress(
  userId: string,
  examId: string,
  onChange: (progress: ExamProgress) => void
) {
  const r = ref(db, `${BASE}/${userId}/${examId}`)
  const unsubscribe = onValue(r, (snap) => {
    const val = snap.val() as ExamProgress | null
    onChange(val || {})
  })
  return () => unsubscribe()
}

export async function getUserProgress(userId: string): Promise<UserProgress> {
  const r = ref(db, `${BASE}/${userId}`)
  const snap = await get(r)
  const val = snap.val() as UserProgress | null
  return val || {}
}

export async function saveAnswer(
  userId: string,
  examId: string,
  questionId: string,
  status: 'correct' | 'incorrect' | 'skipped',
  userSelection?: number[],
  prev?: QuestionProgress
) {
  const now = Date.now()
  const consecutiveCorrect =
    status === 'correct' ? ((prev?.consecutiveCorrect || 0) + 1) : 0
  const timesWrong =
    status === 'incorrect' ? ((prev?.timesWrong || 0) + 1) : (prev?.timesWrong || 0)

  try {
    await update(ref(db, `${BASE}/${userId}/${examId}/${questionId}`), {
      status,
      lastAnswered: now,
      userSelection: userSelection ?? prev?.userSelection ?? null,
      consecutiveCorrect,
      timesWrong,
    })
  } catch {
    toast.error('Failed to sync answer to cloud')
  }
}

export async function toggleBookmark(
  userId: string,
  examId: string,
  questionId: string,
  newState: boolean
) {
  try {
    await update(ref(db, `${BASE}/${userId}/${examId}/${questionId}`), {
      bookmarked: newState,
    })
  } catch {
    toast.error('Failed to sync bookmark to cloud')
  }
}

export async function clearExamProgress(userId: string, examId: string) {
  const r = ref(db, `${BASE}/${userId}/${examId}`)
  const snap = await get(r)
  const exam = (snap.val() as ExamProgress | null) || {}
  const updates: Record<string, unknown> = {}
  Object.keys(exam).forEach((qId) => {
    const basePath = `${BASE}/${userId}/${examId}/${qId}`
    updates[`${basePath}/status`] = null
    updates[`${basePath}/lastAnswered`] = null
    updates[`${basePath}/consecutiveCorrect`] = null
    updates[`${basePath}/userSelection`] = null
    // bookmarked preserved
  })
  if (Object.keys(updates).length > 0) {
    try {
      await update(ref(db), updates)
    } catch {
      toast.error('Failed to clear cloud progress')
    }
  }
}

export async function mergeLocalIntoRemote(
  userId: string,
  local: UserProgress
) {
  const updates: Record<string, unknown> = {}
  Object.entries(local).forEach(([examId, exam]) => {
    Object.entries(exam).forEach(([qId, q]) => {
      const base = `${BASE}/${userId}/${examId}/${qId}`
      Object.entries(q).forEach(([k, v]) => {
        updates[`${base}/${k}`] = v ?? null
      })
    })
  })
  if (Object.keys(updates).length > 0) {
    try {
      await update(ref(db), updates)
    } catch {
      toast.error('Failed to push merged progress to cloud')
    }
  }
}
