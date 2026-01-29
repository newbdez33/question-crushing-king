import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProgressService, type ExamProgress } from '../progress-service'

// Mock localStorage
const memoryStorage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memoryStorage.get(k) ?? null,
  setItem: (k: string, v: string) => memoryStorage.set(k, String(v)),
  removeItem: (k: string) => memoryStorage.delete(k),
  clear: () => memoryStorage.clear(),
})

describe('ProgressService', () => {
  beforeEach(() => {
    memoryStorage.clear()
  })

  describe('mergeRemoteExamProgress', () => {
    it('should merge remote progress into empty localStorage', () => {
      const userId = 'user-1'
      const examId = 'exam-1'
      const remote: ExamProgress = {
        q1: {
          status: 'correct',
          consecutiveCorrect: 2,
          lastAnswered: 1000,
        },
      }

      ProgressService.mergeRemoteExamProgress(userId, examId, remote)

      const result = ProgressService.getExamProgress(userId, examId)
      expect(result.q1).toEqual({
        status: 'correct',
        consecutiveCorrect: 2,
        lastAnswered: 1000,
      })
    })

    it('should update localStorage with newer remote data', () => {
      const userId = 'user-1'
      const examId = 'exam-1'

      // Set up local data with older timestamp
      const localData = {
        [userId]: {
          [examId]: {
            q1: {
              status: 'incorrect' as const,
              consecutiveCorrect: 0,
              lastAnswered: 1000,
            },
          },
        },
      }
      memoryStorage.set('examtopics_progress', JSON.stringify(localData))

      // Remote has newer data
      const remote: ExamProgress = {
        q1: {
          status: 'correct',
          consecutiveCorrect: 3,
          lastAnswered: 2000, // Newer timestamp
        },
      }

      ProgressService.mergeRemoteExamProgress(userId, examId, remote)

      const result = ProgressService.getExamProgress(userId, examId)
      expect(result.q1?.consecutiveCorrect).toBe(3)
      expect(result.q1?.status).toBe('correct')
    })

    it('should NOT overwrite localStorage with older remote data', () => {
      const userId = 'user-1'
      const examId = 'exam-1'

      // Set up local data with newer timestamp
      const localData = {
        [userId]: {
          [examId]: {
            q1: {
              status: 'correct' as const,
              consecutiveCorrect: 5,
              lastAnswered: 3000, // Newer timestamp
            },
          },
        },
      }
      memoryStorage.set('examtopics_progress', JSON.stringify(localData))

      // Remote has older data
      const remote: ExamProgress = {
        q1: {
          status: 'incorrect',
          consecutiveCorrect: 0,
          lastAnswered: 1000, // Older timestamp
        },
      }

      ProgressService.mergeRemoteExamProgress(userId, examId, remote)

      const result = ProgressService.getExamProgress(userId, examId)
      expect(result.q1?.consecutiveCorrect).toBe(5) // Should keep local value
      expect(result.q1?.status).toBe('correct')
    })

    it('should merge multiple questions correctly', () => {
      const userId = 'user-1'
      const examId = 'exam-1'

      // Local has q1 newer, q2 older
      const localData = {
        [userId]: {
          [examId]: {
            q1: {
              status: 'correct' as const,
              consecutiveCorrect: 3,
              lastAnswered: 5000,
            },
            q2: {
              status: 'incorrect' as const,
              consecutiveCorrect: 0,
              lastAnswered: 1000,
            },
          },
        },
      }
      memoryStorage.set('examtopics_progress', JSON.stringify(localData))

      // Remote has q1 older, q2 newer, q3 new
      const remote: ExamProgress = {
        q1: {
          status: 'incorrect',
          consecutiveCorrect: 0,
          lastAnswered: 1000,
        },
        q2: {
          status: 'correct',
          consecutiveCorrect: 2,
          lastAnswered: 3000,
        },
        q3: {
          status: 'correct',
          consecutiveCorrect: 1,
          lastAnswered: 2000,
        },
      }

      ProgressService.mergeRemoteExamProgress(userId, examId, remote)

      const result = ProgressService.getExamProgress(userId, examId)
      // q1: local is newer, should keep local
      expect(result.q1?.consecutiveCorrect).toBe(3)
      // q2: remote is newer, should use remote
      expect(result.q2?.consecutiveCorrect).toBe(2)
      // q3: new from remote, should be added
      expect(result.q3?.consecutiveCorrect).toBe(1)
    })

    it('should preserve bookmarked status when merging', () => {
      const userId = 'user-1'
      const examId = 'exam-1'

      // Local has bookmark
      const localData = {
        [userId]: {
          [examId]: {
            q1: {
              status: 'incorrect' as const,
              consecutiveCorrect: 0,
              lastAnswered: 1000,
              bookmarked: true,
            },
          },
        },
      }
      memoryStorage.set('examtopics_progress', JSON.stringify(localData))

      // Remote has newer answer data but no bookmark field
      const remote: ExamProgress = {
        q1: {
          status: 'correct',
          consecutiveCorrect: 2,
          lastAnswered: 2000,
        },
      }

      ProgressService.mergeRemoteExamProgress(userId, examId, remote)

      const result = ProgressService.getExamProgress(userId, examId)
      // Should merge remote data
      expect(result.q1?.consecutiveCorrect).toBe(2)
      // Should preserve local bookmark
      expect(result.q1?.bookmarked).toBe(true)
    })

    it('should correctly sync consecutiveCorrect for cross-device usage', () => {
      const userId = 'user-1'
      const examId = 'exam-1'

      // Simulate Device A answered q1 correctly twice
      // This data arrives via Firebase to Device B
      const remoteFromDeviceA: ExamProgress = {
        q1: {
          status: 'correct',
          consecutiveCorrect: 2,
          lastAnswered: 2000,
          timesWrong: 1,
        },
      }

      // Device B has no local data for this question
      ProgressService.mergeRemoteExamProgress(userId, examId, remoteFromDeviceA)

      // Now Device B should have the correct consecutiveCorrect
      const progress = ProgressService.getExamProgress(userId, examId)
      expect(progress.q1?.consecutiveCorrect).toBe(2)

      // Simulate Device B answering correctly - should increment to 3
      ProgressService.saveAnswer(userId, examId, 'q1', 'correct', [0], true)

      const updated = ProgressService.getExamProgress(userId, examId)
      expect(updated.q1?.consecutiveCorrect).toBe(3)
    })
  })
})
