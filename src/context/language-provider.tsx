import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

export type Language = 'en' | 'zh' | 'ja'

const DEFAULT_LANGUAGE: Language = 'en'
const LANGUAGE_COOKIE_NAME = 'app-language'
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type LanguageProviderState = {
  defaultLanguage: Language
  language: Language
  setLanguage: (language: Language) => void
  resetLanguage: () => void
  t: (key: string) => string
}

// UI translations
const translations: Record<Language, Record<string, string>> = {
  en: {
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
  },
  zh: {
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.cancel': '取消',
    'common.continue': '继续',
    'common.save': '保存',
    'common.back': '返回',

    // Practice mode
    'practice.title': '练习',
    'practice.myMistakes': '我的错题',
    'practice.myBookmarks': '我的收藏',
    'practice.question': '题目',
    'practice.of': '/',
    'practice.single': '单选',
    'practice.multiple': '多选',
    'practice.submitAnswer': '提交答案',
    'practice.correctAnswer': '回答正确！',
    'practice.incorrectAnswer': '回答错误',
    'practice.correct': '正确答案',
    'practice.yourAnswer': '你的答案',
    'practice.explanation': '解释',
    'practice.loadingQuestions': '正在加载题目...',
    'practice.noMistakes': '没有错题需要复习！',
    'practice.noMistakesDesc': '太棒了！你还没有答错的题目。',
    'practice.noBookmarks': '没有收藏的题目！',
    'practice.noBookmarksDesc': '在练习时收藏题目，稍后可以在这里复习。',
    'practice.backToExam': '返回考试',
    'practice.clearProgress': '清除进度',
    'practice.clearProgressTitle': '你确定吗？',
    'practice.clearProgressDesc': '此操作无法撤销。这将永久删除你在此考试中的进度。',
    'practice.graduated': '太棒了！这道题已从错题本中移除。',
    'practice.graduatedDesc': '你连续答对了 {count} 次。',
    'practice.savedLocally': '已保存到本地。登录以同步到云端',
    'practice.bookmarkSavedLocally': '收藏已保存到本地。登录以同步到云端',

    // Study mode
    'study.title': '学习模式',
    'study.showAnswer': '显示答案',

    // Exam mode
    'exam.title': '考试模式',
    'exam.timeRemaining': '剩余时间',
    'exam.submit': '提交考试',
    'exam.results': '考试结果',
    'exam.score': '得分',
    'exam.passed': '通过',
    'exam.failed': '未通过',

    // Navigation
    'nav.exams': '考试',
    'nav.settings': '设置',
    'nav.account': '账户',
    'nav.signIn': '登录',
    'nav.signOut': '退出',

    // Language selector
    'language.select': '语言',
    'language.en': 'English',
    'language.zh': '中文',
    'language.ja': '日本語',
  },
  ja: {
    // Common
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.cancel': 'キャンセル',
    'common.continue': '続ける',
    'common.save': '保存',
    'common.back': '戻る',

    // Practice mode
    'practice.title': '練習',
    'practice.myMistakes': '間違えた問題',
    'practice.myBookmarks': 'ブックマーク',
    'practice.question': '問題',
    'practice.of': '/',
    'practice.single': '単一選択',
    'practice.multiple': '複数選択',
    'practice.submitAnswer': '回答を送信',
    'practice.correctAnswer': '正解！',
    'practice.incorrectAnswer': '不正解',
    'practice.correct': '正解',
    'practice.yourAnswer': 'あなたの回答',
    'practice.explanation': '解説',
    'practice.loadingQuestions': '問題を読み込み中...',
    'practice.noMistakes': '復習する間違いはありません！',
    'practice.noMistakesDesc': 'すばらしい！まだ間違えた問題がありません。',
    'practice.noBookmarks': 'ブックマークした問題がありません！',
    'practice.noBookmarksDesc': '練習中に問題をブックマークして、後でここで復習できます。',
    'practice.backToExam': '試験に戻る',
    'practice.clearProgress': '進捗をクリア',
    'practice.clearProgressTitle': '本当によろしいですか？',
    'practice.clearProgressDesc': 'この操作は元に戻せません。この試験の進捗が完全に削除されます。',
    'practice.graduated': 'すばらしい！この問題は間違えた問題から削除されました。',
    'practice.graduatedDesc': '{count}回連続で正解しました。',
    'practice.savedLocally': 'ローカルに保存しました。クラウドに同期するにはログインしてください',
    'practice.bookmarkSavedLocally': 'ブックマークをローカルに保存しました。クラウドに同期するにはログインしてください',

    // Study mode
    'study.title': '学習モード',
    'study.showAnswer': '答えを表示',

    // Exam mode
    'exam.title': '試験モード',
    'exam.timeRemaining': '残り時間',
    'exam.submit': '試験を提出',
    'exam.results': '試験結果',
    'exam.score': 'スコア',
    'exam.passed': '合格',
    'exam.failed': '不合格',

    // Navigation
    'nav.exams': '試験',
    'nav.settings': '設定',
    'nav.account': 'アカウント',
    'nav.signIn': 'ログイン',
    'nav.signOut': 'ログアウト',

    // Language selector
    'language.select': '言語',
    'language.en': 'English',
    'language.zh': '中文',
    'language.ja': '日本語',
  },
}

