import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as RemoteProgress from '@/services/firebase-progress'
import { ProgressService, type ExamProgress } from '@/services/progress-service'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-ctx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { PracticeMobileBar } from './components/practice-mobile-bar'
import {
  PracticeSidebar,
  type PracticeSettings,
} from './components/practice-sidebar'
import { PracticeSkeleton } from './components/practice-skeleton'
import { mockExams } from './data/mock-exams'

interface PracticeModeProps {
  examId: string
  initialMode?: 'mistakes'
  initialQuestionIndex?: number
}

type DemoOption = {
  label: string
  content: string
}

type DemoQuestion = {
  id: string
  questionNumber: number
  type: string
  content: string
  options: DemoOption[]
  correctAnswer: string
  explanation?: string
}

type DemoFile = {
  questions: DemoQuestion[]
}

type PracticeOption = {
  text: string
  html?: string
}

type PracticeQuestion = {
  id: string
  type: 'single' | 'multiple'
  text: string
  contentHtml?: string
  options: PracticeOption[]
  correctAnswers: number[]
  requiredSelections: number
  explanation?: string
}

function htmlToText(html: string) {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').trim()
}

function resolveAssetUrl(src: string) {
  const trimmed = (src ?? '').trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('images/')) return `/data/${trimmed}`
  return `/data/${trimmed}`
}

function parseCorrectLabels(input: string) {
  const matches = (input ?? '').toUpperCase().match(/[A-Z]/g) ?? []
  return Array.from(new Set(matches))
}

function formatQuestionType(type: string) {
  if (type === 'multiple') return 'Multiple'
  return 'Single'
}

function sameSelections(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((item) => setB.has(item))
}

function renderExamHtml(html: string) {
  if (typeof window === 'undefined') return <span>{html}</span>

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const nodes = Array.from(doc.body.childNodes)

  const renderNode = (
    node: ChildNode,
    key: string | number,
    parentTag?: string
  ): ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (!text) return null
      if (parentTag === 'p' || parentTag === 'li') {
        return text
      }
      return (
        <span key={key} className='leading-relaxed'>
          {text}
        </span>
      )
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map((child, index) =>
      renderNode(child, `${key}-${index}`, tag)
    )

    if (tag === 'p') {
      return (
        <p key={key} className='leading-relaxed'>
          {children}
        </p>
      )
    }

    if (tag === 'br') return <br key={key} />

    if (tag === 'strong') return <strong key={key}>{children}</strong>
    if (tag === 'em') return <em key={key}>{children}</em>
    if (tag === 'code') return <code key={key}>{children}</code>

    if (tag === 'ul')
      return (
        <ul key={key} className='list-disc pl-6'>
          {children}
        </ul>
      )
    if (tag === 'ol')
      return (
        <ol key={key} className='list-decimal pl-6'>
          {children}
        </ol>
      )
    if (tag === 'li') return <li key={key}>{children}</li>

    if (tag === 'img') {
      const src = resolveAssetUrl(el.getAttribute('src') ?? '')
      const alt = el.getAttribute('alt') ?? ''
      return (
        <img
          key={key}
          src={src}
          alt={alt}
          loading='lazy'
          className='max-w-full rounded-md border'
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }

    return (
      <span key={key} className='whitespace-pre-wrap'>
        {children}
      </span>
    )
  }

  return (
    <div className='space-y-3'>
      {nodes.map((n, i) => renderNode(n, i, 'body'))}
    </div>
  )
}

function mergeProgress(local: ExamProgress, remote: ExamProgress) {
  const merged = { ...local }
  Object.entries(remote).forEach(([qId, rVal]) => {
    const lVal = merged[qId]
    if (!lVal || (rVal.lastAnswered || 0) > (lVal.lastAnswered || 0)) {
      merged[qId] = rVal
    }
  })
  return merged
}

