import { describe, it, expect, beforeEach } from 'vitest'

const store = new Map<string, string>()
const localStorageMock: Storage = {
  get length() {
    return store.size
  },
  clear: () => store.clear(),
  getItem: (k) => (store.has(k) ? store.get(k)! : null),
  key: (i) => Array.from(store.keys())[i] ?? null,
  removeItem: (k) => void store.delete(k),
  setItem: (k, v) => void store.set(k, String(v)),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

const { AiChatHistoryService } = await import('../ai-chat-history')

const U = 'user-1'
const E = 'exam-a'
const Q = 'q-1'
const msgs = (tag: string) => [
  { id: 'u1', role: 'user' as const, content: `ask ${tag}` },
  { id: 'a1', role: 'assistant' as const, content: `answer ${tag}` },
]

beforeEach(() => {
  store.clear()
})

describe('AiChatHistoryService', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(AiChatHistoryService.get(U, E, Q)).toEqual([])
  })

  it('round-trips saved messages', () => {
    AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
    expect(AiChatHistoryService.get(U, E, Q)).toEqual(msgs('x'))
  })

  it('scopes storage by user, exam, and question', () => {
    AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
    expect(AiChatHistoryService.get('other-user', E, Q)).toEqual([])
    expect(AiChatHistoryService.get(U, 'other-exam', Q)).toEqual([])
    expect(AiChatHistoryService.get(U, E, 'other-q')).toEqual([])
  })

  it('overwrites an existing thread on re-save', () => {
    AiChatHistoryService.save(U, E, Q, msgs('one'), 1)
    AiChatHistoryService.save(U, E, Q, msgs('two'), 2)
    expect(AiChatHistoryService.get(U, E, Q)).toEqual(msgs('two'))
  })

  it('treats an empty save as a clear', () => {
    AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
    AiChatHistoryService.save(U, E, Q, [], 2)
    expect(AiChatHistoryService.get(U, E, Q)).toEqual([])
  })

  it('clear() removes a stored thread', () => {
    AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
    AiChatHistoryService.clear(U, E, Q)
    expect(AiChatHistoryService.get(U, E, Q)).toEqual([])
  })

  it('caps stored questions per user, evicting the least-recently-updated', () => {
    for (let i = 1; i <= 51; i++) {
      AiChatHistoryService.save(U, E, `q-${i}`, msgs(String(i)), i)
    }
    expect(AiChatHistoryService.get(U, E, 'q-1')).toEqual([]) // oldest evicted
    expect(AiChatHistoryService.get(U, E, 'q-2')).toEqual(msgs('2'))
    expect(AiChatHistoryService.get(U, E, 'q-51')).toEqual(msgs('51'))
  })

  it('cap uses recency (updatedAt), not insertion order', () => {
    for (let i = 1; i <= 50; i++) {
      AiChatHistoryService.save(U, E, `q-${i}`, msgs(String(i)), i)
    }
    AiChatHistoryService.save(U, E, 'q-1', msgs('1-updated'), 100) // touch q-1
    AiChatHistoryService.save(U, E, 'q-51', msgs('51'), 101) // evicts now-oldest q-2
    expect(AiChatHistoryService.get(U, E, 'q-2')).toEqual([])
    expect(AiChatHistoryService.get(U, E, 'q-1')).toEqual(msgs('1-updated'))
    expect(AiChatHistoryService.get(U, E, 'q-51')).toEqual(msgs('51'))
  })

  it('caps across exams for the same user', () => {
    for (let i = 1; i <= 51; i++) {
      const exam = i % 2 === 0 ? 'exam-a' : 'exam-b'
      AiChatHistoryService.save(U, exam, `q-${i}`, msgs(String(i)), i)
    }
    expect(AiChatHistoryService.get(U, 'exam-b', 'q-1')).toEqual([]) // global oldest
  })

  it('recovers from malformed stored JSON', () => {
    store.set('examtopics_ai_chat', 'not json{')
    expect(AiChatHistoryService.get(U, E, Q)).toEqual([])
    AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
    expect(AiChatHistoryService.get(U, E, Q)).toEqual(msgs('x'))
  })

  it('does not throw when persistence fails (e.g. over quota)', () => {
    const original = localStorageMock.setItem
    localStorageMock.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    try {
      expect(() =>
        AiChatHistoryService.save(U, E, Q, msgs('x'), 1)
      ).not.toThrow()
    } finally {
      localStorageMock.setItem = original
    }
  })
})
