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

    // Sidebar
    'sidebar.appTitle': 'Question King',
    'sidebar.general': 'General',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.myExams': 'My Exams',
    'sidebar.other': 'Other',
    'sidebar.helpCenter': 'Help Center',

    // Authentication
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.emailPlaceholder': 'name@example.com',
    'auth.passwordPlaceholder': '********',
    'auth.forgotPassword': 'Forgot password?',
    'auth.signInWithEmail': 'Sign In with Email',
    'auth.signUpWithEmail': 'Sign Up with Email',
    'auth.orContinueWith': 'Or continue with',
    'auth.google': 'Google',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.otpLabel': 'One-Time Password',
    'auth.verify': 'Verify',
    'auth.enterEmail': 'Please enter your email',
    'auth.enterPassword': 'Please enter your password',
    'auth.passwordMinLength': 'Password must be at least 7 characters long',
    'auth.confirmPasswordRequired': 'Please confirm your password',
    'auth.passwordsNoMatch': "Passwords don't match.",
    'auth.enterOtp': 'Please enter the 6-digit code.',
    'auth.welcomeBack': 'Welcome back!',
    'auth.signInFailed': 'Failed to sign in',
    'auth.signInGoogleSuccess': 'Signed in with Google successfully!',
    'auth.signInGoogleFailed': 'Failed to sign in with Google',
    'auth.accountCreated': 'Account created successfully!',
    'auth.accountCreateFailed': 'Failed to create account',
    'auth.resetEmailSent': 'Password reset email sent',
    'auth.resetEmailFailed': 'Failed to send reset email',

    // Error pages
    'error.404': '404',
    'error.404Title': 'Oops! Page Not Found!',
    'error.404Desc': "It seems like the page you're looking for does not exist or might have been removed.",
    'error.500': '500',
    'error.500Title': 'Oops! Something went wrong',
    'error.500Desc': 'We apologize for the inconvenience. Please try again later.',
    'error.401': '401',
    'error.401Title': 'Unauthorized Access',
    'error.401Desc': 'Please log in with the appropriate credentials to access this resource.',
    'error.403': '403',
    'error.403Title': 'Access Forbidden',
    'error.403Desc': "You don't have necessary permission to view this resource.",
    'error.503': '503',
    'error.503Title': 'Website is under maintenance!',
    'error.503Desc': "The site is not available at the moment. We'll be back online shortly.",
    'error.goBack': 'Go Back',
    'error.backToHome': 'Back to Home',
    'error.learnMore': 'Learn more',

    // Theme settings
    'theme.title': 'Theme Settings',
    'theme.description': 'Adjust the appearance and layout to suit your preferences.',
    'theme.reset': 'Reset',
    'theme.resetAll': 'Reset all settings to default values',
    'theme.theme': 'Theme',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.themeDesc': 'Choose between system preference, light mode, or dark mode',
    'theme.sidebar': 'Sidebar',
    'theme.inset': 'Inset',
    'theme.floating': 'Floating',
    'theme.sidebarOption': 'Sidebar',
    'theme.sidebarDesc': 'Choose between inset, floating, or standard sidebar layout',
    'theme.layout': 'Layout',
    'theme.default': 'Default',
    'theme.compact': 'Compact',
    'theme.fullLayout': 'Full layout',
    'theme.layoutDesc': 'Choose between default expanded, compact icon-only, or full layout mode',
    'theme.direction': 'Direction',
    'theme.ltr': 'Left to Right',
    'theme.rtl': 'Right to Left',
    'theme.directionDesc': 'Choose between left-to-right or right-to-left site direction',

    // Practice/Study components
    'practice.answerSheet': 'Answer Sheet',
    'practice.settings': 'Settings',
    'practice.fontSize': 'Font size',
    'practice.fontSmall': 'small',
    'practice.fontNormal': 'normal',
    'practice.fontLarge': 'large',
    'practice.bookmark': 'Bookmark',
    'practice.correctCount': 'Correct count',
    'practice.wrongCount': 'Wrong count',
    'practice.answerCard': 'Answer Card',

    // Common components
    'common.search': 'Search',
    'common.typeCommand': 'Type a command or search...',
    'common.noResults': 'No results found.',
    'common.toggleTheme': 'Toggle theme',
    'common.skipToMain': 'Skip to Main',
    'common.selected': 'selected',
    'common.clearSelection': 'Clear selection',
    'common.rowsPerPage': 'Rows per page',
    'common.pageOf': 'Page {current} of {total}',
    'common.goToFirstPage': 'Go to first page',
    'common.goToPrevPage': 'Go to previous page',
    'common.goToNextPage': 'Go to next page',
    'common.goToLastPage': 'Go to last page',
    'common.filter': 'Filter...',
    'common.view': 'View',
    'common.toggleColumns': 'Toggle columns',
    'common.clearFilters': 'Clear filters',
    'common.pickDate': 'Pick a date',
    'common.comingSoon': 'Coming Soon!',
    'common.comingSoonDesc': 'This page has not been created yet. Stay tuned though!',
    'common.guestUser': 'Guest User',

    // Sign out dialog
    'signOut.title': 'Sign out',
    'signOut.description': 'Are you sure you want to sign out? You will need to sign in again to access your account.',
    'signOut.confirm': 'Sign out',
  },
  zh: {
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.cancel': '取消',
    'common.continue': '继续',
    'common.save': '保存',
    'common.back': '返回',
    'common.questions': '题目',
    'common.progress': '进度',
    'common.accuracy': '正确率',

    // Dashboard
    'dashboard.title': '仪表盘',
    'dashboard.totalQuestionsAnswered': '已答题目总数',
    'dashboard.correctAnswers': '正确答案',
    'dashboard.overallAccuracy': '总体正确率',
    'dashboard.examsStarted': '已开始考试',
    'dashboard.recentActivity': '最近活动',
    'dashboard.noHistory': '还没有练习记录。开始一场考试来查看你的统计数据！',
    'dashboard.allExams': '所有可用考试',
    'dashboard.loadingExams': '正在加载考试...',
    'dashboard.syncPromptTitle': '登录以同步学习进度',
    'dashboard.syncPromptDesc': '登录后可自动在不同设备间同步练习进度。',
    'dashboard.lastStudied': '上次学习',

    // Exams list
    'exams.myExams': '我的考试',
    'exams.noExams': '还没有考试',
    'exams.noExamsDesc': '你还没有加入任何考试。去仪表盘探索并加入考试吧。',
    'exams.goToDashboard': '前往仪表盘',

    // Exam details
    'examDetails.join': '加入考试',
    'examDetails.joined': '已加入',
    'examDetails.practice': '练习',
    'examDetails.study': '学习',
    'examDetails.exam': '考试',
    'examDetails.questionsAnswered': '已答题目',
    'examDetails.correctRate': '正确率',
    'examDetails.bookmarked': '已收藏',
    'examDetails.mistakes': '错题',
    'examDetails.startExam': '开始考试',
    'examDetails.examSettings': '考试设置',
    'examDetails.numberOfQuestions': '题目数量',
    'examDetails.randomSeed': '随机种子（可选）',
    'examDetails.startExamBtn': '开始考试',
    'examDetails.loadingExam': '正在加载考试...',
    'examDetails.addedToMyExams': '已添加到我的考试',

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

    // Settings
    'settings.title': '设置',
    'settings.description': '管理你的账户设置和邮件偏好。',
    'settings.profile': '个人资料',
    'settings.account': '账户',
    'settings.appearance': '外观',

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

    // Sidebar
    'sidebar.appTitle': '刷题大王',
    'sidebar.general': '常规',
    'sidebar.dashboard': '仪表盘',
    'sidebar.myExams': '我的考试',
    'sidebar.other': '其他',
    'sidebar.helpCenter': '帮助中心',

    // Authentication
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.emailPlaceholder': 'name@example.com',
    'auth.passwordPlaceholder': '********',
    'auth.forgotPassword': '忘记密码？',
    'auth.signInWithEmail': '使用邮箱登录',
    'auth.signUpWithEmail': '使用邮箱注册',
    'auth.orContinueWith': '或者使用',
    'auth.google': 'Google',
    'auth.sendResetLink': '发送重置链接',
    'auth.otpLabel': '一次性密码',
    'auth.verify': '验证',
    'auth.enterEmail': '请输入邮箱',
    'auth.enterPassword': '请输入密码',
    'auth.passwordMinLength': '密码长度至少为7个字符',
    'auth.confirmPasswordRequired': '请确认密码',
    'auth.passwordsNoMatch': '密码不匹配。',
    'auth.enterOtp': '请输入6位验证码。',
    'auth.welcomeBack': '欢迎回来！',
    'auth.signInFailed': '登录失败',
    'auth.signInGoogleSuccess': '使用 Google 登录成功！',
    'auth.signInGoogleFailed': '使用 Google 登录失败',
    'auth.accountCreated': '账户创建成功！',
    'auth.accountCreateFailed': '账户创建失败',
    'auth.resetEmailSent': '密码重置邮件已发送',
    'auth.resetEmailFailed': '发送重置邮件失败',

    // Error pages
    'error.404': '404',
    'error.404Title': '哎呀！页面未找到！',
    'error.404Desc': '您要查找的页面似乎不存在或可能已被删除。',
    'error.500': '500',
    'error.500Title': '哎呀！出了点问题',
    'error.500Desc': '我们对此带来的不便深表歉意。请稍后再试。',
    'error.401': '401',
    'error.401Title': '未授权访问',
    'error.401Desc': '请使用适当的凭据登录以访问此资源。',
    'error.403': '403',
    'error.403Title': '访问被禁止',
    'error.403Desc': '您没有查看此资源的必要权限。',
    'error.503': '503',
    'error.503Title': '网站正在维护中！',
    'error.503Desc': '网站目前不可用。我们将很快恢复上线。',
    'error.goBack': '返回',
    'error.backToHome': '返回首页',
    'error.learnMore': '了解更多',

    // Theme settings
    'theme.title': '主题设置',
    'theme.description': '调整外观和布局以满足您的偏好。',
    'theme.reset': '重置',
    'theme.resetAll': '将所有设置重置为默认值',
    'theme.theme': '主题',
    'theme.system': '系统',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.themeDesc': '选择系统偏好、浅色模式或深色模式',
    'theme.sidebar': '侧边栏',
    'theme.inset': '内嵌',
    'theme.floating': '浮动',
    'theme.sidebarOption': '侧边栏',
    'theme.sidebarDesc': '选择内嵌、浮动或标准侧边栏布局',
    'theme.layout': '布局',
    'theme.default': '默认',
    'theme.compact': '紧凑',
    'theme.fullLayout': '完整布局',
    'theme.layoutDesc': '选择默认展开、紧凑仅图标或完整布局模式',
    'theme.direction': '方向',
    'theme.ltr': '从左到右',
    'theme.rtl': '从右到左',
    'theme.directionDesc': '选择从左到右或从右到左的网站方向',

    // Practice/Study components
    'practice.answerSheet': '答题卡',
    'practice.settings': '设置',
    'practice.fontSize': '字体大小',
    'practice.fontSmall': '小',
    'practice.fontNormal': '正常',
    'practice.fontLarge': '大',
    'practice.bookmark': '收藏',
    'practice.correctCount': '正确次数',
    'practice.wrongCount': '错误次数',
    'practice.answerCard': '答题卡',

    // Common components
    'common.search': '搜索',
    'common.typeCommand': '输入命令或搜索...',
    'common.noResults': '未找到结果。',
    'common.toggleTheme': '切换主题',
    'common.skipToMain': '跳转到主要内容',
    'common.selected': '已选择',
    'common.clearSelection': '清除选择',
    'common.rowsPerPage': '每页行数',
    'common.pageOf': '第 {current} 页，共 {total} 页',
    'common.goToFirstPage': '转到第一页',
    'common.goToPrevPage': '转到上一页',
    'common.goToNextPage': '转到下一页',
    'common.goToLastPage': '转到最后一页',
    'common.filter': '筛选...',
    'common.view': '视图',
    'common.toggleColumns': '切换列',
    'common.clearFilters': '清除筛选',
    'common.pickDate': '选择日期',
    'common.comingSoon': '即将推出！',
    'common.comingSoonDesc': '此页面尚未创建。敬请期待！',
    'common.guestUser': '访客用户',

    // Sign out dialog
    'signOut.title': '退出登录',
    'signOut.description': '确定要退出登录吗？您需要重新登录才能访问您的账户。',
    'signOut.confirm': '退出登录',
  },
  ja: {
    // Common
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.cancel': 'キャンセル',
    'common.continue': '続ける',
    'common.save': '保存',
    'common.back': '戻る',
    'common.questions': '問題',
    'common.progress': '進捗',
    'common.accuracy': '正答率',

    // Dashboard
    'dashboard.title': 'ダッシュボード',
    'dashboard.totalQuestionsAnswered': '回答した問題数',
    'dashboard.correctAnswers': '正解数',
    'dashboard.overallAccuracy': '総合正答率',
    'dashboard.examsStarted': '開始した試験',
    'dashboard.recentActivity': '最近のアクティビティ',
    'dashboard.noHistory': 'まだ練習履歴がありません。試験を始めて統計を確認しましょう！',
    'dashboard.allExams': '利用可能な試験',
    'dashboard.loadingExams': '試験を読み込み中...',
    'dashboard.syncPromptTitle': 'ログインして学習進捗を同期',
    'dashboard.syncPromptDesc': 'ログインすると、複数のデバイス間で練習進捗を自動的に同期できます。',
    'dashboard.lastStudied': '最終学習日',

    // Exams list
    'exams.myExams': 'マイ試験',
    'exams.noExams': '試験がありません',
    'exams.noExamsDesc': 'まだ試験に参加していません。ダッシュボードで試験を探して参加しましょう。',
    'exams.goToDashboard': 'ダッシュボードへ',

    // Exam details
    'examDetails.join': '試験に参加',
    'examDetails.joined': '参加済み',
    'examDetails.practice': '練習',
    'examDetails.study': '学習',
    'examDetails.exam': '試験',
    'examDetails.questionsAnswered': '回答済み問題',
    'examDetails.correctRate': '正答率',
    'examDetails.bookmarked': 'ブックマーク',
    'examDetails.mistakes': '間違い',
    'examDetails.startExam': '試験を開始',
    'examDetails.examSettings': '試験設定',
    'examDetails.numberOfQuestions': '問題数',
    'examDetails.randomSeed': 'ランダムシード（任意）',
    'examDetails.startExamBtn': '試験を開始',
    'examDetails.loadingExam': '試験を読み込み中…',
    'examDetails.addedToMyExams': 'マイ試験に追加しました',

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

    // Settings
    'settings.title': '設定',
    'settings.description': 'アカウント設定とメール設定を管理します。',
    'settings.profile': 'プロフィール',
    'settings.account': 'アカウント',
    'settings.appearance': '外観',

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

    // Sidebar
    'sidebar.appTitle': '問題キング',
    'sidebar.general': '一般',
    'sidebar.dashboard': 'ダッシュボード',
    'sidebar.myExams': 'マイ試験',
    'sidebar.other': 'その他',
    'sidebar.helpCenter': 'ヘルプセンター',

    // Authentication
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード確認',
    'auth.emailPlaceholder': 'name@example.com',
    'auth.passwordPlaceholder': '********',
    'auth.forgotPassword': 'パスワードをお忘れですか？',
    'auth.signInWithEmail': 'メールでログイン',
    'auth.signUpWithEmail': 'メールで登録',
    'auth.orContinueWith': 'または',
    'auth.google': 'Google',
    'auth.sendResetLink': 'リセットリンクを送信',
    'auth.otpLabel': 'ワンタイムパスワード',
    'auth.verify': '確認',
    'auth.enterEmail': 'メールアドレスを入力してください',
    'auth.enterPassword': 'パスワードを入力してください',
    'auth.passwordMinLength': 'パスワードは7文字以上である必要があります',
    'auth.confirmPasswordRequired': 'パスワードを確認してください',
    'auth.passwordsNoMatch': 'パスワードが一致しません。',
    'auth.enterOtp': '6桁のコードを入力してください。',
    'auth.welcomeBack': 'おかえりなさい！',
    'auth.signInFailed': 'ログインに失敗しました',
    'auth.signInGoogleSuccess': 'Googleでログインしました！',
    'auth.signInGoogleFailed': 'Googleでのログインに失敗しました',
    'auth.accountCreated': 'アカウントが作成されました！',
    'auth.accountCreateFailed': 'アカウントの作成に失敗しました',
    'auth.resetEmailSent': 'パスワードリセットメールを送信しました',
    'auth.resetEmailFailed': 'リセットメールの送信に失敗しました',

    // Error pages
    'error.404': '404',
    'error.404Title': 'ページが見つかりません！',
    'error.404Desc': 'お探しのページは存在しないか、削除された可能性があります。',
    'error.500': '500',
    'error.500Title': 'エラーが発生しました',
    'error.500Desc': 'ご不便をおかけして申し訳ございません。後でもう一度お試しください。',
    'error.401': '401',
    'error.401Title': '認証エラー',
    'error.401Desc': 'このリソースにアクセスするには、適切な認証情報でログインしてください。',
    'error.403': '403',
    'error.403Title': 'アクセス禁止',
    'error.403Desc': 'このリソースを表示する権限がありません。',
    'error.503': '503',
    'error.503Title': 'メンテナンス中です',
    'error.503Desc': '現在サイトは利用できません。まもなくオンラインに戻ります。',
    'error.goBack': '戻る',
    'error.backToHome': 'ホームに戻る',
    'error.learnMore': '詳細を見る',

    // Theme settings
    'theme.title': 'テーマ設定',
    'theme.description': '外観とレイアウトを好みに合わせて調整します。',
    'theme.reset': 'リセット',
    'theme.resetAll': 'すべての設定をデフォルト値にリセット',
    'theme.theme': 'テーマ',
    'theme.system': 'システム',
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',
    'theme.themeDesc': 'システム設定、ライトモード、ダークモードから選択',
    'theme.sidebar': 'サイドバー',
    'theme.inset': 'インセット',
    'theme.floating': 'フローティング',
    'theme.sidebarOption': 'サイドバー',
    'theme.sidebarDesc': 'インセット、フローティング、標準のサイドバーレイアウトから選択',
    'theme.layout': 'レイアウト',
    'theme.default': 'デフォルト',
    'theme.compact': 'コンパクト',
    'theme.fullLayout': 'フルレイアウト',
    'theme.layoutDesc': 'デフォルト展開、コンパクトアイコン、フルレイアウトモードから選択',
    'theme.direction': '方向',
    'theme.ltr': '左から右',
    'theme.rtl': '右から左',
    'theme.directionDesc': '左から右または右から左のサイト方向を選択',

    // Practice/Study components
    'practice.answerSheet': '解答シート',
    'practice.settings': '設定',
    'practice.fontSize': 'フォントサイズ',
    'practice.fontSmall': '小',
    'practice.fontNormal': '標準',
    'practice.fontLarge': '大',
    'practice.bookmark': 'ブックマーク',
    'practice.correctCount': '正解数',
    'practice.wrongCount': '不正解数',
    'practice.answerCard': '解答カード',

    // Common components
    'common.search': '検索',
    'common.typeCommand': 'コマンドを入力または検索...',
    'common.noResults': '結果が見つかりません。',
    'common.toggleTheme': 'テーマを切り替え',
    'common.skipToMain': 'メインコンテンツへスキップ',
    'common.selected': '選択済み',
    'common.clearSelection': '選択をクリア',
    'common.rowsPerPage': '1ページあたりの行数',
    'common.pageOf': '{total}ページ中{current}ページ',
    'common.goToFirstPage': '最初のページへ',
    'common.goToPrevPage': '前のページへ',
    'common.goToNextPage': '次のページへ',
    'common.goToLastPage': '最後のページへ',
    'common.filter': 'フィルター...',
    'common.view': '表示',
    'common.toggleColumns': '列を切り替え',
    'common.clearFilters': 'フィルターをクリア',
    'common.pickDate': '日付を選択',
    'common.comingSoon': '近日公開！',
    'common.comingSoonDesc': 'このページはまだ作成されていません。お楽しみに！',
    'common.guestUser': 'ゲストユーザー',

    // Sign out dialog
    'signOut.title': 'ログアウト',
    'signOut.description': 'ログアウトしてもよろしいですか？アカウントにアクセスするには再度ログインが必要です。',
    'signOut.confirm': 'ログアウト',
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
