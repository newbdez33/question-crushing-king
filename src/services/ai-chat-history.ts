export interface StoredChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatEntry {
  messages: StoredChatMessage[]
  updatedAt: number
}

// { [userId]: { [examId]: { [questionId]: ChatEntry } } }
type AllChats = Record<string, Record<string, Record<string, ChatEntry>>>

const STORAGE_KEY = 'examtopics_ai_chat'
const MAX_QUESTIONS_PER_USER = 50

function readAll(): AllChats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AllChats) : {}
  } catch {
    return {}
  }
}

function writeAll(data: AllChats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable or over quota — chat history is best-effort.
  }
}

function removeEntry(
  all: AllChats,
  userId: string,
  examId: string,
  questionId: string
): boolean {
  const exam = all[userId]?.[examId]
  if (!exam?.[questionId]) return false
  delete exam[questionId]
  if (Object.keys(exam).length === 0) delete all[userId][examId]
  return true
}

// Drop the least-recently-updated conversations so a single user never keeps
// more than MAX_QUESTIONS_PER_USER stored threads.
function enforceCap(user: Record<string, Record<string, ChatEntry>>) {
  const entries: { examId: string; questionId: string; updatedAt: number }[] = []
  for (const examId of Object.keys(user)) {
    for (const questionId of Object.keys(user[examId])) {
      entries.push({
        examId,
        questionId,
        updatedAt: user[examId][questionId].updatedAt,
      })
    }
  }
  if (entries.length <= MAX_QUESTIONS_PER_USER) return
  entries.sort((a, b) => a.updatedAt - b.updatedAt)
  for (const { examId, questionId } of entries.slice(
    0,
    entries.length - MAX_QUESTIONS_PER_USER
  )) {
    delete user[examId][questionId]
    if (Object.keys(user[examId]).length === 0) delete user[examId]
  }
}

export const AiChatHistoryService = {
  get(userId: string, examId: string, questionId: string): StoredChatMessage[] {
    return readAll()[userId]?.[examId]?.[questionId]?.messages ?? []
  },

  save(
    userId: string,
    examId: string,
    questionId: string,
    messages: StoredChatMessage[],
    now: number
  ) {
    const all = readAll()
    // An empty thread is treated as a clear — never persist empty conversations.
    if (messages.length === 0) {
      if (removeEntry(all, userId, examId, questionId)) writeAll(all)
      return
    }
    if (!all[userId]) all[userId] = {}
    const user = all[userId]
    if (!user[examId]) user[examId] = {}
    user[examId][questionId] = { messages, updatedAt: now }
    enforceCap(user)
    writeAll(all)
  },

  clear(userId: string, examId: string, questionId: string) {
    const all = readAll()
    if (removeEntry(all, userId, examId, questionId)) writeAll(all)
  },
}