const initialState: LanguageProviderState = {
  defaultLanguage: DEFAULT_LANGUAGE,
  language: DEFAULT_LANGUAGE,
  /* istanbul ignore next -- placeholder never called when provider wraps app */
  setLanguage: () => null,
  /* istanbul ignore next -- placeholder never called when provider wraps app */
  resetLanguage: () => null,
  /* istanbul ignore next -- placeholder never called when provider wraps app */
  t: (key: string) => key,
}

const LanguageContext = createContext<LanguageProviderState>(initialState)

export function LanguageProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
  storageKey = LANGUAGE_COOKIE_NAME,
  ...props
}: LanguageProviderProps) {
  const [language, _setLanguage] = useState<Language>(() => {
    const stored = getCookie(storageKey)
    if (stored && ['en', 'zh', 'ja'].includes(stored)) {
      return stored as Language
    }
    return defaultLanguage
  })

  // Set HTML lang attribute
  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('lang', language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setCookie(storageKey, lang, LANGUAGE_COOKIE_MAX_AGE)
    _setLanguage(lang)
  }

  const resetLanguage = () => {
    removeCookie(storageKey)
    _setLanguage(DEFAULT_LANGUAGE)
  }

  // Translation function
  const t = useMemo(() => {
    return (key: string): string => {
      const value = translations[language][key]
      if (value !== undefined) return value
      // Fallback to English
      const fallback = translations.en[key]
      if (fallback !== undefined) return fallback
      // Return key if not found
      return key
    }
  }, [language])

  const contextValue = {
    defaultLanguage,
    language,
    setLanguage,
    resetLanguage,
    t,
  }

  return (
    <LanguageContext value={contextValue} {...props}>
      {children}
    </LanguageContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext)

  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')

  return context
}

// Helper to get explanation based on current language
// eslint-disable-next-line react-refresh/only-export-components
export function getLocalizedExplanation(
  explanations: { en?: string; zh?: string; ja?: string } | undefined,
  language: Language
): string {
  if (!explanations) return ''

  // Try to get explanation in current language
  const explanation = explanations[language]
  if (explanation && explanation.trim()) {
    return explanation.trim()
  }

  // Fallback to English
  if (language !== 'en' && explanations.en && explanations.en.trim()) {
    return explanations.en.trim()
  }

  // Fallback to any available language
  for (const lang of ['zh', 'ja'] as const) {
    if (explanations[lang] && explanations[lang]!.trim()) {
      return explanations[lang]!.trim()
    }
  }

  return ''
}
