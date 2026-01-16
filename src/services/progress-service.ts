export interface QuestionProgress {
  status?: 'correct' | 'incorrect' | 'skipped'
  bookmarked?: boolean
  lastAnswered?: number
  consecutiveCorrect?: number
  userSelection?: number[]
  timesWrong?: number
}

export interface ExamProgress {
  [questionId: string]: QuestionProgress
}

export interface UserProgress {
  [examId: string]: ExamProgress
}

export interface AppProgress {
  [userId: string]: UserProgress
}

const STORAGE_KEY = 'examtopics_progress'
const SETTINGS_KEY = 'examtopics_settings'

export interface ExamSettings {
  mistakesConsecutiveCorrect?: number
  owned?: boolean
}

export interface UserSettings {
  [examId: string]: ExamSettings
}

export interface AppSettings {
  [userId: string]: UserSettings
}

export const ProgressService = {
  getAllProgress(): AppProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  },

  getUserProgress(userId: string): UserProgress {
    const all = this.getAllProgress()
    return all[userId] || {}
  },

  getExamProgress(userId: string, examId: string): ExamProgress {
    const userProgress = this.getUserProgress(userId)
    return userProgress[examId] || {}
  },

  getAllSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  },

  getUserSettings(userId: string): UserSettings {
    const all = this.getAllSettings()
    return all[userId] || {}
  },

  getExamSettings(userId: string, examId: string): ExamSettings {
    const userSettings = this.getUserSettings(userId)
    return userSettings[examId] || {}
  },

  saveAnswer(
    userId: string,
    examId: string,
    questionId: string,
    status: 'correct' | 'incorrect' | 'skipped',
    userSelection?: number[],
    isCorrectAttempt?: boolean,
    options?: { resetTimesWrong?: boolean }
  ) {
    const all = this.getAllProgress()
    if (!all[userId]) all[userId] = {}
    if (!all[userId][examId]) all[userId][examId] = {}
    if (!all[userId][examId][questionId]) all[userId][examId][questionId] = {}

    const questionData = all[userId][examId][questionId]

    const isCorrect =
      typeof isCorrectAttempt === 'boolean'
        ? isCorrectAttempt
        : status === 'correct'

    if (isCorrect) {
      questionData.consecutiveCorrect =
        (questionData.consecutiveCorrect || 0) + 1
      if (options?.resetTimesWrong) {
        questionData.timesWrong = 0
      }
    } else {
      questionData.consecutiveCorrect = 0
      questionData.timesWrong = (questionData.timesWrong || 0) + 1
    }

    questionData.status = status
    questionData.lastAnswered = Date.now()
    if (userSelection) {
      questionData.userSelection = userSelection
    }

    this._saveToStorage(all)
  },

  saveExamSettings(userId: string, examId: string, settings: ExamSettings) {
    const all = this.getAllSettings()
    if (!all[userId]) all[userId] = {}
    all[userId][examId] = {
      ...all[userId][examId],
      ...settings,
    }
    this._saveSettingsToStorage(all)
  },

  clearExamProgress(userId: string, examId: string) {
    const all = this.getAllProgress()
    if (all[userId] && all[userId][examId]) {
      // We might want to keep bookmarks?
      // User said "Clear Progress" to reset answer status.
      // Usually "Clear Progress" wipes everything for that exam answer-wise.
      // But maybe bookmarks should stay?
      // Let's assume we clear answers but keep bookmarks.

      const examData = all[userId][examId]
      Object.keys(examData).forEach((qId) => {
        delete examData[qId].status
        delete examData[qId].lastAnswered
        delete examData[qId].consecutiveCorrect
        delete examData[qId].userSelection
        // Keep bookmarked
      })

      this._saveToStorage(all)
    }
  },

  toggleBookmark(userId: string, examId: string, questionId: string) {
    const all = this.getAllProgress()
    if (!all[userId]) all[userId] = {}
    if (!all[userId][examId]) all[userId][examId] = {}
    if (!all[userId][examId][questionId]) all[userId][examId][questionId] = {}

    const current = all[userId][examId][questionId].bookmarked
    all[userId][examId][questionId].bookmarked = !current

    this._saveToStorage(all)
  },

  mergeProgress(sourceUserId: string, targetUserId: string) {
    const all = this.getAllProgress()
    const sourceData = all[sourceUserId]
    if (!sourceData) return

    if (!all[targetUserId]) all[targetUserId] = {}

    // Deep merge sourceData into targetData
    Object.keys(sourceData).forEach((examId) => {
      if (!all[targetUserId][examId]) all[targetUserId][examId] = {}

      Object.keys(sourceData[examId]).forEach((questionId) => {
        const sourceQ = sourceData[examId][questionId]
        const targetQ = all[targetUserId][examId][questionId] || {}

        // Merge strategy: Source (Guest) overwrites Target (User) ONLY if Target is empty or older?
        // Actually, usually merging Guest into New Account means Guest data should be preserved.
        // If Target already has data, we might want to keep the "latest" or just simple merge.
        // Simple merge: Guest data adds to User data. If conflict, prefer User data?
        // User Requirement: "guest user signup之后会merge到registered user中"
        // Usually implies: what I did as guest becomes part of my new account.
        // So if I did Q1 as guest, and Q1 is empty in account, I copy it.
        // If Q1 is already done in account, I probably shouldn't overwrite it with guest data?
        // Or maybe I should? Let's assume "keep existing account data if present, otherwise fill with guest data".

        all[targetUserId][examId][questionId] = {
          ...sourceQ, // Guest data base
          ...targetQ, // Account data overrides if exists (or maybe other way around?)
          // If I just signed up, my account is empty, so sourceQ is fully copied.
          // If I logged into an existing account, I might want my guest session to count?
          // Let's assume: if target has status, keep it. If not, use source.
          // For bookmarks: if either is bookmarked, result is bookmarked?
        }

        // Let's refine bookmark merging: OR logic
        if (sourceQ.bookmarked || targetQ.bookmarked) {
          all[targetUserId][examId][questionId].bookmarked = true
        }
      })
    })

    // Optionally clear source data? Maybe keep it for safety.
    // delete all[sourceUserId]

    this._saveToStorage(all)
  },

  _saveToStorage(data: AppProgress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  _saveSettingsToStorage(data: AppSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
  },
}
