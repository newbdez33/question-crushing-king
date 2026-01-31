import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock language provider with English translations as default
const englishTranslations: Record<string, string> = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.cancel': 'Cancel',
  'common.continue': 'Continue',
  'common.save': 'Save',
  'common.back': 'Back',

  // Practice mode
  'practice.title': 'Practice',
  'practice.myMistakes': 'My Mistakes',
  'practice.myBookmarks': 'My Bookmarks',
  'practice.question': 'Question',
  'practice.of': 'of',
  'practice.single': 'Single',
  'practice.multiple': 'Multiple',
  'practice.submitAnswer': 'Submit Answer',
  'practice.correctAnswer': 'Correct Answer!',
  'practice.incorrectAnswer': 'Incorrect Answer',
  'practice.correct': 'Correct Answer',
  'practice.yourAnswer': 'Your Answer',
  'practice.explanation': 'Explanation',
  'practice.loadingQuestions': 'Loading questions…',
  'practice.noMistakes': 'No mistakes to review!',
  'practice.noMistakesDesc': "Great job! You don't have any incorrect answers yet.",
  'practice.noBookmarks': 'No bookmarked questions!',
  'practice.noBookmarksDesc': 'Bookmark questions while practicing to review them here later.',
  'practice.backToExam': 'Back to Exam',
  'practice.clearProgress': 'Clear Progress',
  'practice.clearProgressTitle': 'Are you absolutely sure?',
  'practice.clearProgressDesc': 'This action cannot be undone. This will permanently delete your progress for this exam.',
  'practice.graduated': 'Great job! This question has been removed from My Mistakes.',
  'practice.graduatedDesc': 'You answered it correctly {count} times in a row.',
  'practice.savedLocally': 'Saved locally. Sign in to sync to cloud',
  'practice.bookmarkSavedLocally': 'Bookmark saved locally. Sign in to sync to cloud',

  // Study mode
  'study.title': 'Study Mode',
  'study.showAnswer': 'Show Answer',

  // Exam mode
  'exam.title': 'Exam Mode',
  'exam.timeRemaining': 'Time Remaining',
  'exam.submit': 'Submit Exam',
  'exam.results': 'Exam Results',
  'exam.score': 'Score',
  'exam.passed': 'Passed',
  'exam.failed': 'Failed',

  // Navigation
  'nav.exams': 'Exams',
  'nav.settings': 'Settings',
  'nav.account': 'Account',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',

  // Language selector
  'language.select': 'Language',
  'language.en': 'English',
  'language.zh': '中文',
  'language.ja': '日本語',
}

vi.mock('@/context/language-provider', () => ({
  useLanguage: () => ({
    language: 'en',
    defaultLanguage: 'en',
    setLanguage: vi.fn(),
    resetLanguage: vi.fn(),
    t: (key: string) => englishTranslations[key] ?? key,
  }),
  getLocalizedExplanation: (
    explanations: { en?: string; zh?: string; ja?: string } | undefined,
    _language: string
  ) => {
    if (!explanations) return ''
    return explanations.en || explanations.zh || explanations.ja || ''
  },
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}))