export function PracticeMode({
  examId,
  initialMode,
  initialQuestionIndex,
}: PracticeModeProps) {
  const navigate = useNavigate()
  const { user, guestId, loading: authLoading } = useAuth()
  const userId = user?.uid || guestId
  const exam = mockExams.find((e) => e.id === examId)
  const fallbackQuestions = exam
    ? exam.questions.map((q) => ({
        id: q.id,
        type: 'single' as const,
        text: q.text,
        options: q.options.map((o) => ({ text: o })),
        correctAnswers: [q.correctAnswer],
        requiredSelections: 1,
        explanation: q.explanation,
      }))
    : null
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[] | null>(
    fallbackQuestions
  )
  const [title, setTitle] = useState(exam?.title ?? examId)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialQuestionIndex ?? 0
  )
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [examProgress, setExamProgress] = useState<ExamProgress>(() => {
    // Try to load synchronously to avoid flash
    if (typeof window !== 'undefined' && userId && examId) {
      try {
        return ProgressService.getExamProgress(userId, examId)
      } catch {
        return {}
      }
    }
    return {}
  })
  const [settings, setSettings] = useState<PracticeSettings>({
    autoNext: false,
    studyMode: false,
    consecutiveCorrect: 3,
    fontSize: 'normal',
    mistakesMode: initialMode === 'mistakes',
  })
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isProgressLoaded, setIsProgressLoaded] = useState(false)
  const [isRemoteSynced, setIsRemoteSynced] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const examProgressRef = useRef(examProgress)
  const userIdRef = useRef(userId)
  const userUidRef = useRef(user?.uid)
  const examIdRef = useRef(examId)

  // Filter questions for "My Mistakes" mode
  const [mistakeQuestions, setMistakeQuestions] = useState<
    PracticeQuestion[] | null
  >(null)
  const [mistakesSessionStatus, setMistakesSessionStatus] = useState<
    Record<string, 'correct' | 'incorrect'>
  >({})
  const prevMistakesMode = useRef(settings.mistakesMode)
  const settingsLoadedRef = useRef(false)

  useEffect(() => {
    if (initialQuestionIndex !== undefined) {
      setCurrentQuestionIndex(initialQuestionIndex)
    }
  }, [initialQuestionIndex])

  useEffect(() => {
    navigate({
      to: '/exams/$examId/practice',
      params: { examId: examIdRef.current },
      search: (prev) => ({
        ...prev,
        q: currentQuestionIndex + 1,
      }),
      replace: true,
    })
  }, [currentQuestionIndex, navigate])

  useEffect(() => {
    const wasMistakesMode = prevMistakesMode.current
    prevMistakesMode.current = settings.mistakesMode

    if (settings.mistakesMode && allQuestions) {
      if (userIdRef.current) {
        const toGraduate: string[] = []
        allQuestions.forEach((q) => {
          const p = examProgressRef.current[q.id]
          if (!p) return
          const isMistakeFlag =
            p.status === 'incorrect' || (p.timesWrong && p.timesWrong > 0)
          const consec = p.consecutiveCorrect || 0
          if (isMistakeFlag && consec >= settings.consecutiveCorrect) {
            toGraduate.push(q.id)
            ProgressService.saveAnswer(
              userIdRef.current,
              examIdRef.current,
              q.id,
              'correct',
              p.userSelection,
              true,
              { resetTimesWrong: true }
            )
            if (userUidRef.current) {
              void RemoteProgress.saveAnswer(
                userUidRef.current,
                examIdRef.current,
                q.id,
                'correct',
                p.userSelection,
                p,
                true,
                { resetTimesWrong: true }
              )
            }
          }
        })
        if (toGraduate.length > 0) {
          setExamProgress((prev) => {
            const next = { ...prev }
            toGraduate.forEach((qId) => {
              const prevEntry = next[qId] || {}
              const consec = prevEntry.consecutiveCorrect || 0
              next[qId] = {
                ...prevEntry,
                status: 'correct',
                timesWrong: 0,
                consecutiveCorrect: consec,
              }
            })
            return next
          })
        }
      }

      const filtered = allQuestions.filter((q) => {
        const p = examProgressRef.current[q.id]
        if (!p) return false

        if (p.status === 'incorrect' || (p.timesWrong && p.timesWrong > 0)) {
          return (p.consecutiveCorrect || 0) < settings.consecutiveCorrect
        }
        return false
      })
      setMistakeQuestions(filtered)

      if (settings.mistakesMode !== wasMistakesMode) {
        setMistakesSessionStatus({})
        setCurrentQuestionIndex(0)
      } else {
        // Clamp index to ensure it's valid
        setCurrentQuestionIndex((prev) => {
          if (prev < filtered.length) return prev
          return 0
        })
      }
    } else {
      setMistakeQuestions(null)
    }
  }, [
    settings.mistakesMode,
    settings.consecutiveCorrect,
    allQuestions,
    isRemoteSynced,
  ]) // Re-run when remote data syncs, but avoid examProgress to prevent shifting while practicing

  const questions = settings.mistakesMode ? mistakeQuestions : allQuestions

  // Load progress for the whole exam
  useEffect(() => {
    if (userId && examId) {
      const progress = ProgressService.getExamProgress(userId, examId)
      // Only set if we have data or if it's the first load (to avoid overwriting with empty)
      if (Object.keys(progress).length > 0 || !isProgressLoaded) {
        setExamProgress(progress)
      }
      setIsProgressLoaded(true)
    }
  }, [userId, examId, isProgressLoaded])

  useEffect(() => {
    if (!user?.uid) {
      setIsRemoteSynced(true)
      return
    }

    setIsRemoteSynced(false)
    const unsub = RemoteProgress.subscribeExamProgress(
      user.uid,
      examId,
      (p) => {
        setExamProgress((prev) => mergeProgress(prev, p || {}))
        setIsRemoteSynced(true)
      }
    )
    return () => unsub()
  }, [user?.uid, examId])

  useEffect(() => {
    if (!userId || !examId) return
    if (settingsLoadedRef.current) return

    const localSettings = ProgressService.getExamSettings(userId, examId)
    if (
      localSettings.mistakesConsecutiveCorrect &&
      localSettings.mistakesConsecutiveCorrect > 0
    ) {
      setSettings((prev) => ({
        ...prev,
        consecutiveCorrect:
          localSettings.mistakesConsecutiveCorrect || prev.consecutiveCorrect,
      }))
    }

    if (user?.uid) {
      RemoteProgress.getExamSettings(user.uid, examId)
        .then((remote) => {
          if (
            remote.mistakesConsecutiveCorrect &&
            remote.mistakesConsecutiveCorrect > 0
          ) {
            setSettings((prev) => ({
              ...prev,
              consecutiveCorrect:
                remote.mistakesConsecutiveCorrect || prev.consecutiveCorrect,
            }))
          }
        })
        .finally(() => {
          settingsLoadedRef.current = true
        })
    } else {
      settingsLoadedRef.current = true
    }
  }, [userId, examId, user?.uid])

  // Sync current question state with progress
  useEffect(() => {
    // Wait for auth to settle
    if (authLoading) return

    // Wait for progress to be loaded if we are waiting for user
    if (!isProgressLoaded && userId) return

    // Wait for remote sync if logged in, UNLESS we already have local data to show
    if (user?.uid && !isRemoteSynced && Object.keys(examProgress).length === 0)
      return

    if (questions && questions[currentQuestionIndex] && userId) {
      const qId = questions[currentQuestionIndex].id
      const progress = examProgress[qId]

      setIsBookmarked(progress?.bookmarked || false)

      if (!settings.mistakesMode) {
        if (progress?.status) {
          setIsSubmitted(true)
          if (progress.userSelection) {
            setSelectedAnswers(progress.userSelection)
          }
        } else {
          setIsSubmitted(false)
          setSelectedAnswers([])
        }
      }

      // Mark as ready once we've synced the first time
      setIsReady(true)
    }
  }, [
    questions,
    currentQuestionIndex,
    userId,
    examProgress,
    isProgressLoaded,
    authLoading,
    isRemoteSynced,
    user?.uid,
    settings.mistakesMode,
  ])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      setAllQuestions(fallbackQuestions)
      setTitle(exam?.title ?? examId)

      try {
        const response = await fetch(`/data/${examId}.json`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as DemoFile
        const mapped = (data.questions ?? [])
          .slice()
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((q) => {
            const options = (q.options ?? []).slice().sort((a, b) => {
              return a.label.localeCompare(b.label)
            })
            const correctIndex = options.findIndex(
              (o) => o.label === q.correctAnswer
            )
            const correctLabels = parseCorrectLabels(q.correctAnswer)
            const correctAnswers = correctLabels
              .map((label) => options.findIndex((o) => o.label === label))
              .filter((idx) => idx >= 0)
            const requiredSelections =
              q.type === 'multiple' ? Math.max(correctLabels.length, 1) : 1

            return {
              id: q.id,
              type: (q.type === 'multiple'
                ? 'multiple'
                : 'single') as PracticeQuestion['type'],
              text: htmlToText(q.content),
              contentHtml: q.content,
              options: options.map((o) => {
                const raw = o.content ?? ''
                const text = htmlToText(raw)
                const html = raw.includes('<') ? raw : undefined
                return { text, html }
              }),
              correctAnswers:
                correctAnswers.length > 0
                  ? correctAnswers
                  : [Math.max(correctIndex, 0)],
              requiredSelections,
              explanation: (q.explanation ?? '').trim(),
            }
          })

        if (!cancelled && mapped.length > 0) {
          setAllQuestions(mapped)
          setTitle(examId)
        }
      } catch {
        if (!cancelled && !exam) {
          setLoadError(`Demo data /data/${examId}.json not found.`)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [exam, examId, fallbackQuestions])

  const question = questions?.[currentQuestionIndex]
  const canSubmit = !isSubmitted && selectedAnswers.length > 0
  const isCorrect =
    isSubmitted &&
    question &&
    sameSelections(selectedAnswers, question.correctAnswers)

  const didAutoNavigate = useRef(initialQuestionIndex !== undefined)
  useEffect(() => {
    if (didAutoNavigate.current) return
    if (isLoading) return
    if (settings.mistakesMode) return
    if (!questions || questions.length === 0) return
    const entries = Object.entries(examProgress).filter(
      ([, p]) => p?.lastAnswered
    )
    if (entries.length === 0) return

    // Find max index among answered questions
    let maxIndex = -1
    // Optimize: Iterate backwards through questions to find the highest index that has progress
    for (let i = questions.length - 1; i >= 0; i--) {
      const q = questions[i]
      if (examProgress[q.id]?.lastAnswered) {
        maxIndex = i
        break
      }
    }

    if (maxIndex >= 0) {
      setCurrentQuestionIndex(maxIndex)
      didAutoNavigate.current = true
    }
  }, [questions, examProgress, isLoading, settings.mistakesMode])

  useEffect(() => {
    examProgressRef.current = examProgress
  }, [examProgress])
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])
  useEffect(() => {
    userUidRef.current = user?.uid
  }, [user?.uid])
  useEffect(() => {
    examIdRef.current = examId
  }, [examId])

  const handleSelectAnswer = (index: number) => {
    if (isSubmitted) return // Prevent changes if submitted

    if (!question) return

    if (question.type === 'single') {
      setSelectedAnswers([index])
    } else {
      setSelectedAnswers((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index)
        }
        return [...prev, index]
      })
    }
  }

  const handleSubmit = () => {
    if (!canSubmit || !question || !userId) return

    const correct = sameSelections(selectedAnswers, question.correctAnswers)
    const prevProgress = examProgress[question.id]
    const prevConsecutive = prevProgress?.consecutiveCorrect || 0
    const newConsecutive = correct ? prevConsecutive + 1 : 0

    let persistedStatus: 'correct' | 'incorrect'
    if (correct) {
      if (settings.mistakesMode) {
        persistedStatus =
          newConsecutive >= settings.consecutiveCorrect
            ? 'correct'
            : 'incorrect'
      } else {
        persistedStatus = 'correct'
      }
    } else {
      persistedStatus = 'incorrect'
    }

    const graduatedNow =
      settings.mistakesMode &&
      correct &&
      prevConsecutive < settings.consecutiveCorrect &&
      newConsecutive >= settings.consecutiveCorrect

    ProgressService.saveAnswer(
      userId,
      examId,
      question.id,
      persistedStatus,
      selectedAnswers,
      correct,
      { resetTimesWrong: graduatedNow }
    )
    if (user?.uid) {
      void RemoteProgress.saveAnswer(
        user.uid,
        examId,
        question.id,
        persistedStatus,
        selectedAnswers,
        examProgress[question.id],
        correct,
        { resetTimesWrong: graduatedNow }
      )
    } else {
      toast.message('Saved locally. Sign in to sync to cloud')
    }

    // Update local state
    setIsSubmitted(true)
    if (settings.mistakesMode) {
      setMistakesSessionStatus((prev) => ({
        ...prev,
        [question.id]: correct ? 'correct' : 'incorrect',
      }))
    }
    setExamProgress((prev) => {
      const prevEntry = prev[question.id] || {}
      const prevTimesWrong = prevEntry.timesWrong || 0
      let nextTimesWrong = prevTimesWrong
      if (!correct) {
        nextTimesWrong = prevTimesWrong + 1
      } else if (graduatedNow) {
        nextTimesWrong = 0
      }
      return {
        ...prev,
        [question.id]: {
          ...prevEntry,
          status: persistedStatus,
          lastAnswered: Date.now(),
          userSelection: selectedAnswers,
          consecutiveCorrect: correct ? newConsecutive : 0,
          timesWrong: nextTimesWrong,
        },
      }
    })

    if (graduatedNow) {
      toast.success(
        'Great job! This question has been removed from My Mistakes.',
        {
          description: `You answered it correctly ${settings.consecutiveCorrect} times in a row.`,
        }
      )
      setShowFireworks(true)
    }

    // Auto Next Logic
    if (settings.autoNext && correct) {
      setTimeout(() => {
        handleNext()
      }, 1000)
    }
  }

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setSelectedAnswers([])
      setIsSubmitted(false)
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setSelectedAnswers([])
      setIsSubmitted(false)
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleNavigate = (index: number) => {
    setSelectedAnswers([])
    setIsSubmitted(false)
    setCurrentQuestionIndex(index)
  }

  const handleSettingsChange = (next: PracticeSettings) => {
    setSettings(next)
    if (!userId) return
    ProgressService.saveExamSettings(userId, examId, {
      mistakesConsecutiveCorrect: next.consecutiveCorrect,
    })
    if (user?.uid) {
      void RemoteProgress.saveExamSettings(user.uid, examId, {
        mistakesConsecutiveCorrect: next.consecutiveCorrect,
      })
    }
  }

  const toggleBookmark = () => {
    if (!userId || !question) return
    const newState = !isBookmarked
    setIsBookmarked(newState)
    ProgressService.toggleBookmark(userId, examId, question.id)
    if (user?.uid) {
      void RemoteProgress.toggleBookmark(
        user.uid,
        examId,
        question.id,
        newState
      )
    } else {
      toast.message('Bookmark saved locally. Sign in to sync to cloud')
    }

    // Update local progress
    setExamProgress((prev) => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        bookmarked: newState,
      },
    }))
  }

  const handleClearProgress = () => {
    if (!userId) return
    setShowClearConfirm(true)
  }

  const confirmClearProgress = () => {
    ProgressService.clearExamProgress(userId, examId)
    if (user?.uid) {
      void RemoteProgress.clearExamProgress(user.uid, examId)
    }
    setExamProgress({})
    setIsSubmitted(false)
    setSelectedAnswers([])
    if (settings.mistakesMode) {
      setMistakeQuestions([])
    }
    setShowClearConfirm(false)
  }

  if ((isLoading && !questions) || !isReady || authLoading) {
    return <PracticeSkeleton />
  }

  if (loadError || !questions || !question) {
    return (
      <Main className='mx-auto w-full max-w-3xl pt-8'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <p className='text-destructive'>
            {loadError ?? 'Question not found'}
          </p>
          <Link to='/exams'>
            <Button>Back to Exams</Button>
          </Link>
        </div>
      </Main>
    )
  }

  const fontSizeSmClass = {
    small: 'sm:text-sm',
    normal: 'sm:text-base',
    large: 'sm:text-lg',
  }[settings.fontSize]

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Link to='/exams/$examId' params={{ examId }}>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-lg font-semibold'>
            {title} - {settings.mistakesMode ? 'My Mistakes' : 'Practice'}
          </h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
        </div>
      </Header>

      <div className='flex flex-1 items-start justify-center gap-2 pt-0 sm:gap-4'>
        <div className='w-full max-w-3xl px-2 sm:px-4'>
          <Main
            className={cn(
              'w-full px-0 py-2 pb-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom))] text-xs sm:py-6 lg:pr-0',
              fontSizeSmClass
            )}
          >
            <Card className='gap-3 py-3 sm:gap-6 sm:py-6'>
              <CardHeader className='relative px-2 sm:px-6'>
                <CardTitle className='leading-normal font-medium'>
                  <Badge variant='outline' className='me-2 mb-2'>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                  <Badge variant='secondary' className='mb-2'>
                    {formatQuestionType(question.type)}
                  </Badge>
                  <div className='mt-2'>
                    {question.contentHtml ? (
                      renderExamHtml(question.contentHtml)
                    ) : (
                      <p>{question.text}</p>
                    )}
                  </div>
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'absolute top-0 right-2 gap-2 sm:right-6',
                    isBookmarked && 'text-yellow-500 hover:text-yellow-600'
                  )}
                  onClick={toggleBookmark}
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4 self-start',
                      isBookmarked && 'fill-current'
                    )}
                  />
                </Button>
              </CardHeader>
              <CardContent className='space-y-3 px-2 sm:space-y-6 sm:px-6'>
                {question.type === 'single' ? (
                  <RadioGroup
                    key={question.id}
                    value={selectedAnswers[0]?.toString() ?? ''}
                    onValueChange={(val) => handleSelectAnswer(parseInt(val))}
                    disabled={isSubmitted}
                  >
                    {question.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex cursor-pointer items-center space-x-2 rounded-lg border p-2 transition-colors sm:space-x-3 sm:p-4',
                            isSubmitted &&
                              question.correctAnswers.includes(idx) &&
                              'border-green-500 bg-green-50 dark:bg-green-950/20',
                            isSubmitted &&
                              isSelected &&
                              !question.correctAnswers.includes(idx) &&
                              'border-red-500 bg-red-50 dark:bg-red-950/20',
                            !isSubmitted && 'hover:bg-muted/50',
                            isSelected &&
                              !isSubmitted &&
                              'border-primary bg-accent'
                          )}
                          onClick={() =>
                            !isSubmitted && handleSelectAnswer(idx)
                          }
                        >
                          <RadioGroupItem
                            value={idx.toString()}
                            id={`option-${idx}`}
                            className='sr-only'
                          />
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className={cn(
                              'flex-1 cursor-pointer text-xs leading-relaxed font-normal',
                              fontSizeSmClass
                            )}
                          >
                            {option.html
                              ? renderExamHtml(option.html)
                              : option.text}
                          </Label>
                          {isSubmitted &&
                            question.correctAnswers.includes(idx) && (
                              <CheckCircle className='h-5 w-5 text-green-500' />
                            )}
                          {isSubmitted &&
                            selectedAnswers.includes(idx) &&
                            !question.correctAnswers.includes(idx) && (
                              <XCircle className='h-5 w-5 text-red-500' />
                            )}
                        </div>
                      )
                    })}
                  </RadioGroup>
                ) : (
                  <div className='grid gap-3' key={question.id}>
                    {question.options.map((option, idx) => {
                      const isSelected = selectedAnswers.includes(idx)
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex cursor-pointer items-center space-x-2 rounded-lg border p-2 transition-colors sm:space-x-3 sm:p-4',
                            isSubmitted &&
                              question.correctAnswers.includes(idx) &&
                              'border-green-500 bg-green-50 dark:bg-green-950/20',
                            isSubmitted &&
                              isSelected &&
                              !question.correctAnswers.includes(idx) &&
                              'border-red-500 bg-red-50 dark:bg-red-950/20',
                            !isSubmitted && 'hover:bg-muted/50',
                            isSelected &&
                              !isSubmitted &&
                              'border-primary bg-accent'
                          )}
                          onClick={() =>
                            !isSubmitted && handleSelectAnswer(idx)
                          }
                        >
                          <Checkbox
                            id={`option-${idx}`}
                            checked={isSelected}
                            onCheckedChange={() =>
                              !isSubmitted && handleSelectAnswer(idx)
                            }
                            disabled={isSubmitted}
                            className='sr-only'
                          />
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <Label
                            htmlFor={`option-${idx}`}
                            className={cn(
                              'flex-1 cursor-pointer text-xs leading-relaxed font-normal',
                              fontSizeSmClass
                            )}
                          >
                            {option.html
                              ? renderExamHtml(option.html)
                              : option.text}
                          </Label>
                          {isSubmitted &&
                            question.correctAnswers.includes(idx) && (
                              <CheckCircle className='h-5 w-5 text-green-500' />
                            )}
                          {isSubmitted &&
                            isSelected &&
                            !question.correctAnswers.includes(idx) && (
                              <XCircle className='h-5 w-5 text-red-500' />
                            )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {isSubmitted && (
                  <div
                    className={cn(
                      'rounded-lg p-3 sm:p-4',
                      isCorrect
                        ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'
                        : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100'
                    )}
                  >
                    <p className='font-semibold'>
                      {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                    </p>
                    <div className='mt-2 flex gap-4 text-xs sm:gap-6 sm:text-sm'>
                      <p>
                        <span className='font-semibold'>Correct Answer: </span>
                        {question.correctAnswers
                          .map((i) => String.fromCharCode(65 + i))
                          .join(', ')}
                      </p>
                      <p>
                        <span className='font-semibold'>Your Answer: </span>
                        {selectedAnswers
                          .slice()
                          .sort((a, b) => a - b)
                          .map((i) => String.fromCharCode(65 + i))
                          .join(', ')}
                      </p>
                    </div>
                    {question.explanation && (
                      <div className='mt-2'>
                        <p className='font-semibold'>Explanation:</p>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className='relative flex items-center justify-between border-t p-3 sm:p-6'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  title='Previous Question'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                {!isSubmitted && (
                  <div className='absolute left-1/2 -translate-x-1/2'>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className='min-w-[120px]'
                    >
                      <CheckCircle className='h-4 w-4' />
                      Submit Answer
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  title='Next Question'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </CardFooter>
            </Card>
          </Main>
          <div className='h-[calc(var(--mobile-bar-height,0px)+env(safe-area-inset-bottom)+0.5rem)] lg:hidden' />
        </div>

        {/* Right Sidebar */}
        <div className='hidden py-6 pl-4 lg:block'>
          <PracticeSidebar
            questions={questions}
            progress={examProgress}
            currentQuestionIndex={currentQuestionIndex}
            onNavigate={handleNavigate}
            onClearProgress={handleClearProgress}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            mistakesSessionStatus={mistakesSessionStatus}
          />
        </div>
      </div>
      {showFireworks && (
        <FireworksOverlay onDone={() => setShowFireworks(false)} />
      )}
      <PracticeMobileBar
        questions={questions ?? []}
        progress={examProgress}
        currentQuestionIndex={currentQuestionIndex}
        onNavigate={handleNavigate}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        mistakesMode={settings.mistakesMode}
        mistakesSessionStatus={mistakesSessionStatus}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              progress for this exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearProgress}
              className='bg-red-600 hover:bg-red-700'
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FireworksOverlay({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const colors: string[] = [
      '#f97316',
      '#22c55e',
      '#3b82f6',
      '#eab308',
      '#ef4444',
      '#a855f7',
    ]
    type Particle = {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      size: number
      color: string
      alpha: number
    }
    const bursts: Particle[][] = []
    for (let i = 0; i < 3; i++) {
      const cx =
        Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1
      const cy =
        Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.2
      const particles: Particle[] = []
      const count = 60
      const base = Math.random() * 2 + 2
      const color = colors[Math.floor(Math.random() * colors.length)]
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2 + Math.random() * 0.3
        const speed = base + Math.random() * 2
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.floor(Math.random() * 20),
          size: 2 + Math.random() * 2,
          color,
          alpha: 1,
        })
      }
      bursts.push(particles)
    }
    let raf = 0
    let ended = false
    const tick = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      let active = 0
      for (const particles of bursts) {
        for (const p of particles) {
          if (p.life <= 0) continue
          active++
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.985
          p.vy = p.vy * 0.985 + 0.04
          p.life -= 1
          p.alpha = Math.max(0, p.life / 80)
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      if (active > 0 && !ended) {
        raf = requestAnimationFrame(tick)
      } else {
        ended = true
        onDone()
      }
    }
    raf = requestAnimationFrame(tick)
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [onDone])
  return (
    <div className='pointer-events-none fixed inset-0 z-50'>
      <canvas ref={canvasRef} className='h-full w-full' />
    </div>
  )
}
