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
  'common.questions': 'Questions',
  'common.progress': 'Progress',
  'common.accuracy': 'Accuracy',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.totalQuestionsAnswered': 'Total Questions Answered',
  'dashboard.correctAnswers': 'Correct Answers',
  'dashboard.overallAccuracy': 'Overall Accuracy',
  'dashboard.examsStarted': 'Exams Started',
  'dashboard.recentActivity': 'Recent Activity',
  'dashboard.noHistory': 'No practice history yet. Start an exam to see your stats!',
  'dashboard.allExams': 'All Available Exams',
  'dashboard.loadingExams': 'Loading exams...',
  'dashboard.syncPromptTitle': 'Sign in to sync your learning progress',
  'dashboard.syncPromptDesc': 'Sign in to automatically sync practice progress across your devices.',
  'dashboard.lastStudied': 'Last studied',

  // Exams list
  'exams.myExams': 'My Exams',
  'exams.noExams': 'No exams yet',
  'exams.noExamsDesc': "You haven't joined any exams yet. Go to the dashboard to explore and join exams.",
  'exams.goToDashboard': 'Go to Dashboard',

  // Exam details
  'examDetails.join': 'Join Exam',
  'examDetails.joined': 'Joined',
  'examDetails.practice': 'Practice',
  'examDetails.study': 'Study',
  'examDetails.exam': 'Exam',
  'examDetails.questionsAnswered': 'Questions Answered',
  'examDetails.correctRate': 'Correct Rate',
  'examDetails.bookmarked': 'Bookmarked',
  'examDetails.mistakes': 'Mistakes',
  'examDetails.startExam': 'Start Exam',
  'examDetails.examSettings': 'Exam Settings',
  'examDetails.numberOfQuestions': 'Number of Questions',
  'examDetails.randomSeed': 'Random Seed (Optional)',
  'examDetails.startExamBtn': 'Start Exam',
  'examDetails.loadingExam': 'Loading exam…',
  'examDetails.addedToMyExams': 'Exam added to My Exams',

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

  // Settings
  'settings.title': 'Settings',
  'settings.description': 'Manage your account settings and set e-mail preferences.',
  'settings.profile': 'Profile',
  'settings.account': 'Account',
  'settings.appearance': 'Appearance',

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
