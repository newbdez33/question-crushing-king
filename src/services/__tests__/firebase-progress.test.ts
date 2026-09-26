import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onValue } from 'firebase/database'
import { subscribeExamProgress } from '../firebase-progress'

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  onValue: vi.fn(() => () => {}),
  get: vi.fn(),
  update: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}))

const mockOnValue = vi.mocked(onValue)

describe('subscribeExamProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delivers snapshots to onChange', () => {
    const onChange = vi.fn()
    subscribeExamProgress('user-1', 'exam-1', onChange)

    const [, onSnapshot] = mockOnValue.mock.calls[0]
    onSnapshot({ val: () => ({ q1: { status: 'correct' } }) } as never)

    expect(onChange).toHaveBeenCalledWith({ q1: { status: 'correct' } })
  })

  it('forwards subscription errors to onError', () => {
    const onError = vi.fn()
    subscribeExamProgress('user-1', 'exam-1', vi.fn(), onError)

    const cancel = mockOnValue.mock.calls[0][2] as (error: Error) => void
    expect(typeof cancel).toBe('function')

    const error = new Error('permission_denied')
    cancel(error)
    expect(onError).toHaveBeenCalledWith(error)
  })
})
