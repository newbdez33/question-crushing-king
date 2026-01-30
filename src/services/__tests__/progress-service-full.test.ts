import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProgressService } from '../progress-service'

describe('ProgressService - Full Coverage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('getAllProgress', () => {
    it('should return empty object when localStorage is empty', () => {
      expect(ProgressService.getAllProgress()).toEqual({})
    })

    it('should return parsed data from localStorage', () => {
      const data = { user1: { exam1: { q1: { status: 'correct' } } } }
      localStorage.setItem('examtopics_progress', JSON.stringify(data))
      expect(ProgressService.getAllProgress()).toEqual(data)
    })

    it('should return empty object on parse error', () => {
      localStorage.setItem('examtopics_progress', 'invalid json')
      expect(ProgressService.getAllProgress()).toEqual({})
    })
  })

  describe('getUserProgress', () => {
    it('should return empty object for non-existent user', () => {
      expect(ProgressService.getUserProgress('nonexistent')).toEqual({})
    })

    it('should return user progress when exists', () => {
      const data = { user1: { exam1: { q1: { status: 'correct' } } } }
      localStorage.setItem('examtopics_progress', JSON.stringify(data))
      expect(ProgressService.getUserProgress('user1')).toEqual({ exam1: { q1: { status: 'correct' } } })
    })
  })

  describe('getExamProgress', () => {
    it('should return empty object for non-existent exam', () => {
      expect(ProgressService.getExamProgress('user1', 'exam1')).toEqual({})
    })

    it('should return exam progress when exists', () => {
      const data = { user1: { exam1: { q1: { status: 'correct' } } } }
      localStorage.setItem('examtopics_progress', JSON.stringify(data))
      expect(ProgressService.getExamProgress('user1', 'exam1')).toEqual({ q1: { status: 'correct' } })
    })
  })

  describe('getAllSettings', () => {
    it('should return empty object when localStorage is empty', () => {
      expect(ProgressService.getAllSettings()).toEqual({})
    })

    it('should return parsed settings from localStorage', () => {
      const data = { user1: { exam1: { mistakesConsecutiveCorrect: 3 } } }
      localStorage.setItem('examtopics_settings', JSON.stringify(data))
      expect(ProgressService.getAllSettings()).toEqual(data)
    })

    it('should return empty object on parse error', () => {
      localStorage.setItem('examtopics_settings', 'invalid json')
      expect(ProgressService.getAllSettings()).toEqual({})
    })
  })

  describe('getUserSettings', () => {
    it('should return empty object for non-existent user', () => {
      expect(ProgressService.getUserSettings('nonexistent')).toEqual({})
    })

    it('should return user settings when exists', () => {
      const data = { user1: { exam1: { mistakesConsecutiveCorrect: 3 } } }
      localStorage.setItem('examtopics_settings', JSON.stringify(data))
      expect(ProgressService.getUserSettings('user1')).toEqual({ exam1: { mistakesConsecutiveCorrect: 3 } })
    })
  })

  describe('getExamSettings', () => {
    it('should return empty object for non-existent exam', () => {
      expect(ProgressService.getExamSettings('user1', 'exam1')).toEqual({})
    })

    it('should return exam settings when exists', () => {
      const data = { user1: { exam1: { mistakesConsecutiveCorrect: 3 } } }
      localStorage.setItem('examtopics_settings', JSON.stringify(data))
      expect(ProgressService.getExamSettings('user1', 'exam1')).toEqual({ mistakesConsecutiveCorrect: 3 })
    })
  })

  describe('saveAnswer', () => {
    it('should save correct answer and increment consecutiveCorrect', () => {
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0])

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBe('correct')
      expect(progress.q1?.consecutiveCorrect).toBe(1)
      expect(progress.q1?.userSelection).toEqual([0])
      expect(progress.q1?.lastAnswered).toBeDefined()
    })

    it('should reset consecutiveCorrect on incorrect answer', () => {
      // First answer correctly twice
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0])
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0])

      let progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.consecutiveCorrect).toBe(2)

      // Then answer incorrectly
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'incorrect', [1])

      progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.consecutiveCorrect).toBe(0)
      expect(progress.q1?.timesWrong).toBe(1)
    })

    it('should increment timesWrong on incorrect answer', () => {
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'incorrect', [1])
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'incorrect', [2])

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.timesWrong).toBe(2)
    })

    it('should handle skipped status', () => {
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'skipped')

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBe('skipped')
      expect(progress.q1?.consecutiveCorrect).toBe(0)
    })

    it('should use isCorrectAttempt parameter when provided', () => {
      // Status is correct but isCorrectAttempt is false
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0], false)

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBe('correct')
      expect(progress.q1?.consecutiveCorrect).toBe(0) // Should not increment
      expect(progress.q1?.timesWrong).toBe(1)
    })

    it('should reset timesWrong when option is provided', () => {
      // First get some wrong answers
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'incorrect', [1])
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'incorrect', [2])

      let progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.timesWrong).toBe(2)

      // Now answer correctly with reset option
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0], true, { resetTimesWrong: true })

      progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.timesWrong).toBe(0)
    })

    it('should handle undefined userSelection', () => {
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct')

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.userSelection).toBeUndefined()
    })

    it('should create nested structure if not exists', () => {
      ProgressService.saveAnswer('newuser', 'newexam', 'q1', 'correct', [0])

      const progress = ProgressService.getExamProgress('newuser', 'newexam')
      expect(progress.q1).toBeDefined()
    })
  })

  describe('saveExamSettings', () => {
    it('should save exam settings', () => {
      ProgressService.saveExamSettings('user1', 'exam1', { mistakesConsecutiveCorrect: 3 })

      const settings = ProgressService.getExamSettings('user1', 'exam1')
      expect(settings.mistakesConsecutiveCorrect).toBe(3)
    })

    it('should merge with existing settings', () => {
      ProgressService.saveExamSettings('user1', 'exam1', { mistakesConsecutiveCorrect: 3 })
      ProgressService.saveExamSettings('user1', 'exam1', { owned: true })

      const settings = ProgressService.getExamSettings('user1', 'exam1')
      expect(settings.mistakesConsecutiveCorrect).toBe(3)
      expect(settings.owned).toBe(true)
    })

    it('should create user settings if not exists', () => {
      ProgressService.saveExamSettings('newuser', 'exam1', { owned: true })

      const settings = ProgressService.getExamSettings('newuser', 'exam1')
      expect(settings.owned).toBe(true)
    })
  })

  describe('saveUserSettings', () => {
    it('should save user settings', () => {
      ProgressService.saveUserSettings('user1', { exam1: { owned: true } })

      const settings = ProgressService.getUserSettings('user1')
      expect(settings.exam1?.owned).toBe(true)
    })

    it('should merge with existing user settings', () => {
      ProgressService.saveUserSettings('user1', { exam1: { owned: true } })
      ProgressService.saveUserSettings('user1', { exam2: { mistakesConsecutiveCorrect: 5 } })

      const settings = ProgressService.getUserSettings('user1')
      expect(settings.exam1?.owned).toBe(true)
      expect(settings.exam2?.mistakesConsecutiveCorrect).toBe(5)
    })
  })

  describe('clearExamProgress', () => {
    it('should clear answer-related data but keep bookmarks', () => {
      // Set up progress with answer and bookmark
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct', [0])
      ProgressService.toggleBookmark('user1', 'exam1', 'q1')

      let progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBe('correct')
      expect(progress.q1?.bookmarked).toBe(true)

      // Clear progress
      ProgressService.clearExamProgress('user1', 'exam1')

      progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBeUndefined()
      expect(progress.q1?.lastAnswered).toBeUndefined()
      expect(progress.q1?.consecutiveCorrect).toBeUndefined()
      expect(progress.q1?.userSelection).toBeUndefined()
      expect(progress.q1?.bookmarked).toBe(true) // Should be kept
    })

    it('should do nothing for non-existent user', () => {
      expect(() => ProgressService.clearExamProgress('nonexistent', 'exam1')).not.toThrow()
    })

    it('should do nothing for non-existent exam', () => {
      ProgressService.saveAnswer('user1', 'exam1', 'q1', 'correct')
      expect(() => ProgressService.clearExamProgress('user1', 'nonexistent')).not.toThrow()

      // Original data should be unchanged
      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.status).toBe('correct')
    })
  })

  describe('toggleBookmark', () => {
    it('should set bookmark to true when not set', () => {
      ProgressService.toggleBookmark('user1', 'exam1', 'q1')

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.bookmarked).toBe(true)
    })

    it('should toggle bookmark from true to false', () => {
      ProgressService.toggleBookmark('user1', 'exam1', 'q1')
      ProgressService.toggleBookmark('user1', 'exam1', 'q1')

      const progress = ProgressService.getExamProgress('user1', 'exam1')
      expect(progress.q1?.bookmarked).toBe(false)
    })

    it('should create nested structure if not exists', () => {
      ProgressService.toggleBookmark('newuser', 'newexam', 'q1')

      const progress = ProgressService.getExamProgress('newuser', 'newexam')
      expect(progress.q1?.bookmarked).toBe(true)
    })
  })

  describe('mergeProgress', () => {
    it('should merge source user progress into target user', () => {
      // Source user has progress
      ProgressService.saveAnswer('source', 'exam1', 'q1', 'correct', [0])
      ProgressService.toggleBookmark('source', 'exam1', 'q1')

      // Merge to target
      ProgressService.mergeProgress('source', 'target')

      const targetProgress = ProgressService.getExamProgress('target', 'exam1')
      expect(targetProgress.q1?.status).toBe('correct')
    })

    it('should do nothing if source user does not exist', () => {
      ProgressService.saveAnswer('target', 'exam1', 'q1', 'correct', [0])

      ProgressService.mergeProgress('nonexistent', 'target')

      const targetProgress = ProgressService.getExamProgress('target', 'exam1')
      expect(targetProgress.q1?.status).toBe('correct')
    })

    it('should use OR logic for bookmarks', () => {
      // Source has bookmark
      ProgressService.toggleBookmark('source', 'exam1', 'q1')

      // Target does not have bookmark
      ProgressService.saveAnswer('target', 'exam1', 'q1', 'correct', [0])

      ProgressService.mergeProgress('source', 'target')

      const targetProgress = ProgressService.getExamProgress('target', 'exam1')
      expect(targetProgress.q1?.bookmarked).toBe(true)
    })

    it('should merge multiple exams', () => {
      ProgressService.saveAnswer('source', 'exam1', 'q1', 'correct', [0])
      ProgressService.saveAnswer('source', 'exam2', 'q1', 'incorrect', [1])

      ProgressService.mergeProgress('source', 'target')

      expect(ProgressService.getExamProgress('target', 'exam1').q1?.status).toBe('correct')
      expect(ProgressService.getExamProgress('target', 'exam2').q1?.status).toBe('incorrect')
    })

    it('should create target user if not exists', () => {
      ProgressService.saveAnswer('source', 'exam1', 'q1', 'correct', [0])

      ProgressService.mergeProgress('source', 'newtarget')

      const progress = ProgressService.getExamProgress('newtarget', 'exam1')
      expect(progress.q1?.status).toBe('correct')
    })
  })

  describe('mergeSettings', () => {
    it('should merge source settings into target', () => {
      ProgressService.saveExamSettings('source', 'exam1', { mistakesConsecutiveCorrect: 3 })

      ProgressService.mergeSettings('source', 'target')

      const settings = ProgressService.getExamSettings('target', 'exam1')
      expect(settings.mistakesConsecutiveCorrect).toBe(3)
    })

    it('should do nothing if source does not exist', () => {
      ProgressService.saveExamSettings('target', 'exam1', { owned: true })

      ProgressService.mergeSettings('nonexistent', 'target')

      const settings = ProgressService.getExamSettings('target', 'exam1')
      expect(settings.owned).toBe(true)
    })

    it('should use OR logic for owned field', () => {
      ProgressService.saveExamSettings('source', 'exam1', { owned: true })
      ProgressService.saveExamSettings('target', 'exam1', { owned: false })

      ProgressService.mergeSettings('source', 'target')

      const settings = ProgressService.getExamSettings('target', 'exam1')
      expect(settings.owned).toBe(true)
    })

    it('should handle owned being undefined', () => {
      ProgressService.saveExamSettings('source', 'exam1', { mistakesConsecutiveCorrect: 3 })
      ProgressService.saveExamSettings('target', 'exam1', { mistakesConsecutiveCorrect: 5 })

      ProgressService.mergeSettings('source', 'target')

      const settings = ProgressService.getExamSettings('target', 'exam1')
      expect(settings.owned).toBeUndefined()
    })

    it('should create target user if not exists', () => {
      ProgressService.saveExamSettings('source', 'exam1', { owned: true })

      ProgressService.mergeSettings('source', 'newtarget')

      const settings = ProgressService.getExamSettings('newtarget', 'exam1')
      expect(settings.owned).toBe(true)
    })
  })

  describe('_saveToStorage', () => {
    it('should save data to localStorage', () => {
      const data = { user1: { exam1: { q1: { status: 'correct' as const } } } }
      ProgressService._saveToStorage(data)

      expect(localStorage.getItem('examtopics_progress')).toBe(JSON.stringify(data))
    })
  })

  describe('_saveSettingsToStorage', () => {
    it('should save settings to localStorage', () => {
      const data = { user1: { exam1: { owned: true } } }
      ProgressService._saveSettingsToStorage(data)

      expect(localStorage.getItem('examtopics_settings')).toBe(JSON.stringify(data))
    })
  })
})
